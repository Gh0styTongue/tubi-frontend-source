import type {
  ErrorData,
  Events,
  FPSDropData,
  FragChangedData,
  ManifestParsedData,
} from '@adrise/hls.js';
import type Hls from '@adrise/hls.js';
import {
  buildHlsErrorMessage,
  PLAYER_ERROR_DETAILS,
  PLAYER_EVENTS,
  MAX_WAITING_TIME_BEFORE_RETURN_CDN,
  PLAYER_LOG_LEVEL,
  isPlayerDebugEnabled,
  ERROR_SOURCE,
  State,
  ErrorType,
  isHlsExtensionConfig,
  getUrlHost,
} from '@adrise/player';
import type {
  LiveAdapter,
  LiveAdapterConfig,
  SDKName,
  QualityLevel,
  ErrorEventData,
  AdError,
  FragLoadingEventData,
} from '@adrise/player';
import { convertHLSLevelToQualityLevelInfo } from '@adrise/player/lib/utils/levels';
import { PlayerEventEmitter } from '@adrise/player/lib/utils/PlayerEventEmitter';
import {
  buildRenditionString,
  debug,
  isTimeInBufferedRange,
  transBufferedRangesIntoArray,
} from '@adrise/player/lib/utils/tools';
import { trimQueryString } from '@adrise/utils/lib/url';

import { doesTheTextTrackMatchLanguage } from 'client/utils/language';
import { LIVE_NUDGE_OFFSET } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { areTextTrackArraysEqual } from 'common/utils/captionTools';

import { getHlsPlatformSpecificProps, getOverrideBufferConfig, getOverrideWebWorkerConfig } from '../../props/props';
import type { LivePlayerListeners, LiveAdPlayerWithApolloListeners, LiveAdStartEventData, LiveAdTimeEventData, LiveAdCompleteEventData, LiveAdPodCompleteEventData, LiveAdBeaconFailData } from '../types';
import ApolloLiveAdClient from '../utils/apolloLiveAdClient';
import type { LiveAdEventData } from '../utils/liveAdClient';
import LiveAdClient from '../utils/liveAdClient';

const CAPTION_TEXT_TRACK_KINDS = ['captions', 'subtitles'];

export default class HlsAdapter extends PlayerEventEmitter<LivePlayerListeners|LiveAdPlayerWithApolloListeners> implements LiveAdapter {
  ExternalHls: typeof Hls | undefined;

  player?: Hls;

  static Hls: typeof Hls;

  videoElement: HTMLVideoElement;

  eventHandlers: Record<string, unknown>;

  mediaUrl: string;

  config: LiveAdapterConfig;

  state: State = State.idle;

  fps: number = 0;

  private cdn: string = '';

  private totalDroppedFrames: number = 0;

  private shouldReportBufferChange: boolean;

  private currentLanguage?: string;

  private textTrackSet: WeakSet<TextTrack> = new WeakSet();

  private yospaceAdClient?: LiveAdClient;

  private qualityLevelList: QualityLevel[] = [];

  private lastHlsLevelIndex: number = -1;

  private videoStarted: boolean = false;

  private log: (...args: any[]) => void = () => {};

  private fetchCdnInterval?: ReturnType<typeof setTimeout>;

  private apolloAdClient?: ApolloLiveAdClient;

  private captionsTracks: TextTrack[] = [];

  get SDKName(): SDKName {
    return 'hls.js';
  }

  get Hls(): typeof Hls {
    return HlsAdapter.Hls;
  }

  static loadScript = (config: Partial<LiveAdapterConfig>): Promise<void[]> => {
    /* istanbul ignore else */
    if (isHlsExtensionConfig(config.extensionConfig) && config.extensionConfig.externalHlsResolver) {
      const hlsResolver = config.extensionConfig.externalHlsResolver
        .then((ExternalHls: typeof Hls): void => {
          HlsAdapter.Hls = ExternalHls;
        });
      return Promise.all([hlsResolver]);
    }

    return Promise.all([Promise.reject('extensionConfig.externalHlsResolver must have value!')]);
  };

  constructor(config: LiveAdapterConfig) {
    super();

    this.config = config;
    const {
      videoElement,
      eventHandlers = {},
      shouldReportBufferChange = false,
      mediaUrl,
    } = config;
    this.videoElement = videoElement;
    this.eventHandlers = eventHandlers;
    this.mediaUrl = mediaUrl;
    this.shouldReportBufferChange = shouldReportBufferChange;
    if (isPlayerDebugEnabled(config.debugLevel)) {
      this.log = debug('HlsLiveAdapter');
    }
  }

  getPlayer = (): Hls | undefined => this.player;

  static getExternalHls = (): typeof Hls => HlsAdapter.Hls;

  async setup() {
    this.log('setup');
    try {
      const {
        videoElement,
        enableApolloAdClient,
        enableProgressiveFetch,
        startLevel,
      }: LiveAdapterConfig = this.config;
      if (!HlsAdapter.Hls) {
        this.log('load hls.js');
        await HlsAdapter.loadScript(this.config);
        this.log('load hls.js finish');
        if (this.state === State.destroyed) {
          this.log('The live adapter gets destroyed after the script download.');
          return;
        }
      }
      const player = new HlsAdapter.Hls({
        debug: FeatureSwitchManager.get(['Logging', 'Player']) === PLAYER_LOG_LEVEL.SDK_LEVEL,
        // Comcast/Cox boxes consume less memory when web workers are set to false.
        enableWorker: false,
        nudgeOffset: LIVE_NUDGE_OFFSET,
        // we are setting the max buffer length in seconds at any point in time
        // in this interval (20, 60)
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        ...getHlsPlatformSpecificProps({ enableCEA708Captions: true, emeEnabled: false, startLevel }),
        ...getOverrideWebWorkerConfig(),
        ...getOverrideBufferConfig(),
        backBufferLength: 15,
        progressive: enableProgressiveFetch,
      });
      this.player = player;
      player.subtitleDisplay = false;
      if (enableApolloAdClient) {
        this.setupApolloAdClient();
      } else {
        this.setupYospaceAdClient();
      }
      this.bindEvents();
      this.attachMedia(videoElement);
    } catch (error) {
      /* istanbul ignore next */
      logger.warn('Failed to load hls.js');
    }
  }

  private setupApolloAdClient() {
    this.log('setup ad client with apollo');
    const { videoElement, debugLevel } = this.config;
    if (this.player && HlsAdapter.Hls) {
      const { Events } = HlsAdapter.Hls;
      this.apolloAdClient = new ApolloLiveAdClient({
        videoElement,
        player: this.player,
        eventName: Events.FRAG_PARSING_METADATA,
        debug: isPlayerDebugEnabled(debugLevel),
      });
      this.attachApolloAdClientEvents();
    }
  }

  attachApolloAdClientEvents = () => {
    this.apolloAdClient?.on(PLAYER_EVENTS.adStart, this.emitAdStart);
    this.apolloAdClient?.on(PLAYER_EVENTS.adTime, this.emitAdTime);
    this.apolloAdClient?.on(PLAYER_EVENTS.adComplete, this.emitAdComplete);
    this.apolloAdClient?.on(PLAYER_EVENTS.adPodComplete, this.emitAdPodComplete);
    this.apolloAdClient?.on(PLAYER_EVENTS.adBeaconFail, this.emitAdBeaconFailed);
  };

  private setupYospaceAdClient() {
    this.log('setup ad client');
    const { videoElement, debugLevel } = this.config;
    this.yospaceAdClient = new LiveAdClient({
      videoElement,
      debug: isPlayerDebugEnabled(debugLevel),
    });
    this.attachYospaceAdClientEvents();
  }

  getCurrentLevel() {
    const player = this.player;
    if (!player) return undefined;
    const { currentLevel, levels } = player;
    return levels?.[currentLevel];
  }

  getCodecs(): string {
    return this.getCurrentLevel()?.codecSet ?? '';
  }

  getVideoCodec(): string {
    return this.getCurrentLevel()?.videoCodec ?? '';
  }

  getAudioCodec(): string {
    return this.getCurrentLevel()?.audioCodec ?? '';
  }

  getBitrate(): number {
    const level = this.getCurrentLevel();
    if (!level) return -1;
    const { bitrate, realBitrate } = level;
    return realBitrate > 0
      ? realBitrate
      : bitrate;
  }

  getResourcesRealhost(): Promise<string> {
    return new Promise((resolve) => {
      const startTime = new Date().getTime();
      this.fetchCdnInterval = setInterval(() => {
        let url;
        /* istanbul ignore next */
        if (this.player) {
          // @ts-expect-error: retrieve private property
          url = this.player.streamController?.fragCurrent?.url;
        }
        if (url) {
          clearInterval(this.fetchCdnInterval);
          const hostname = getUrlHost(url);
          this.cdn = hostname;
          resolve(hostname);
        } else /* istanbul ignore next */ if (new Date().getTime() - startTime >= MAX_WAITING_TIME_BEFORE_RETURN_CDN) {
          clearInterval(this.fetchCdnInterval);
          resolve('');
        }
      }, 500);
    });
  }

  /**
   * get the current rendition, e.g. '1280x720'
   */
  getRendition(): string {
    const level = this.getCurrentLevel();
    if (level) {
      if (level.name) {
        return level.name;
      }
      /* istanbul ignore else */
      if (level.bitrate) {
        return buildRenditionString({ width: level.width, height: level.height, bitrate: level.bitrate });
      }
    } else if (this.videoElement) {
      return buildRenditionString({ width: this.videoElement.videoWidth, height: this.videoElement.videoHeight });
    }
    return '';
  }

  loadSource(mediaUrl: string) {
    this.log('load source', mediaUrl);
    this.player?.loadSource(mediaUrl);
  }

  attachMedia(videoElement: HTMLVideoElement) {
    this.log('attach media');
    this.player?.attachMedia(videoElement);
  }

  emitReady = (event: Events.MANIFEST_PARSED, data: ManifestParsedData) => {
    this.log('manifest parsed', data);
    this.emit(PLAYER_EVENTS.ready);

    if (!data || !data.levels) {
      return;
    }
    this.qualityLevelList = [
      {
        bitrate: 0,
        width: 0,
        height: 0,
        label: 'Auto',
      },
      ...data.levels
        .map(convertHLSLevelToQualityLevelInfo)
        .sort((x, y) => y.bitrate - x.bitrate),
    ];

    this.emit(PLAYER_EVENTS.qualityListChange, {
      qualityList: this.qualityLevelList,
    });
  };

  emitTime = () => {
    if (!this.videoStarted) {
      return;
    }
    // We want to keep the live time event emitted as before while migrating to Apollo.
    // Will fix it after the migration finished
    // if (this.config.enableApolloAdClient && this.apolloAdClient?.isPlayingAd) return;
    this.emit(PLAYER_EVENTS.time, {
      position: this.getPosition(),
      duration: Infinity,
    });
  };

  emitPlay = () => {
    if (!this.videoStarted) {
      return;
    }
    this.emit(PLAYER_EVENTS.play);
    this.setState(State.playing);
  };

  emitPlaying = () => {
    if (!this.videoStarted) {
      return;
    }
    this.emitPlay();
  };

  emitPause = () => {
    if (!this.videoStarted) {
      return;
    }
    this.setState(State.paused);
    this.emit(PLAYER_EVENTS.pause);
  };

  emitAdStart = (event: LiveAdStartEventData) => {
    this.emit(PLAYER_EVENTS.adStart, event);
  };

  emitAdTime = (event: LiveAdTimeEventData) => {
    this.emit(PLAYER_EVENTS.adTime, event);
  };

  emitAdComplete = (event: LiveAdCompleteEventData) => {
    this.emit(PLAYER_EVENTS.adComplete, event);
  };

  emitAdPodComplete = (event: LiveAdPodCompleteEventData) => {
    this.emit(PLAYER_EVENTS.adPodComplete, event);
  };

  emitAdBeaconFailed = (error: AdError, data: LiveAdBeaconFailData) => {
    this.emit(PLAYER_EVENTS.adBeaconFail, error, data);
  };

  emitAdStartForYospace = (event: LiveAdEventData) => {
    this.emit(PLAYER_EVENTS.adStart, event);
  };

  emitAdTimeForYospace = (event: LiveAdEventData) => {
    this.emit(PLAYER_EVENTS.adTime, event);
  };

  emitAdCompleteForYospace = (event: LiveAdEventData) => {
    this.emit(PLAYER_EVENTS.adComplete, event);
  };

  /* istanbul ignore next */
  getBandwidthEstimate = () => {
    if (!this.player) return -1;
    // @ts-expect-error: get from the private property
    const { abrController: { bwEstimator } } = this.player;
    if (!bwEstimator) {
      return -1;
    }
    // use hls bandwidth estimate as bitrate
    // https://github.com/video-dev/hls.js/blob/master/docs/API.md#hlsbandwidthestimate
    // But as our version is too old, we need to use the internal API
    // https://github.com/video-dev/hls.js/commit/16685b3c04f928ec8417f0b239a387b1a50e61b4
    const estimate = bwEstimator?.getEstimate() ?? -1;
    return Number.isNaN(estimate) ? -1 : estimate;
  };

  private onBufferAppended = () => {
    const { buffered, currentTime: position } = this.videoElement;
    if (buffered.length === 0) return;
    this.emit(PLAYER_EVENTS.bufferChange, {
      bufferPercent: 100,
      position,
      duration: buffered.end(buffered.length - 1),
    });
  };

  bindEvents = (remove = false) => {
    const {
      waitingHandler = () => {},
      canplayHandler = () => {},
      timeUpdateHandler = () => {},
      loadStartHandler = () => {},
    } = this.eventHandlers;

    const hlsKey = remove ? 'off' : 'on';
    const nativeKey = remove ? 'removeEventListener' : 'addEventListener';
    if (this.player && HlsAdapter.Hls) {
      const { Events } = HlsAdapter.Hls;
      const operate = this.player[hlsKey];
      operate.call(this.player, Events.FRAG_PARSED, this.updateFPS);
      operate.call(this.player, Events.FRAG_CHANGED, this.onFragChanged);
      operate.call(this.player, Events.FPS_DROP, this.updateTotalDroppedFrames);
      operate.call(this.player, Events.MANIFEST_PARSED, this.emitReady);
      operate.call(this.player, Events.ERROR, this.hlsErrorHandler);
      operate.call(this.player, Events.FRAG_LOADING, this.onFragLoading);
      this.videoElement[nativeKey]?.('timeupdate', this.emitTime);
      this.videoElement[nativeKey]?.('error', this.nativeErrorHandler);
      if (this.shouldReportBufferChange) {
        operate.call(this.player, Events.BUFFER_APPENDED, this.onBufferAppended);
      }
    } else {
      logger.error(`${this.player} or ${HlsAdapter.Hls} do not exist`);
    }

    // The js-dom doesn't implement the textTracks well. So I add optional chaining here to prevent error in the test.
    /* istanbul ignore next */
    this.videoElement.textTracks?.[nativeKey]?.('change', this.captionsListChange);
    this.videoElement.textTracks?.[nativeKey]?.('addtrack', this.textTrackListChangeHandler);
    this.videoElement.textTracks?.[nativeKey]?.('removetrack', this.textTrackListChangeHandler);
    this.videoElement[nativeKey]('playing', this.emitPlaying);
    this.videoElement[nativeKey]('play', this.emitPlay);
    this.videoElement[nativeKey]('pause', this.emitPause);
    this.videoElement[nativeKey]('waiting', waitingHandler as EventListenerObject);
    this.videoElement[nativeKey]('canplay', canplayHandler as EventListenerObject);
    this.videoElement[nativeKey]('loadstart', loadStartHandler as EventListenerObject);
    this.videoElement[nativeKey]('timeupdate', timeUpdateHandler as EventListenerObject);
    this.videoElement[nativeKey]('timeupdate', this.checkForTextTracks);
  };

  attachYospaceAdClientEvents = () => {
    this.yospaceAdClient?.on(PLAYER_EVENTS.adStart, this.emitAdStartForYospace);
    this.yospaceAdClient?.on(PLAYER_EVENTS.adTime, this.emitAdTimeForYospace);
    this.yospaceAdClient?.on(PLAYER_EVENTS.adComplete, this.emitAdCompleteForYospace);
  };

  captionsListChange = () => {
    this.captionsTracks = Array.from(this.videoElement.textTracks || []).filter(track => track.kind === 'captions');
    this.emit(PLAYER_EVENTS.captionsListChange, this.captionsTracks);
    this.videoElement.removeEventListener('timeupdate', this.checkForTextTracks);
  };

  private checkForTextTracks = () => {
    const newCaptionsTracks = Array.from(this.videoElement.textTracks || []).filter(track => track.kind === 'captions');
    if (!areTextTrackArraysEqual(this.captionsTracks, newCaptionsTracks)) {
      this.captionsListChange();
    }
  };

  private nativeErrorHandler = (e?: Error | Event) => {
    const { reload } = this.eventHandlers;
    /**
     * The event listener will throw an event on the video element.
     * That's useless for us.
     * We should get the error attribute instead.
     */
    const error = e && !(e instanceof Event)
      ? e
      : this.videoElement.error;
    const code = error instanceof MediaError && error.code;
    this.emit(PLAYER_EVENTS.error, {
      type: ErrorType.MEDIA_ERROR,
      code: typeof code === 'number' ? code : undefined,
      message: error?.message,
      fatal: true,
      error: error!,
      errorSource: ERROR_SOURCE.NATIVE_ERROR,
    });
    this.log('native error', error);
    if (typeof code === 'number' && code > 2 && typeof reload === 'function') {
      // Try to reload the player to recover the playback no matter what error we met.
      // Because the user can't pause the playback and we need to always provide them the latest stream.
      reload(error as MediaError);
    }
  };

  private hlsErrorHandler = (event: string, data: ErrorData) => {
    const { type, fatal } = data;
    // We ignore non-fatal level switch error because it does not harm the user.
    if (!data.fatal && data.details === HlsAdapter.Hls?.ErrorDetails.LEVEL_SWITCH_ERROR) {
      return;
    }
    let fragmentRetryTimes;
    let levelLoadTimes;
    const levelIndex = data.frag?.level;
    /* istanbul ignore else */
    if (levelIndex !== undefined && this.player) {
      const currentLevel = this.player.levels[levelIndex];
      fragmentRetryTimes = currentLevel?.fragmentError;
      levelLoadTimes = currentLevel?.loadError;
    }
    const { reload } = this.eventHandlers;
    const error: ErrorEventData & { message: string } = {
      ...data,
      levelUrl: data.url ? trimQueryString(data.url) : undefined,
      fragUrl: data.frag?.url ? trimQueryString(data.frag?.url) : undefined,
      fragmentRetryTimes,
      levelLoadTimes,
      message: buildHlsErrorMessage(data, HlsAdapter.Hls),
      errorSource: ERROR_SOURCE.HLS_EXTENSION_ERROR,
    };
    // These attributes are cyclic.
    delete error.loader;
    delete error.context;
    delete error.networkDetails;
    if (this.config.enableApolloAdClient && this.apolloAdClient?.isPlayingAd) {
      this.emit(PLAYER_EVENTS.adError, error, this.apolloAdClient?.getCurrentAd());
    } else {
      this.emit(PLAYER_EVENTS.error, error);
    }
    this.log('hls error', error);

    // we will special handle the PLAYER_ERROR_DETAILS.LINEAR_SESSION_EXPIRED
    if (error.message === PLAYER_ERROR_DETAILS.LINEAR_SESSION_EXPIRED) {
      this.emit(PLAYER_EVENTS.linearSessionExpired, { source: 'hlsErrorHandler', error });
      return;
    }

    if (fatal && typeof reload === 'function') {
      // Try to reload the player to recover the playback no matter what error we met.
      // Because the user can't pause the playback and we need to always provide them the latest stream.
      reload(error, { needReattach: type === HlsAdapter.Hls?.ErrorTypes.MEDIA_ERROR });
    }
  };

  private onFragLoading = (event: Events.FRAG_LOADING, data: FragLoadingEventData) => {
    const { frag } = data;
    if (frag && frag.url) {
      this.cdn = new URL(frag.url).hostname;
    }
  };

  private updateFPS = () => {
    this.log('frag parsed');
    // https://github.com/video-dev/hls.js/issues/3722
    const { videoElement } = this;
    if (typeof videoElement.getVideoPlaybackQuality === 'function') {
      const videoPlaybackQuality = videoElement.getVideoPlaybackQuality();
      this.fps = videoPlaybackQuality.totalVideoFrames;
    } else {
      this.fps = (this.videoElement as any).webkitDecodedFrameCount ?? -1;
    }
  };

  private onFragChanged = (event: Events.FRAG_CHANGED, data: FragChangedData) => {
    const { level: hlsLevelIndex } = data.frag;
    if (this.lastHlsLevelIndex === hlsLevelIndex) return;

    this.lastHlsLevelIndex = hlsLevelIndex;
    /* istanbul ignore next */
    const hlsLevel = this.player?.levels[hlsLevelIndex];
    const qualityIndex = this.qualityLevelList.findIndex(level => level.bitrate === hlsLevel?.bitrate);
    this.emit(PLAYER_EVENTS.visualQualityChange, {
      qualityIndex,
      level: this.qualityLevelList[qualityIndex],
    });
  };

  private updateTotalDroppedFrames = (event: 'hlsFpsDrop', data: FPSDropData) => {
    this.totalDroppedFrames = data.totalDroppedFrames;
  };

  getActiveCaptions(): VTTCue[] {
    if (typeof this.currentLanguage !== 'string' || this.currentLanguage.toLowerCase() === 'off') {
      return [];
    }
    const textTrack = Array.from(this.videoElement?.textTracks || [])
      // We only support single language for linear now, so if user not select 'off', we will always return the active cues.
      .find(textTrack => textTrack.kind === 'captions' && textTrack.activeCues?.length);
    if (!textTrack) {
      return [];
    }
    const { activeCues } = textTrack;
    if (activeCues) {
      return Array.from(activeCues as unknown as VTTCue[]);
    }
    // There may be a situation that the vendor doesn't support `activeCues` or `cue`, such as safari.
    // But up to now, we only support this on FireTV and it works well.
    return [];
  }

  private textTrackListChangeHandler = () => {
    if (typeof this.currentLanguage === 'string') {
      this.setCaptions(this.currentLanguage);
    }
  };

  setCaptions(language: string) {
    if (!this.videoElement.textTracks) return;
    this.log('set captions', language);
    Array.from(this.videoElement.textTracks).forEach(track => {
      if (!CAPTION_TEXT_TRACK_KINDS.includes(track.kind)) {
        return;
      }
      /**
       * There are three modes for the TextTrack mode, you can see them here.
       * https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/mode
       * As we will render the subtitles by ourselves, so we set `hidden` for the selected captions.
       * In which case we can still get the captions and the native video won't render it.
       * And we will set the unselected caption to be `disabled`. That will save our bandwidth.
       */
      if (doesTheTextTrackMatchLanguage(track, language)) {
        if (track.kind === 'subtitles') {
          if (!this.textTrackSet.has(track)) {
            this.textTrackSet.add(track);
            /**
             * If we have loaded this channel before, the player will load the VTT stream with the manifest simultaneously.
             * In that case, it won't trigger a track list change event.
             * But it will show the caption silently.
             * So we need to listen to the cue change event so that we can disable it in time.
             */
            track.addEventListener('cuechange', function alwaysHideTrack() {
              if (this.mode === 'showing') {
                this.mode = 'hidden';
              }
            });
          }
        }
        if (track.mode !== 'hidden') {
          /**
           * We can't set VTT stream text track mode as hidden directly.
           * If we set the 'hidden', it will jump to 'showing' by itself.
           * So we need to set the 'hidden' value again.
           * We must rely on the track list change event because the cue change event will trigger a little later.
           * The user may see the caption during that time
           */
          if (track.kind === 'subtitles' && track.mode === 'disabled') {
            const hideTextTrack = () => {
              track.mode = 'hidden';
              this.videoElement.textTracks.removeEventListener('change', hideTextTrack);
            };
            this.videoElement.textTracks.addEventListener('change', hideTextTrack);
          }
          track.mode = 'hidden';
        }
      } else {
        track.mode = 'hidden';
      }
    });
    if (typeof this.currentLanguage === 'string' && this.currentLanguage !== language) {
      this.emit(PLAYER_EVENTS.captionsChange, language);
    }
    this.currentLanguage = language;
  }

  setVolume(volume: number) {
    this.log('set volume', volume);
    this.setMute(false);
    this.videoElement.volume = volume / 100;
  }

  getVolume(): number {
    return Math.floor(this.videoElement.volume * 100);
  }

  play = () => {
    this.log('play');
    this.player?.startLoad();
    const playPromise = this.videoElement.play();
    if (playPromise !== undefined && typeof playPromise.then === 'function') {
      playPromise.then(_ => {
        this.videoStarted = true;
        // The video play event might be triggered before play promise resolve
        // we should emit play after resolve to ensure it is always emitted
        this.emitPlay();
        this.log('play resolved');
      }).catch(() => {
        this.videoStarted = false;
        this.emit(PLAYER_EVENTS.autoStartNotAllowed);
        this.log('play rejected');
      });
    } else {
      this.videoStarted = true;
      this.log('play without promise');
    }
  };

  pause = () => {
    this.log('pause');
    this.videoElement.pause();
    // If we stop load before the player get ready, the player can't resume when we call the play action.
    if (this.videoElement.readyState > 3) {
      this.player?.stopLoad();
    }
  };

  isPaused(): boolean {
    return this.videoElement.paused;
  }

  stop = () => {};

  private setState(state: State) {
    this.log('set state', state);
    this.state = state;
  }

  getState(): State {
    return this.state;
  }

  /**
   * get the current playback position, in seconds
   */
  getPosition = (): number => {
    return this.videoElement.currentTime || 0;
  };

  getPrecisePosition(): number {
    return this.getPosition();
  }

  /**
   * get duration of the content, in seconds
   */
  getDuration(): number {
    return Infinity;
  }

  /**
   * Is the live player making use of a web worker to transmux segments?
   */
  getIsUsingWebWorker(): boolean {
    return this.player?.isUsingWebWorker ?? false;
  }

  remove() {
    try {
      this.log('remove');
      if (this.player) {
        this.player.detachMedia();
      }
      clearInterval(this.fetchCdnInterval);
      this.yospaceAdClient?.remove();
      this.apolloAdClient?.remove();
      this.player?.destroy();
      this.bindEvents(true);
      this.setState(State.destroyed);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  isAd(): boolean {
    return !!(this.yospaceAdClient?.isPlayingAd || this.apolloAdClient?.isPlayingAd);
  }

  setMute(isMuted: boolean) {
    this.log('set mute', isMuted);
    this.videoElement.muted = isMuted;
  }

  getMute(): boolean {
    return this.videoElement.muted;
  }

  getTotalDroppedFrames(): number {
    return this.totalDroppedFrames;
  }

  /**
   * The buffered range of the video stream as understood by
   * the hls
   */
  getBufferedVideoRange() {
    /* istanbul ignore next */
    if (!(this.player instanceof HlsAdapter.Hls)) return [];
    /* istanbul ignore next */
    if (!this.player?.videoBuffered) return [];
    return transBufferedRangesIntoArray(this.player?.videoBuffered);
  }

  /**
   * The buffered range of the audio stream as understood by
   * the hls
   */
  getBufferedAudioRange() {
    /* istanbul ignore next */
    if (!(this.player instanceof HlsAdapter.Hls)) return [];
    /* istanbul ignore next */
    if (!this.player?.audioBuffered) return [];
    return transBufferedRangesIntoArray(this.player?.audioBuffered);
  }

  /**
   * Is video buffered at the playhead?
   */
  getIsCurrentTimeVideoBuffered(): boolean {
    return isTimeInBufferedRange(this.getPrecisePosition(), this.getBufferedVideoRange());
  }

  /**
   * Is audio buffered at the playhead?
   */
  getIsCurrentTimeAudioBuffered(): boolean {
    return isTimeInBufferedRange(this.getPrecisePosition(), this.getBufferedAudioRange());
  }

  getCDN(): string | undefined {
    return this.cdn;
  }
}
