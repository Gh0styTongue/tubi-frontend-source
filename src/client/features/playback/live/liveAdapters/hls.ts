import type {
  ErrorData,
  Events,
  FPSDropData,
  FragChangedData,
  HlsConfig,
  ManifestParsedData,
  FragLoadingData,
  FragLoadedData,
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
  HLS_JS_LEVEL,
} from '@adrise/player';
import type {
  LiveAdapter,
  LiveAdapterConfig,
  SDKName,
  QualityLevel,
  ErrorEventData,
  AdError,
  FragDownloadStats,
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
import { uniqBy } from 'lodash';

import { doesTheTextTrackMatchLanguage } from 'client/utils/language';
import { LIVE_NUDGE_OFFSET } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { areTextTrackArraysEqual } from 'common/utils/captionTools';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { getHlsPlatformSpecificProps, getOverrideBufferConfig, getOverrideWebWorkerConfig } from '../../props/props';
import type { LivePlayerListeners, LiveAdPlayerWithApolloListeners, LiveAdStartEventData, LiveAdTimeEventData, LiveAdCompleteEventData, LiveAdPodCompleteEventData, LiveAdBeaconFailData } from '../types';
import ApolloLiveAdClient from '../utils/apolloLiveAdClient';
import { attachCdnHeadersDetect } from '../utils/cdnHeadersDetect';
import type { LiveAdEventData } from '../utils/liveAdClient';
import LiveAdClient from '../utils/liveAdClient';

const CAPTION_TEXT_TRACK_KINDS = ['captions', 'subtitles'];

export default class HlsAdapter extends PlayerEventEmitter<LivePlayerListeners|LiveAdPlayerWithApolloListeners> implements LiveAdapter {
  ExternalHls: typeof Hls | undefined;

  player?: Hls;

  static Hls: typeof Hls;

  videoElement: HTMLVideoElement;

  eventHandlers: LiveAdapterConfig['eventHandlers'];

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

  private startplayTiming?: 'on_ready' | 'on_loadeddata' | 'ready_loadeddata';

  private loadeddataHandler?: () => void;

  private fragDownloadStats: FragDownloadStats = {
    video: {
      totalDownloadSize: 0,
      totalDownloadTimeConsuming: 0,
      totalDownloadFragDuration: 0,
    },
    audio: {
      totalDownloadSize: 0,
      totalDownloadTimeConsuming: 0,
      totalDownloadFragDuration: 0,
    },
  };

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
      shouldReportBufferChange = false,
      mediaUrl,
    } = config;
    this.videoElement = videoElement;
    this.eventHandlers = config.eventHandlers;
    this.mediaUrl = mediaUrl;
    this.shouldReportBufferChange = shouldReportBufferChange;
    this.startplayTiming = config.startplayTiming;
    this.loadeddataHandler = config.eventHandlers.loadeddataHandler;
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
        retryLimit,
      } = this.config;
      if (!HlsAdapter.Hls) {
        this.log('load hls.js');
        await HlsAdapter.loadScript(this.config);
        this.log('load hls.js finish');
        if (this.state === State.destroyed) {
          this.log('The live adapter gets destroyed after the script download.');
          return;
        }
      }

      const platformSpecificProps = getHlsPlatformSpecificProps({ enableCEA708Captions: true, emeEnabled: false, startLevel });

      // Configure retry policies based on retryLimit
      const masterRetryCount = nullishCoalescingWrapper(retryLimit.master, 3);
      const variantRetryCount = nullishCoalescingWrapper(retryLimit.variant, 3);
      const fragRetryCount = nullishCoalescingWrapper(retryLimit.frag, 3);

      platformSpecificProps.playlistLoadPolicy = {
        default: {
          errorRetry: {
            maxNumRetry: variantRetryCount,
            retryDelayMs: 3000,
            maxRetryDelayMs: 64000,
            backoff: 'exponential',
          },
          timeoutRetry: {
            maxNumRetry: variantRetryCount,
            retryDelayMs: 3000,
            maxRetryDelayMs: 64000,
            backoff: 'linear',
          },
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 20000,
        },
      };
      platformSpecificProps.fragLoadPolicy = {
        default: {
          errorRetry: {
            maxNumRetry: fragRetryCount,
            retryDelayMs: 2000,
            maxRetryDelayMs: 64000,
            backoff: 'exponential',
          },
          timeoutRetry: {
            maxNumRetry: fragRetryCount,
            retryDelayMs: 1000,
            maxRetryDelayMs: 64000,
            backoff: 'linear',
          },
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 20000,
        },
      };
      platformSpecificProps.manifestLoadPolicy = {
        default: {
          errorRetry: {
            maxNumRetry: masterRetryCount,
            retryDelayMs: 2000,
            maxRetryDelayMs: 64000,
            backoff: 'exponential',
          },
          timeoutRetry: {
            maxNumRetry: masterRetryCount,
            retryDelayMs: 1000,
            maxRetryDelayMs: 64000,
            backoff: 'linear',
          },
          maxTimeToFirstByteMs: 10000,
          maxLoadTimeMs: 20000,
        },
      };
      if (__OTTPLATFORM__ === 'TIZEN') {
        /**
         * Had in-stream bufferStalledError increased on Tizen
         * We recently graduated this config
         * https://github.com/adRise/www/pull/25383/files#diff-454f2c0df2ec02f1d851097fa1151f4673eed57a9da978bc33a6cfabc22c87d1R181
         * Patch to verify if it's the cause
         */
        delete platformSpecificProps.nudgeMaxRetry;
      }

      const hlsConfig: Partial<HlsConfig> = {
        debug: FeatureSwitchManager.get(['Logging', 'Player']) === PLAYER_LOG_LEVEL.SDK_LEVEL,
        // Comcast/Cox boxes consume less memory when web workers are set to false.
        enableWorker: false,
        nudgeOffset: LIVE_NUDGE_OFFSET,
        // we are setting the max buffer length in seconds at any point in time
        // in this interval (20, 60)
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        ...platformSpecificProps,
        ...getOverrideWebWorkerConfig(),
        ...getOverrideBufferConfig(),
        ...this.getABRConfigs(),
        backBufferLength: 15,
        progressive: !!enableProgressiveFetch,
      };

      if (this.eventHandlers?.onCDNHeaders) {
        attachCdnHeadersDetect({
          HlsCls: HlsAdapter.Hls,
          hlsJsConfig: hlsConfig,
          onCDNHeaders: this.eventHandlers.onCDNHeaders,
        });
      }
      const player = new HlsAdapter.Hls(hlsConfig);
      this.player = player;
      player.subtitleDisplay = false;

      player.autoLevelCapping = this.config.autoLevelCapping || HLS_JS_LEVEL.AUTO;
      if (enableApolloAdClient) {
        this.setupApolloAdClient();
      } else {
        this.setupYospaceAdClient();
      }
      this.bindEvents();
      this.attachMedia(videoElement);
    } catch (error) {
      /* istanbul ignore next */
      logger.error(error, 'Failed to load hls.js: ');
    }
  }

  getSDKVersion(): string | undefined {
    if (this.Hls) {
      return this.Hls.version;
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

  getQualityLevel(): QualityLevel | undefined {
    const { player } = this;
    if (!player) return;
    const { currentLevel, levels } = player;
    if (!levels || !levels[currentLevel]) return;
    return convertHLSLevelToQualityLevelInfo((levels[currentLevel]));
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

  getCurrentVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  getContentVideoElement(): HTMLVideoElement {
    return this.videoElement;
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
    const timing = this.startplayTiming || 'on_ready';
    const shouldAttachLoadeddata = (timing === 'on_loadeddata' || timing === 'ready_loadeddata') && this.config.autoplay;
    if (this.player && HlsAdapter.Hls) {
      const { Events } = HlsAdapter.Hls;
      const operate = this.player[hlsKey];
      operate.call(this.player, Events.FRAG_PARSED, this.updateFPS);
      operate.call(this.player, Events.FRAG_CHANGED, this.onFragChanged);
      operate.call(this.player, Events.FPS_DROP, this.updateTotalDroppedFrames);
      operate.call(this.player, Events.MANIFEST_PARSED, this.emitReady);
      operate.call(this.player, Events.ERROR, this.hlsErrorHandler);
      operate.call(this.player, Events.FRAG_LOADING, this.onFragLoading);
      operate.call(this.player, Events.FRAG_LOADED, this.onFragLoaded);
      this.videoElement[nativeKey]?.('timeupdate', this.emitTime);
      this.videoElement[nativeKey]?.('error', this.nativeErrorHandler);
      if (this.shouldReportBufferChange) {
        operate.call(this.player, Events.BUFFER_APPENDED, this.onBufferAppended);
      }
    } else {
      logger.error(`${this.player} or ${HlsAdapter.Hls} do not exist when ${remove ? 'unbinding' : 'binding'} events`);
    }

    // The js-dom doesn't implement the textTracks well. So I add optional chaining here to prevent error in the test.
    /* istanbul ignore next */
    this.videoElement.textTracks?.[nativeKey]?.('change', this.captionsListChange);
    this.videoElement.textTracks?.[nativeKey]?.('addtrack', this.textTrackListChangeHandler);
    this.videoElement.textTracks?.[nativeKey]?.('removetrack', this.textTrackListChangeHandler);
    this.videoElement[nativeKey]('playing', this.emitPlaying);
    this.videoElement[nativeKey]('play', this.emitPlay);
    this.videoElement[nativeKey]('pause', this.emitPause);
    this.videoElement[nativeKey]('waiting', waitingHandler);
    this.videoElement[nativeKey]('canplay', canplayHandler);
    this.videoElement[nativeKey]('loadstart', loadStartHandler);
    this.videoElement[nativeKey]('timeupdate', timeUpdateHandler);
    this.videoElement[nativeKey]('timeupdate', this.checkForTextTracks);
    this.videoElement[nativeKey]('enterpictureinpicture', this.emitEnterPictureInPicture);
    this.videoElement[nativeKey]('leavepictureinpicture', this.emitLeavePictureInPicture);

    if (shouldAttachLoadeddata && this.loadeddataHandler) {
      this.videoElement[nativeKey]('loadeddata', this.onLoadeddata);
    }
  };

  private onLoadeddata = () => {
    if (this.loadeddataHandler) {
      this.loadeddataHandler();
    }
  };

  getABRConfigs = (): Partial<HlsConfig> => {
    const { enableFineTuneAbr, fineTuningForArea } = this.config;
    if (!enableFineTuneAbr) return {};
    return {
      // This parameter is used to control the bandwidth up factor for ABR switch, default is 0.7
      // We set it to 0.5 to make the switch up condition more strict
      abrBandWidthUpFactor: fineTuningForArea === 'mx' ? 0.5 : 0.8,
      // This parameter is used to control the maximum delay for starvation, default is 4 seconds
      // We set it to 2 seconds to strict the ABR switch condition
      maxStarvationDelay: fineTuningForArea === 'mx' ? 2 : 4,
      // This parameter is used to downgrade the level when the FPS drop, default is false
      // We found there FPS drops alongside with the bufferStalledError for 720p, we can try downgrade.
      capLevelOnFPSDrop: true,
    };
  };

  attachYospaceAdClientEvents = () => {
    this.yospaceAdClient?.on(PLAYER_EVENTS.adStart, this.emitAdStartForYospace);
    this.yospaceAdClient?.on(PLAYER_EVENTS.adTime, this.emitAdTimeForYospace);
    this.yospaceAdClient?.on(PLAYER_EVENTS.adComplete, this.emitAdCompleteForYospace);
  };

  captionsListChange = () => {
    // We need to fix the issue that the textTracks will be added multiple times.
    this.captionsTracks = uniqBy(Array.from(this.videoElement.textTracks || [])
      .filter(track => track.kind === 'captions'), (track) => track.label.toLowerCase());
    this.emit(PLAYER_EVENTS.captionsListChange, this.captionsTracks);
    this.videoElement.removeEventListener('timeupdate', this.checkForTextTracks);
  };

  private checkForTextTracks = () => {
    const newCaptionsTracks = Array.from(this.videoElement.textTracks || []).filter(track => track.kind === 'captions');
    if (!areTextTrackArraysEqual(this.captionsTracks, newCaptionsTracks)) {
      this.captionsListChange();
    }
  };

  private emitEnterPictureInPicture = () => {
    this.emit(PLAYER_EVENTS.enterPictureInPicture);
  };

  private emitLeavePictureInPicture = () => {
    this.emit(PLAYER_EVENTS.leavePictureInPicture);
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
    const errorEventData: ErrorEventData = {
      type: ErrorType.MEDIA_ERROR,
      code: typeof code === 'number' ? code : undefined,
      message: error?.message,
      fatal: true,
      error,
      errorSource: ERROR_SOURCE.NATIVE_ERROR,
    };
    this.emit(PLAYER_EVENTS.error, errorEventData);
    this.log('native error', error);
    if (typeof code === 'number' && code > 2 && typeof reload === 'function') {
      // Try to reload the player to recover the playback no matter what error we met.
      // Because the user can't pause the playback and we need to always provide them the latest stream.
      reload(errorEventData);
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

  private onFragLoading = (event: Events.FRAG_LOADING, data: FragLoadingData) => {
    const { frag } = data;
    if (frag && frag.url) {
      this.cdn = new URL(frag.url).hostname;
    }
  };

  private onFragLoaded = (event: Events.FRAG_LOADED, data: FragLoadedData) => {
    if (data.frag.type === 'subtitle') return;
    const fragType = data.frag.type === 'audio' ? 'audio' : 'video';
    this.fragDownloadStats[fragType].totalDownloadSize += data.frag.stats.total; // bytes
    this.fragDownloadStats[fragType].totalDownloadTimeConsuming += data.frag.stats.loading.end - data.frag.stats.loading.start; // milliseconds
    this.fragDownloadStats[fragType].totalDownloadFragDuration += data.frag.duration; // seconds
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

  enterPictureInPicture(): Promise<PictureInPictureWindow | void> {
    if (this.videoElement && !!this.videoElement.requestPictureInPicture) {
      return this.videoElement.requestPictureInPicture();
    }
    return Promise.reject(new Error('Picture-in-Picture is not supported'));
  }

  getFragDownloadStats(): FragDownloadStats {
    return this.fragDownloadStats;
  }

  /**
   * Calculate download speed in kbps by:
   * 1. Sum total bytes downloaded for video and audio
   * 2. Convert bytes to bits (* 8)
   * 3. Divide by total download time in seconds
   * Returns 0 if no download time recorded yet
   */
  getDownloadSpeed(): number {
    const totalTime = this.fragDownloadStats.video.totalDownloadTimeConsuming +
                     this.fragDownloadStats.audio.totalDownloadTimeConsuming;

    if (totalTime === 0) {
      return 0;
    }

    const totalBytes = this.fragDownloadStats.video.totalDownloadSize +
                      this.fragDownloadStats.audio.totalDownloadSize;
    return (totalBytes * 8 / 1000) / totalTime; // Convert to kbps
  }

  /**
   * Calculate average bitrate of downloaded fragments in kbps by:
   * 1. Sum total duration of downloaded video and audio fragments
   * 2. Sum total bytes downloaded for video and audio
   * 3. Convert bytes to bits (* 8)
   * 4. Divide total bits by total fragment duration
   * Returns 0 if no fragments have been downloaded yet
   */
  getFragDownloadBitrate(): number {
    // Get total duration of all downloaded fragments (video + audio)
    const totalDuration = Math.max(this.fragDownloadStats.video.totalDownloadFragDuration +
      this.fragDownloadStats.audio.totalDownloadFragDuration);
    if (totalDuration === 0) {
      return 0;
    }

    // Get total size in bytes of all downloaded fragments
    const totalBytes = this.fragDownloadStats.video.totalDownloadSize +
                      this.fragDownloadStats.audio.totalDownloadSize;

    // Convert to kbps by multiplying bytes by 8 (bits) and dividing by duration
    return (totalBytes * 8) / totalDuration / 1000; // Convert to kbps
  }
}
