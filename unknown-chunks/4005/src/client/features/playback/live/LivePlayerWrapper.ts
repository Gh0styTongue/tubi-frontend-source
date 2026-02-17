import type Hls from '@adrise/hls.js';
import type { HlsConfig,
} from '@adrise/hls.js';
import {
  ActionLevel,
  ERROR_SOURCE,
  interceptorManager,
  isPlayerDebugEnabled,
  PerformanceCollector,
  PLAYER_EVENTS,
  PLAYER_LOG_LEVEL,
  playerCommander,
  ErrorType,
  PlayerName,
  StartBufferingReason,
  StopBufferingReason,
} from '@adrise/player';
import type {
  AdError,
  BufferChangeEventData,
  ErrorEventData,
  HLS_JS_LEVEL,
  LiveAdapter,
  LiveAdapterConfig,
  QualityLevel,
  SDKInfo,
} from '@adrise/player';
import { PlayerEventEmitter } from '@adrise/player/lib/utils/PlayerEventEmitter';
import { debug } from '@adrise/player/lib/utils/tools';
import { now } from '@adrise/utils/lib/time';

import { trackLiveErrorReload, trackLivePauseRetry, trackVisualQualityChange } from 'client/features/playback/track/client-log';
import { trackLivePerformanceMetrics } from 'client/features/playback/track/client-log/trackLivePerformanceMetrics';
import { trackLivePlayerPerformanceMetrics } from 'client/features/playback/track/datadog';
import { generateRandomLogTrackId } from 'client/features/playback/utils/generateRandomLogTrackId';
import systemApi from 'client/systemApi';
import { isAppHidden } from 'client/systemApi/utils';
import { LINEAR_CONTENT_TYPE } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getLinearPageType } from 'common/utils/linearPageType';
import { trackLogging } from 'common/utils/track';

import HlsAdapter from './liveAdapters/hls';
import type { LiveAdPlayerWithApolloListeners, LiveAdPodCompleteEventData, LiveAdBeaconFailData, LivePlayerListeners, LiveAdStartEventData, LiveAdCompleteEventData, LinearSessionExpiredEventData } from './types';
import { getLiveExtensionConfig } from './utils/getLiveExtensionConfig';
import type { LiveAdEventData } from './utils/liveAdClient';
import { paused } from '../session/LiveVideoSession';

const BUFFER_TIME_THRESHOLD = 300;
const STALL_RETRY_MAX_COUNT = 3;
export interface LivePlayerWrapperParams {
  videoElement: HTMLVideoElement;
  mediaUrl: string;
  id?: string;
  title?: string;
  autoplay?: boolean;
  performanceCollectorEnabled?: boolean;
  shouldReportBufferChange?: boolean;
  useHlsNext?: boolean;
  enableCapLevelOnFSPDrop?: boolean;
  enableApolloAdClient?: boolean;
  enableProgressiveFetch?: boolean;
  stallRetryCount?: number;
  startLevel: typeof HLS_JS_LEVEL[keyof typeof HLS_JS_LEVEL];
}

export interface BufferStartEvent {
  startBufferReason: StartBufferingReason,
  elBufferStartTime: number,
  startTime: number,
}
export interface BufferEndEvent {
  stopBufferReason: StopBufferingReason,
  startBufferReason: StartBufferingReason,
  elBufferStartTime: number,
  elBufferEndTime: number,
  bufferingDuration: number,
}

export class LivePlayerWrapper extends PlayerEventEmitter<LivePlayerListeners | LiveAdPlayerWithApolloListeners> {
  isLivePlayer: true;

  videoElement: HTMLVideoElement;

  url: string;

  title: string;

  id: string;

  hls?: Hls;

  isDestroyed: boolean = false;

  performanceCollector?: PerformanceCollector;

  private stallTimer?: ReturnType<typeof setTimeout>;

  private stallRetryCount: number = 0;

  private adapter?: PlayerEventEmitter<LivePlayerListeners|LiveAdPlayerWithApolloListeners> & LiveAdapter;

  private useHlsNext: boolean = false;

  private previousAdPosition: number = 0;

  private preloaded: boolean = false;

  private playbackId: string;

  private onPreload = () => this.preloaded = true;

  autoplay: boolean;

  private currentBuffering?: {
    startTime: number,
    elStartTime: number,
    startReason: StartBufferingReason,
  };

  private config: LivePlayerWrapperParams;

  private log: (...args: any[]) => void;

  get SDKName() {
    return this.adapter?.SDKName;
  }

  playerName: PlayerName = PlayerName.Linear;

  // istanbul ignore next (for the super call)
  constructor(liveParams: LivePlayerWrapperParams) {
    super();
    this.config = { ...liveParams };

    const { videoElement, mediaUrl, id, title, autoplay = true, useHlsNext = false } = this.config;
    this.isLivePlayer = true;
    this.videoElement = videoElement;
    this.url = mediaUrl;
    this.id = id || '';
    this.title = title || '';
    this.autoplay = autoplay;
    this.useHlsNext = useHlsNext;
    this.stallRetryCount = liveParams.stallRetryCount || 0;
    if (!FeatureSwitchManager.isDefault(['Logging', 'Player'])) {
      this.log = debug('LivePlayerWrapper');
    } else {
      this.log = /* istanbul ignore next */ () => {};
    }

    this.playbackId = generateRandomLogTrackId();
  }

  getSDKInfo(): SDKInfo | undefined {
    /* istanbul ignore else */
    if (this.SDKName) {
      return {
        name: this.SDKName,
        version: this.adapter?.getSDKVersion?.() || '',
        isStable: !this.config.useHlsNext,
      };
    }
  }

  async setup() {
    const {
      videoElement,
      mediaUrl,
      id = '',
      title = '',
      autoplay = true,
      performanceCollectorEnabled,
      shouldReportBufferChange = false,
      enableCapLevelOnFSPDrop,
      enableApolloAdClient,
      startLevel,
    } = this.config;
    // for Hls, wait till Hls instantiated before bindingEvents
    await this.loadHls({
      videoElement,
      mediaUrl,
      title,
      id,
      autoplay,
      performanceCollectorEnabled,
      shouldReportBufferChange,
      enableCapLevelOnFSPDrop,
      enableApolloAdClient,
      startLevel,
    });
    this.bindEvents();
    this.attachFirstFrameEventListener();
    await this.adapter?.setup();

    if (this.adapter instanceof HlsAdapter) {
      this.hls = this.adapter.getPlayer();
    }

    this.setupPerformanceCollector({
      enableReport: !!performanceCollectorEnabled,
      contentId: id,
      videoElement,
    });
    this.hls?.loadSource(mediaUrl);

  }

  /* istanbul ignore next */
  loadHls = ({
    videoElement,
    mediaUrl,
    title = '',
    id = '',
    autoplay,
    performanceCollectorEnabled,
    shouldReportBufferChange = false,
    enableCapLevelOnFSPDrop,
    enableApolloAdClient,
    startLevel,
  }: LiveAdapterConfig) => {
    const useHlsNext = this.useHlsNext;
    const extensionConfig = getLiveExtensionConfig({
      useHlsNext,
      enableCapLevelOnFSPDrop,
    }) as {
      hls: Partial<HlsConfig>;
      externalHlsResolver: Promise<typeof Hls>;
    };
    const debugLevel = FeatureSwitchManager.isDefault(['Logging', 'Player']) ? PLAYER_LOG_LEVEL.DISABLE : FeatureSwitchManager.get(['Logging', 'Player']) as PLAYER_LOG_LEVEL;

    const hlsAdapter = new HlsAdapter({
      videoElement,
      mediaUrl,
      id,
      title,
      autoplay,
      debugLevel,
      performanceCollectorEnabled,
      shouldReportBufferChange,
      eventHandlers: {
        waitingHandler: this.waitingHandler,
        canplayHandler: this.canplayHandler,
        loadStartHandler: this.loadStartHandler,
        timeUpdateHandler: this.timeUpdateHandler,
        reload: this.reload,
      },
      useHlsNext,
      extensionConfig,
      onPreload: this.onPreload,
      enableCapLevelOnFSPDrop,
      enableApolloAdClient,
      enableProgressiveFetch: this.config.enableProgressiveFetch,
      startLevel,
    });
    this.adapter = hlsAdapter;
    this.hls = hlsAdapter.getPlayer?.();
  };

  bindEvents(remove = false) {
    const key = remove ? 'off' : 'on';
    this.adapter?.[key](PLAYER_EVENTS.ready, this.emitReady);
    this.adapter?.[key](PLAYER_EVENTS.error, this.emitError);
    this.adapter?.[key](PLAYER_EVENTS.play, this.playHandler);
    this.adapter?.[key](PLAYER_EVENTS.bufferChange, this.emitBufferAppended);
    this.adapter?.[key](PLAYER_EVENTS.time, this.time);
    this.adapter?.[key](PLAYER_EVENTS.pause, this.pauseHandler);
    this.adapter?.[key](PLAYER_EVENTS.captionsListChange, this.captionsListChange);
    this.adapter?.[key](PLAYER_EVENTS.captionsChange, this.subtitleChange);
    this.adapter?.[key](PLAYER_EVENTS.adStart, this.adStartHandler);
    this.adapter?.[key](PLAYER_EVENTS.adTime, this.adTimeHandler);
    this.adapter?.[key](PLAYER_EVENTS.adComplete, this.adCompleteHandler);
    this.adapter?.[key](PLAYER_EVENTS.adPodComplete, this.adPodCompleteHandler);
    this.adapter?.[key](PLAYER_EVENTS.adBeaconFail, this.adBeaconFailHandler);
    this.adapter?.[key](PLAYER_EVENTS.visualQualityChange, this.onVisualQualityChange);
    this.adapter?.[key](PLAYER_EVENTS.autoStartNotAllowed, this.onAutoStartNotAllowed);
    this.adapter?.[key](PLAYER_EVENTS.linearSessionExpired, this.emitLinearSessionExpire);
    this.adapter?.[key](PLAYER_EVENTS.enterPictureInPicture, this.emitEnterPictureInPicture);
    this.adapter?.[key](PLAYER_EVENTS.leavePictureInPicture, this.emitLeavePictureInPicture);

    if (this.autoplay) {
      this.addListener(PLAYER_EVENTS.ready, this.play);
    }

    // TODO: this should call reload method since pause is an illegal state for live news
    // Wait for Daniel's live session retry experiment graduate
    playerCommander[key](PLAYER_EVENTS.play, this.play);
    playerCommander[key](PLAYER_EVENTS.pause, this.pause);
  }

  private attachFirstFrameEventListener() {
    let firstFrameEmitted = false;
    const emitFirstFrame = () => {
      if (firstFrameEmitted) return;
      firstFrameEmitted = true;
      this.emit(PLAYER_EVENTS.firstFrame);
    };
    if (this.adapter) {
      this.adapter.once(PLAYER_EVENTS.time, emitFirstFrame);
      this.adapter.once(PLAYER_EVENTS.adTime, emitFirstFrame);
    }
  }

  onAutoStartNotAllowed = () => {
    this.emit(PLAYER_EVENTS.autoStartNotAllowed);
  };

  getBandwidthEstimate() {
    return this.adapter?.getBandwidthEstimate?.() ?? -1;
  }

  getPosition() {
    return this.adapter?.getPosition() || 0;
  }

  getTotalDroppedFrames() {
    return this.adapter?.getTotalDroppedFrames?.() || 0;
  }

  getFramesPerSecond() {
    return this.adapter?.getFPS?.() || 0;
  }

  // For Youbora
  getDuration() {
    return Infinity;
  }

  // For Youbora
  getResource() {
    return this.url;
  }

  // For Youbora
  getTitle() {
    return this.title;
  }

  // For Youbora
  getBitrate() {
    return this.adapter?.getBitrate?.() || 0;
  }

  /**
   * Is the live player making use of a web worker to transmux segments?
   */
  getIsUsingWebWorker(): boolean {
    return this.adapter?.getIsUsingWebWorker?.() ?? false;
  }

  /**
   * get the current rendition
   */
  getRendition(): string {
    return this.adapter?.getRendition?.() ?? '';
  }

  getCodecs(): string {
    return this.adapter?.getCodecs?.() ?? '';
  }

  getAudioCodec(): string {
    return this.adapter?.getAudioCodec?.() ?? '';
  }

  getVideoCodec(): string {
    return this.adapter?.getVideoCodec?.() ?? '';
  }

  // For Youbora
  getVideoElement() {
    return this.videoElement;
  }

  play = () => {
    // The user may go to the home screen before we bind the visibility change event. So we need to check the visibility before playing.
    if (isAppHidden() || !interceptorManager.isMethodAllowed('play', ActionLevel.CODE)) {
      return;
    }
    this.adapter?.play();
  };

  pause = () => {
    this.adapter?.pause();
  };

  getVolume(): number {
    return this.adapter?.getVolume?.() ?? -1;
  }

  setVolume(volume: number) {
    this.emit(PLAYER_EVENTS.volume, volume);
    this.adapter?.setVolume?.(volume);
  }

  setMute(isMuted: boolean) {
    this.emit(PLAYER_EVENTS.mute, isMuted);
    this.adapter?.setMute?.(isMuted);
  }

  getMute(): boolean {
    return this.adapter?.getMute?.() ?? false;
  }

  getActiveCaptions(language: string) {
    /* istanbul ignore next */
    return this.adapter?.getActiveCaptions?.(language) || [];
  }

  setCaptions(language: string) {
    this.adapter?.setCaptions(language);
  }

  getCDN() {
    return this.adapter?.getCDN?.();
  }

  getPlaybackId() {
    return this.playbackId;
  }

  enterPictureInPicture(): Promise<PictureInPictureWindow | void> {
    if (!this.adapter?.enterPictureInPicture) {
      return Promise.resolve();
    }
    return this.adapter.enterPictureInPicture();
  }

  destroy = () => {
    this.adapter?.emit(PLAYER_EVENTS.remove);
    this.emit(PLAYER_EVENTS.remove);
    this.isDestroyed = true;
    this.adapter?.remove();
    this.clearStallTimer();
    this.removeAllListeners();
    this.performanceCollector?.destroy();
    this.bindEvents(true);
  };

  private emitReady = () => {
    this.emit(PLAYER_EVENTS.ready);
  };

  private captionsListChange = (tracks: TextTrack[]) => {
    this.emit(PLAYER_EVENTS.captionsListChange, tracks);
  };

  private subtitleChange = (language: string) => {
    this.emit(PLAYER_EVENTS.captionsChange, language);
  };

  private playHandler = () => {
    this.stopBuffering(StopBufferingReason.el_play_event);
    this.emit(PLAYER_EVENTS.play);
  };

  private emitError = (error: ErrorEventData) => {
    this.emit(PLAYER_EVENTS.error, error);
  };

  private emitLinearSessionExpire = (error: LinearSessionExpiredEventData) => {
    this.emit(PLAYER_EVENTS.linearSessionExpired, error);
  };

  private emitEnterPictureInPicture = () => {
    this.emit(PLAYER_EVENTS.enterPictureInPicture);
  };

  private emitLeavePictureInPicture = () => {
    this.emit(PLAYER_EVENTS.leavePictureInPicture);
  };

  private time = () => {
    const position = this.getPosition();
    if (!position) {
      return;
    }
    this.emit(PLAYER_EVENTS.time, {
      position,
      duration: Infinity,
    });
  };

  private emitBufferAppended = (data: BufferChangeEventData) => {
    this.emit(PLAYER_EVENTS.bufferChange, data);
  };

  reload = async (
    err: ErrorEventData,
    { needReattach = false, manuallyReload = false }: { needReattach?: boolean, manuallyReload?: boolean } = {}
  ) => {
    // For native error like "chunk_demuxer_error_append_failed".
    // We need to detach the Hls element to restart the loading. Otherwise, it will get stuck.
    if (this.videoElement.error || needReattach) {
      this.hls?.recoverMediaError();
      if (!isAppHidden() && await systemApi.isHDMIConnected()) {
        this.play();
      }
    } else {
      this.hls?.startLoad();
    }
    trackLiveErrorReload({
      contentId: this.id,
      position: this.getPosition(),
      videoUrl: this.url,
      isAd: false,
      err,
      hasReattached: needReattach,
      manuallyReload,
      player: LINEAR_CONTENT_TYPE,
      isUsingWebWorker: this.adapter?.getIsUsingWebWorker?.() ?? false,
      wrapper: this,
    });
  };

  private pauseHandler = async () => {
    if (isAppHidden() || !await systemApi.isHDMIConnected()) {
      paused(await systemApi.isHDMIConnected() ? 'VISIBILITY' : 'HDMI');
      return;
    }
    // It's impossible to pause on the live stream now.
    // Whatever causes the pause event, we try to replay it.
    // If we pause for a long time, the screensaver will show.
    if (FeatureSwitchManager.isEnabled(['Player', 'AvoidResumeWhileLivePaused'])) {
      return;
    }

    this.play();
    trackLivePauseRetry({
      contentId: this.id,
      position: this.getPosition(),
    });
  };

  private timeUpdateHandler = () => {
    this.clearStallTimer();
    const { currentBuffering } = this;
    // Sometimes the timeupdate event would later than waiting event, we need to eliminate this case
    if (!currentBuffering || (now() - currentBuffering.startTime < BUFFER_TIME_THRESHOLD)) {
      return;
    }
    this.stopBuffering(StopBufferingReason.el_timeupdate_event_1);
  };

  private waitingHandler = () => {
    clearTimeout(this.stallTimer);
    /**
     * For the playback stall problem, we should rely on the hls.js.
     * However, during my test, I see the playback get stalled for a long time because of the network problems.
     * And it will recover if I try to reload.
     * So I add this handler for a fallback.
     */
    this.stallTimer = setTimeout(() => {
      const error: ErrorEventData = {
        type: ErrorType.MEDIA_ERROR,
        code: 'one-min-live-stall',
        message: 'live stream get stalled for more than one minute',
        fatal: true,
        errorSource: ERROR_SOURCE.OTHER,
      };
      this.emit(PLAYER_EVENTS.error, error);

      if (this.stallRetryCount >= STALL_RETRY_MAX_COUNT) {
        return;
      }

      this.stallRetryCount += 1;
      this.reload(error, { needReattach: true });

      delete this.currentBuffering;
    }, 60000);
    this.startBuffering(StartBufferingReason.el_waiting_event);
  };

  private loadStartHandler = () => {
    this.startBuffering(StartBufferingReason.el_load_start);
  };

  private canplayHandler = () => {
    this.clearStallTimer();
    this.stopBuffering(StopBufferingReason.el_canplay_event);
  };

  private startBuffering(reason: StartBufferingReason = StartBufferingReason.el_waiting_event) {
    const { currentTime } = this.videoElement;
    if (this.currentBuffering) {
      return;
    }
    this.currentBuffering = {
      startTime: now(),
      elStartTime: currentTime,
      startReason: reason,
    };
    this.emit(PLAYER_EVENTS.bufferStart, {
      startBufferReason: reason,
      elBufferStartTime: currentTime,
      startTime: this.currentBuffering.startTime,
    });
  }

  private stopBuffering(reason: StopBufferingReason) {
    const { currentBuffering } = this;
    if (!currentBuffering) return;

    const bufferTime = now() - currentBuffering.startTime;
    const { currentTime } = this.videoElement;

    if (currentTime === currentBuffering.elStartTime && reason === StopBufferingReason.el_timeupdate_event_1) {
      return;
    }
    const event: BufferEndEvent = {
      stopBufferReason: reason,
      startBufferReason: currentBuffering.startReason,
      elBufferStartTime: currentBuffering.elStartTime,
      elBufferEndTime: currentTime,
      bufferingDuration: bufferTime,
    };

    delete this.currentBuffering;
    this.emit(PLAYER_EVENTS.bufferEnd, event);

  }

  private clearStallTimer = () => {
    clearTimeout(this.stallTimer);
    this.stallRetryCount = 0;
  };

  private setupPerformanceCollector({
    enableReport,
    contentId,
    videoElement,
  }: {
    enableReport: boolean;
    contentId: string;
    videoElement: HTMLVideoElement
  }) {

    const debugLevel = this.getDebugLevel();
    this.performanceCollector = new PerformanceCollector({
      debug: isPlayerDebugEnabled(debugLevel),
      ExternalHls: this.hls ? HlsAdapter.getExternalHls?.() : undefined,
      reporter: (metrics: PerformanceCollector['timeMap']) => {
        if (!enableReport) {
          return;
        }
        trackLivePerformanceMetrics({
          contentId,
          metrics,
          preloaded: this.preloaded,
          streamUrl: this.url,
        });
        trackLivePlayerPerformanceMetrics(metrics);
      },
    });
    this.performanceCollector.setVideoElement(videoElement);

    if (this.hls) {
      this.performanceCollector.setHls(this.hls);
    }
  }

  private adStartHandler = (data: LiveAdStartEventData) => {
    this.emit(PLAYER_EVENTS.adStart, data);
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_AD_START,
      message: {
        ...data,
        contentId: this.id,
        pageType: getLinearPageType(),
      },
    });
    this.previousAdPosition = 0;
  };

  private adTimeHandler = (data: LiveAdEventData) => {
    this.emit(PLAYER_EVENTS.adTime, data);
    const { adPlayedDuration } = data;
    const currentAdPosition = Math.floor(adPlayedDuration);
    if (this.previousAdPosition === currentAdPosition) return;
    this.previousAdPosition = currentAdPosition;
    if (currentAdPosition % 10 !== 0) return;
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_AD_TIME,
      message: {
        ...data,
        contentId: this.id,
        pageType: getLinearPageType(),
      },
    });
  };

  private adCompleteHandler = (data: LiveAdCompleteEventData) => {
    this.emit(PLAYER_EVENTS.adComplete, data);
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_AD_COMPLETE,
      message: {
        ...data,
        contentId: this.id,
        pageType: getLinearPageType(),
      },
    });
  };

  private adPodCompleteHandler = (data: LiveAdPodCompleteEventData) => {
    this.emit(PLAYER_EVENTS.adPodComplete, data);
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_AD_POD_COMPLETE,
      message: {
        ...data,
        contentId: this.id,
        pageType: getLinearPageType(),
      },
    });
  };

  private adBeaconFailHandler = (error: AdError, data: LiveAdBeaconFailData) => {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_AD_BEACON_FAIL,
      message: {
        ...data,
        ...error,
        pageType: getLinearPageType(),
      },
    });
  };

  private onVisualQualityChange = ({ qualityIndex, level }: { qualityIndex: number, level: QualityLevel }) => {
    trackVisualQualityChange({
      contentId: this.id,
      qualityIndex,
      position: this.getPosition(),
      pageType: getLinearPageType(),
      playerType: LINEAR_CONTENT_TYPE,
      level,
    });
  };

  private getDebugLevel = () => {
    return FeatureSwitchManager.isDefault(['Logging', 'Player']) ? PLAYER_LOG_LEVEL.DISABLE : FeatureSwitchManager.get(['Logging', 'Player']) as PLAYER_LOG_LEVEL;
  };

  setDisplayArea = () => {
    this.adapter?.setDisplayArea?.();
  };

  isPaused(): boolean {
    return this.adapter?.isPaused() ?? true;
  }

  getResourcesRealhost(): Promise<string> {
    if (this.adapter && this.adapter.getResourcesRealhost) {
      return this.adapter.getResourcesRealhost?.();
    }
    return Promise.resolve('');
  }

  /**
   * Is video buffered at the playhead?
   */
  getIsCurrentTimeVideoBuffered(): boolean | undefined {
    if (!this.adapter) {
      return false;
    }
    return this.adapter.getIsCurrentTimeVideoBuffered?.();
  }

  /**
   * Is audio buffered at the playhead?
   */
  getIsCurrentTimeAudioBuffered(): boolean | undefined {
    if (!this.adapter) {
      return false;
    }
    return this.adapter.getIsCurrentTimeAudioBuffered?.();
  }

  getIsUsingApolloAdClient(): boolean {
    return !!this.config.enableApolloAdClient;
  }
}
