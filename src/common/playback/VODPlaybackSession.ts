import type { AbrLoggingData } from '@adrise/hls.js';
import type {
  Player,
  SeekEventData,
  BufferStartEventData,
  ErrorEventData,
  SeekedEventData,
  CanPlayEventData,
  StartLoadEventData,
  BufferEndEventData,
  SDKInfo,
  FragDownloadStats,
  BufferingType,
  BufferDataState,
  AdError,
  AdErrorEventData,
  CanHitCacheResult,
} from '@adrise/player';
import {
  PLAYER_EVENTS,
  PlayerName,
  StopBufferingReason,
  StartBufferingReason,
} from '@adrise/player';
import { now, mins } from '@adrise/utils/lib/time';
import { getArrayLastItem, toFixed2 } from '@adrise/utils/lib/tools';
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import Analytics from '@tubitv/analytics';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import cloneDeep from 'lodash/cloneDeep';
import flatten from 'lodash/flatten';
import type { ValueOf } from 'ts-essentials';

import {
  FREEZED_EMPTY_FUNCTION,
} from 'common/constants/constants';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import type { VideoResourceAttributes } from 'common/features/playback/services/VideoResourceManager';
import { getLocalAdUrlBlacklist, AD_URL_BLACKLIST_KEY } from 'common/features/playback/utils/getLocalAdUrlBlacklist';
import logger from 'common/helpers/logging';
import { isReuseAutoplayAndRelatedVideoResource } from 'common/selectors/experiments/ottMajorReuseAutoplayAndRelatedVideoResourceSelector';
import { activityTracker } from 'common/services/ActivityTracker';
import type { HighConversionSessionTrackType } from 'common/services/ActivityTracker';
import { THRESHOLDS_VERSION, BufferRatioGroup } from 'common/types/bufferRatioClassificationManager';
import type { NetworkFeatures } from 'common/types/playback';
import type { VideoResource, VideoResourceType, VIDEO_RESOURCE_CODEC, HDCPVersion, Video } from 'common/types/video';
import { QoSErrorType, QoSErrorCode, convertErrorToUnifiedEnum } from 'common/utils/convertErrorToUnifiedEnum';
import type { QoSErrorTypeValues, QoSErrorCodeValues } from 'common/utils/convertErrorToUnifiedEnum';
import { isDecodeError } from 'common/utils/error';
import { generateRandomLogTrackId } from 'common/utils/generateRandomLogTrackId';
import { setLocalData, getLocalData } from 'common/utils/localDataStorage';
import { transformContent } from 'common/utils/transformContent';
import { extractEpisodes } from 'common/utils/video';

export const START_STEP = {
  UNKNOWN: 0,
  START_LOAD: 1,
  VIEWED_FIRST_FRAME: 2, // first frame
  PLAY_STARTED: 3, // startup not freeze
};

export type PLAYBACK_SESSION_STARTUP_FAILURE_TYPE = 'UNKNOWN' | 'AD_POD_REQUEST' | 'PREROLL' | 'CONTENT';

type FeatureValue = string | boolean | number;

export type FeatureInfo = {
  recoverySeekTimeout?: FeatureValue;
  notHandleNonFatalDRMError?: FeatureValue;
  srcNotSupportedErrorRetry?: FeatureValue;
  contentStartupStallRecovery?: FeatureValue;
  skipBufferHoleInAdvance?: FeatureValue;
  fastFailOnLevelTimeoutAndFragLoadError?: FeatureValue;
  isFromBww?: FeatureValue;
  enableHlsCacheFragments?: FeatureValue;
};

type AdPodFetchData = {
  totalRequestDuration: number;
  totalCount: number;
  errorCount: number;
};

type SeekInfoItem = {
  from: number; // seconds
  to: number; // seconds
  startTime: number; // milliseconds
  endTime?: number; // milliseconds
};

type AbrLoggingDataEnhanced = AbrLoggingData & {
  buffering: [number, number][]; // [startTsInSecond, endTsInSecond]
  startup: number[]; // [startTsInSecond]
  seek: [number, number][]; // [startTsInSecond, endTsInSecond]
};

type HlsFragmentCacheStats = {
  cacheCount: number;
  reuseCount: number;
};

type ContentResumeInfo = {
  isResumePositionAtCuePoint: boolean;
  resumeStartupTime: number;
  hitCache: CanHitCacheResult | undefined;
};

export const SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION = 200;
export const SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION = 60 * 1000 * 60;
export const SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION = 60 * 1000;
const AD_URL_BLACKLIST_MAX_COUNT = 100;

const ENCOUNTERED_UNKNOWN_BUFFERING_KEY = 'encounteredUnknownBufferingKey';

export type VODPlaybackInfo = {
  trackId: string,
  contentId?: string,
  isSeries: boolean,
  isAutoplay: boolean,
  isFromAutoPlayDeliberate: boolean,
  isFromAutoPlayWhileUserPressedBack: boolean,
  isFromAutoPlayWhileVideoComplete: boolean,
  isContinueWatching: boolean,
  isDeeplink: boolean,
  isFromRelaunch: boolean,
  previousContentType: 'm' | 's' | null,
  resourceType?: VideoResourceType,
  codec?: VIDEO_RESOURCE_CODEC,
  hdcp?: HDCPVersion,
  sdkInfo?: SDKInfo,
  videoResourceAttributes?: VideoResourceAttributes[],
  deviceModel?: string,
  manufacturer?: string;
  browserVersion?: string;
  appVersion?: string;
  os?: string;
  osVersion?: string;
  isMobile?: boolean;
  cdn: string;
  startSteps: ValueOf<typeof START_STEP>[];
  startTs: number;
  adSetupTs: number;
  startLoadTs: number[];
  viewedTs: number[];
  currentTimeProgressedTs: number[];
  adStartSteps: ValueOf<typeof START_STEP>[][];
  adStartLoadTs: number[][];
  adViewedTs: number[][];
  adCurrentTimeProgressedTs: number[][];
  isSeeking: boolean;
  totalSeekDuration: number;
  totalSeekDurationOriginal: number;
  seekCount: number;
  currentSeekInfo?: SeekInfoItem;
  seekInfoList: (SeekInfoItem & { endTime: number })[];
  isBuffering: boolean;
  bufferingType?: BufferingType;
  bufferingDataState: BufferDataState;
  bufferingTs: number;
  totalBufferingDuration: number;
  totalBufferingDurationOriginal: number;
  bufferingCount: number;
  networkBufferingCount: number;
  totalNetworkBufferingDuration: number;
  firstBufferingStartTs: number;
  firstBufferingEndTs: number;
  lastBufferingEndTs: number;
  bufferingList: [number, number][]; // [startTsInSecond, endTsInSecond]
  joinTime: number; // from playback session to content/ad first frame viewed
  firstFrameDuration: number;
  firstFrameDurationOriginal: number;
  contentFirstFrameDuration: number; // from content start load to content first frame viewed
  contentFirstFrameTs: number;
  playbackViewTime: number;
  adPlaybackViewTime: number;
  totalContentResumeFirstFrameDuration: number;
  fallbackCount: number;
  breakOffCount: number;
  firstErrorCode: QoSErrorCodeValues;
  firstErrorType: QoSErrorTypeValues;
  errorCodeList: QoSErrorCodeValues[];
  errorTypeList: QoSErrorTypeValues[];
  errorCode: QoSErrorCodeValues;
  errorType: QoSErrorTypeValues;
  currentAdHappenedError: boolean;
  currentAdHappenedBuffering: boolean;
  adCount: number;
  errorAdCount: number;
  isAdBuffering: boolean;
  adBufferingTs: number;
  bufferingAdCount: number;
  totalAdBufferingDuration: number;
  totalAdFirstFrameDuration: number;
  isAdPodFetching: [boolean, boolean]; // 0 preroll, 1 midroll
  adPodFetchData: [AdPodFetchData, AdPodFetchData]; // 0 preroll, 1 midroll
  prerollAdsCount: number;
  isPreroll: boolean;
  isAd: boolean;
  features: FeatureInfo;
  adTimeupdateEmitted: boolean;
  inaccurateImpressionAdCount: number;
  currentAdImpressionFired: boolean;
  isRetrying: boolean;
  reloadCount: number;
  nudgeCount: number;
  adImpressions: { [key: string]: number };
  totalDownloadSize: number;
  totalDownloadTimeConsuming: number;
  totalDownloadFragDuration: number;
  totalVideoFrames: number | undefined;
  droppedVideoFrames: number | undefined;
  is_discarded: boolean;
  isHdmiDisconnecting: boolean;
  hdmiReconnectedCount: number;
  // how many times did user open BWW
  bwwOpenCount: number;
  // did user play something new using BWW
  bwwDidConvert: boolean;
  // did user see autoplay UI
  autoplayShown: boolean;
  // did user use arrow keys/enter in autoplay UI
  autoplayNavigated: boolean;
  // did user play new content via key press
  autoplayDeliberateConversion: boolean;
  // did user play new content due to timer expiring
  autoplayTimeoutConversion: boolean;
  // did user dismiss autoplay due to click mini player
  autoplayDismissByClickMiniPlayer: boolean;
  // did user dismiss autoplay due to press back
  autoplayDismissByPressBack: boolean;
  abrLoggingData: AbrLoggingDataEnhanced | undefined;
  networkFeatures: NetworkFeatures;
  bufferRatioGroupUpdate: {
    current: BufferRatioGroup;
    last: BufferRatioGroup;
    version: string;
    moved: boolean;
    window: number[];
  };
  playerDisplayMode: PlayerDisplayMode;
  playerDisplayModeTransitionCount: number;
  segmentTimelineMisalignment: boolean;
  firstFragDurationDiff: number;
  showingUIComponents: string[];
  thumbnailComponentRenderedMs: number;
  thumbnailsBlankMs: number;
  hlsFragmentCacheStats: HlsFragmentCacheStats | undefined;
  highConversionSessionTrackType?: HighConversionSessionTrackType;
  contentResumeInfo: ContentResumeInfo[];
  isResumePositionAtCuePoint: boolean;
  /** Number of manifest cache hits (master, level, audioTrack) */
  manifestCacheHitNum: number;
  /** Number of manifest requests (master, level, audioTrack) */
  manifestRequestNum: number;
};

type VODMultiPlaysInfo = {
  totalPlays: number;
  unknownBufferingPlays: number;
  encounteredUnknownBuffering: boolean;
  adUrlBlacklist: { ts: number; adUrl: string; error: string }[];
  previousPlaybackInfoUserExitPage: {
    trackId?: string;
    contentId?: string;
    exitPageTs?: number;
  };
  contentApiRequestCount: number;
  autoplayVideos: Video[];
  relatedVideos: Video[];
};

type EnforceRequirement<T> = { [K in keyof Required<T>]: T[K]; };

const initialPlaybackInfo: EnforceRequirement<VODPlaybackInfo> = {
  trackId: '',
  startTs: -1,
  adSetupTs: -1,
  contentId: '',
  isSeries: false,
  isAutoplay: false,
  isFromAutoPlayDeliberate: false,
  isFromAutoPlayWhileUserPressedBack: false,
  isFromAutoPlayWhileVideoComplete: false,
  isContinueWatching: false,
  isDeeplink: false,
  isFromRelaunch: false,
  previousContentType: null,
  resourceType: undefined,
  codec: undefined,
  hdcp: undefined,
  sdkInfo: undefined,
  videoResourceAttributes: [],
  deviceModel: '',
  manufacturer: '',
  browserVersion: '',
  appVersion: '',
  os: '',
  osVersion: '',
  isMobile: false,
  cdn: '',
  startSteps: [],
  startLoadTs: [],
  viewedTs: [],
  currentTimeProgressedTs: [],
  adStartSteps: [],
  adStartLoadTs: [],
  adViewedTs: [],
  adCurrentTimeProgressedTs: [],
  isSeeking: false,
  totalSeekDuration: 0,
  totalSeekDurationOriginal: 0,
  seekCount: 0,
  currentSeekInfo: undefined,
  seekInfoList: [],
  isBuffering: false,
  bufferingType: undefined,
  bufferingDataState: 'afterStartup',
  bufferingTs: 0,
  totalBufferingDuration: 0,
  totalBufferingDurationOriginal: 0,
  bufferingCount: 0,
  networkBufferingCount: 0,
  totalNetworkBufferingDuration: 0,
  firstBufferingStartTs: 0,
  firstBufferingEndTs: 0,
  lastBufferingEndTs: 0,
  bufferingList: [],
  joinTime: -1,
  firstFrameDuration: -1,
  firstFrameDurationOriginal: -1,
  contentFirstFrameDuration: -1,
  contentFirstFrameTs: 0,
  playbackViewTime: 0,
  adPlaybackViewTime: 0,
  totalContentResumeFirstFrameDuration: 0,
  fallbackCount: 0,
  breakOffCount: 0,
  firstErrorCode: QoSErrorCode.NONE_ERROR,
  firstErrorType: QoSErrorType.NONE_ERROR,
  errorCodeList: [],
  errorTypeList: [],
  errorCode: QoSErrorCode.NONE_ERROR,
  errorType: QoSErrorType.NONE_ERROR,
  currentAdHappenedError: false,
  currentAdHappenedBuffering: false,
  adCount: 0,
  errorAdCount: 0,
  isAdBuffering: false,
  adBufferingTs: 0,
  bufferingAdCount: 0,
  totalAdBufferingDuration: 0,
  totalAdFirstFrameDuration: 0,
  isAdPodFetching: [false, false],
  adPodFetchData: [{
    totalRequestDuration: 0,
    totalCount: 0,
    errorCount: 0,
  }, {
    totalRequestDuration: 0,
    totalCount: 0,
    errorCount: 0,
  }],
  prerollAdsCount: -1,
  isPreroll: false,
  isAd: false,
  features: {},
  adTimeupdateEmitted: false,
  inaccurateImpressionAdCount: 0,
  isRetrying: false,
  reloadCount: 0,
  nudgeCount: 0,
  adImpressions: {},
  totalDownloadSize: 0,
  totalDownloadTimeConsuming: 0,
  totalDownloadFragDuration: 0,
  totalVideoFrames: undefined,
  droppedVideoFrames: undefined,
  is_discarded: false,
  currentAdImpressionFired: false,
  isHdmiDisconnecting: false,
  hdmiReconnectedCount: 0,
  bwwOpenCount: 0,
  bwwDidConvert: false,
  autoplayShown: false,
  autoplayNavigated: false,
  autoplayDeliberateConversion: false,
  autoplayTimeoutConversion: false,
  autoplayDismissByClickMiniPlayer: false,
  autoplayDismissByPressBack: false,
  networkFeatures: {
    throughput: {
      mean: 0,
      std: 0,
      min: 0,
      max: 0,
    },
    ttfb: {
      mean: 0,
      std: 0,
      min: 0,
      max: 0,
    },
    records: [],
    recordsCSV: '',
  },
  bufferRatioGroupUpdate: {
    current: BufferRatioGroup.CORE,
    last: BufferRatioGroup.CORE,
    version: THRESHOLDS_VERSION,
    moved: false,
    window: [],
  },
  abrLoggingData: undefined,
  playerDisplayMode: PlayerDisplayMode.DEFAULT,
  playerDisplayModeTransitionCount: 0,
  segmentTimelineMisalignment: false,
  firstFragDurationDiff: 0,
  showingUIComponents: [],
  thumbnailComponentRenderedMs: 0,
  thumbnailsBlankMs: 0,
  hlsFragmentCacheStats: undefined,
  highConversionSessionTrackType: undefined,
  contentResumeInfo: [],
  isResumePositionAtCuePoint: true,
  manifestCacheHitNum: 0,
  manifestRequestNum: 0,
};

export enum VODPlaybackEvents {
  reportPlaybackSessionData = 'reportPlaybackSessionData',
  addViewTime = 'addViewTime',
  bufferingStart = 'bufferingStart',
  bufferingEnd = 'bufferingEnd',
  endPlayback = 'endPlayback',
}

type Listeners = {
  [VODPlaybackEvents.reportPlaybackSessionData]: (retrievedPlaybackInfo?: VODPlaybackInfo) => void;
  [VODPlaybackEvents.addViewTime]: () => void;
  [VODPlaybackEvents.bufferingStart]: (data: BufferStartEventData) => void;
  [VODPlaybackEvents.bufferingEnd]: (data: BufferEndEventData, stats: {
    bufferingDuration: number;
    bufferingStartTimeFromViewed: number;
    intervalFromLastBuffering?: number;
  }) => void;
  [VODPlaybackEvents.endPlayback]: () => void;
};

// VODPlaybackSession means playback of one content
export class VODPlaybackSession {

  private playbackInfo: VODPlaybackInfo = {
    ...cloneDeep(initialPlaybackInfo),
  };

  private previousPlaybackInfo: VODPlaybackInfo | undefined;

  private previousContentId?: string;

  private multiPlaysInfo: VODMultiPlaysInfo = {
    totalPlays: 0,
    unknownBufferingPlays: 0,
    encounteredUnknownBuffering: false,
    adUrlBlacklist: getLocalAdUrlBlacklist(),
    previousPlaybackInfoUserExitPage: {},
    contentApiRequestCount: 0,
    autoplayVideos: [],
    relatedVideos: [],
  };

  private player?: Player;

  private getVideoResource?: () => VideoResource | undefined;

  private videoResourceManager?: VideoResourceManager;

  private enableMemoryCleanupFix = false;

  private eventEmitter = new TypedEventEmitter<Listeners>();

  private isAppHiddenFn?: () => boolean;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private static _instance: VODPlaybackSession;

  static getInstance() {
    if (!this._instance) {
      this._instance = new VODPlaybackSession();
    }
    return this._instance;
  }

  static getVODPlaybackInfo = (): VODPlaybackInfo => {
    return this.getInstance().playbackInfo;
  };

  static getVODMultiPlaysInfo = (): VODMultiPlaysInfo => {
    return this.getInstance().multiPlaysInfo;
  };

  setIsAppHiddenFn = (fn?: () => boolean) => {
    this.isAppHiddenFn = fn;
  };

  manageEventListener = (player: Player, getVideoResource: () => VideoResource | undefined, videoResourceManager: VideoResourceManager | undefined, remove: boolean) => {
    const key = remove ? 'off' : 'on';
    if (remove) {
      this.player = undefined;
      this.getVideoResource = undefined;
      this.videoResourceManager = undefined;
    } else {
      this.player = player;
      this.getVideoResource = getVideoResource;
      this.videoResourceManager = videoResourceManager;
    }

    player[key](PLAYER_EVENTS.adPlayerSetup, this.adPlayerSetup);
    player[key](PLAYER_EVENTS.startLoad, this.startLoad);
    player[key](PLAYER_EVENTS.adStartLoad, this.adStartLoad);
    player[key](PLAYER_EVENTS.ready, this.loadeddata);
    player[key](PLAYER_EVENTS.canPlay, this.canPlay);
    player[key](PLAYER_EVENTS.adStart, this.adLoadeddata);
    player[key](PLAYER_EVENTS.adCanPlay, this.adCanPlay);
    player[key](PLAYER_EVENTS.currentTimeProgressed, this.currentTimeProgressed);
    player[key](PLAYER_EVENTS.adCurrentTimeProgressed, this.adCurrentTimeProgressed);
    player[key](PLAYER_EVENTS.bufferStart, this.bufferStart);
    player[key](PLAYER_EVENTS.bufferEnd, this.bufferEnd);
    player[key](PLAYER_EVENTS.adBufferStart, this.adBufferStart);
    player[key](PLAYER_EVENTS.adBufferEnd, this.adBufferEnd);
    player[key](PLAYER_EVENTS.seek, this.seekStart);
    player[key](PLAYER_EVENTS.seeked, this.seekEnd);
    player[key](PLAYER_EVENTS.adError, this.adError);
    player[key](PLAYER_EVENTS.pause, this.paused);
    player[key](PLAYER_EVENTS.adPause, this.paused);
    player[key](PLAYER_EVENTS.adTime, this.adTime);
    player[key](PLAYER_EVENTS.adQuartile, this.adQuartile);
    player[key](PLAYER_EVENTS.segmentTimelineMisalignment, this.segmentTimelineMisalignment);
  };

  startPlayback = (
    {
      isSeries,
      contentId,
      isAutoplay,
      isFromBrowseWhileWatching,
      isContinueWatching,
      isDeeplink,
      isFromRelaunch,
      isFromAutoPlayWhileUserPressedBack,
      isFromAutoPlayWhileVideoComplete,
      enableMemoryCleanupFix = false,
    }: {
      isSeries: boolean;
      contentId?: string;
      isAutoplay?: boolean
      isFromBrowseWhileWatching?: boolean
      isContinueWatching: boolean;
      isDeeplink: boolean;
      isFromRelaunch?: boolean;
      isFromAutoPlayWhileUserPressedBack?: boolean;
      isFromAutoPlayWhileVideoComplete?: boolean;
      enableMemoryCleanupFix?: boolean;
    }
  ) => {
    this.enableMemoryCleanupFix = enableMemoryCleanupFix;
    const { playbackInfo, multiPlaysInfo } = this;
    if (playbackInfo.startTs > 0) {
      this.endPlayback();
      this.resetPlaybackInfo();
    }
    if (multiPlaysInfo.totalPlays === 0) {
      multiPlaysInfo.encounteredUnknownBuffering = !!getLocalData(ENCOUNTERED_UNKNOWN_BUFFERING_KEY);
    }
    multiPlaysInfo.totalPlays++;
    playbackInfo.contentId = contentId;
    playbackInfo.isSeries = isSeries;
    playbackInfo.isAutoplay = !!isAutoplay;
    playbackInfo.isContinueWatching = isContinueWatching;
    playbackInfo.isDeeplink = isDeeplink;
    playbackInfo.isFromRelaunch = !!isFromRelaunch;
    playbackInfo.startTs = now();
    playbackInfo.trackId = generateRandomLogTrackId();
    playbackInfo.isFromAutoPlayWhileUserPressedBack = !!isFromAutoPlayWhileUserPressedBack;
    playbackInfo.isFromAutoPlayWhileVideoComplete = !!isFromAutoPlayWhileVideoComplete;
    playbackInfo.highConversionSessionTrackType = activityTracker.getHighConversionTrackType(true);
    if (isAutoplay && this.previousPlaybackInfo) {
      playbackInfo.previousContentType = this.previousPlaybackInfo.isSeries ? 's' : 'm';
    } else {
      playbackInfo.previousContentType = null;
    }

    // only set if true to avoid sending up extra data
    if (isFromBrowseWhileWatching) {
      this.setFeatureInfo('isFromBww', true);
    }

    if (!(contentId
        && this.multiPlaysInfo.previousPlaybackInfoUserExitPage.contentId === contentId
        && this.multiPlaysInfo.previousPlaybackInfoUserExitPage.exitPageTs
        && Date.now() - this.multiPlaysInfo.previousPlaybackInfoUserExitPage.exitPageTs < mins(3))) {
      // keep previous playback info user exit page if user plays the same content and it's been less than 3 minutes
      // user exited previous page session which may be caused by playback issue, we can report it in qos log
      // otherwise reset previous playback info user exit page
      this.multiPlaysInfo.previousPlaybackInfoUserExitPage = {};
    }

    // Defensive: ensure arrays are empty at start of playback to prevent accumulation
    // This handles edge cases where resetPlaybackInfo() might not have been called
    // Only when experiment is enabled
    if (enableMemoryCleanupFix) {
      playbackInfo.bufferingList = [];
      playbackInfo.seekInfoList = [];
      playbackInfo.errorCodeList = [];
      playbackInfo.errorTypeList = [];
      playbackInfo.startSteps = [];
      playbackInfo.adStartSteps = [];
      playbackInfo.contentResumeInfo = [];
    }
  };

  updateLatestData = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.resourceType = this.getVideoResource?.()?.type;
    playbackInfo.codec = this.getVideoResource?.()?.codec;
    playbackInfo.hdcp = this.getVideoResource?.()?.license_server?.hdcp_version;
    playbackInfo.videoResourceAttributes = this.videoResourceManager?.getVideoResourceAttributes();
    this.updateViewTime();

    const fragDownloadStats = this.player?.getFragDownloadStats?.();
    const { totalVideoFrames, droppedVideoFrames } = this.player?.getVideoPlaybackQuality?.() ?? {};
    const abrLoggingData = this.player?.getAbrLoggingData?.();
    const hlsFragmentCacheStats = this.player?.getHlsFragmentCacheStats?.();
    this.updateFragDownloadStats(fragDownloadStats);
    this.updateVideoFrames(totalVideoFrames, droppedVideoFrames);
    this.updateAbrLoggingData(abrLoggingData);
    this.updateHlsFragmentCacheStats(hlsFragmentCacheStats);

    const playerConfig = this.player?.getConfig?.();
    const enableHlsCacheFragments = playerConfig?.experimentalConfig?.enableHlsCacheFragments;
    if (enableHlsCacheFragments !== undefined) {
      this.setFeatureInfo('enableHlsCacheFragments', enableHlsCacheFragments);
    }
  };

  endPlayback = (isExitPageSession: boolean = false) => {
    // Guard against double calls - if startTs is -1, playback has already ended
    if (this.playbackInfo.startTs <= 0) {
      return;
    }
    this.eventEmitter.emit(VODPlaybackEvents.endPlayback);
    const playbackInfo = this.playbackInfo;
    this.checkInaccurateImpressionAd();
    if (playbackInfo.isSeeking) {
      this.seekEnd(undefined, false);
    }
    if (playbackInfo.isBuffering) {
      this.bufferEnd({
        reason: StopBufferingReason.one_playback_end,
      }, false);
    }
    if (playbackInfo.isAdBuffering) {
      this.adBufferEnd({
        reason: StopBufferingReason.one_playback_end,
      }, false);
    }
    this.updateLatestData();
    if (!playbackInfo.is_discarded) {
      this.eventEmitter.emit(VODPlaybackEvents.reportPlaybackSessionData);
    }
    if (isExitPageSession) {
      this.multiPlaysInfo.previousPlaybackInfoUserExitPage = {
        trackId: this.playbackInfo.trackId,
        contentId: this.playbackInfo.contentId,
        exitPageTs: Date.now(),
      };
      this.multiPlaysInfo.autoplayVideos.length = 0;
      this.multiPlaysInfo.relatedVideos.length = 0;
    } else {
      this.multiPlaysInfo.previousPlaybackInfoUserExitPage = {};
    }
  };

  updateViewTime = (): {
    tvt: number,
    atvt: number,
  } => {
    this.eventEmitter.emit(VODPlaybackEvents.addViewTime);
    return {
      tvt: this.playbackInfo.playbackViewTime,
      atvt: this.playbackInfo.adPlaybackViewTime,
    };
  };

  resetPlaybackInfo = () => {
    // Guard against double calls - if startTs is -1, playback info has already been reset
    // Don't overwrite previousPlaybackInfo with already-reset state
    if (this.playbackInfo.startTs <= 0) {
      return;
    }
    this.previousContentId = this.playbackInfo.contentId;
    const playbackInfo = this.playbackInfo;

    this.previousPlaybackInfo = cloneDeep(this.playbackInfo);

    if (this.enableMemoryCleanupFix) {
      playbackInfo.bufferingList.length = 0;
      playbackInfo.seekInfoList.length = 0;
      playbackInfo.errorCodeList.length = 0;
      playbackInfo.errorTypeList.length = 0;
      playbackInfo.startSteps.length = 0;
      playbackInfo.adStartSteps.length = 0;
      playbackInfo.contentResumeInfo.length = 0;
    }

    const cloneInitialPlaybackInfo = cloneDeep(initialPlaybackInfo);
    Object.assign(playbackInfo, cloneInitialPlaybackInfo);
  };

  getEventEmitter = (): typeof this.eventEmitter => {
    return this.eventEmitter;
  };

  fallback = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.fallbackCount++;
    playbackInfo.isRetrying = true;
  };

  reload = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.reloadCount++;
    playbackInfo.isRetrying = true;
  };

  breakOff = (error: ErrorEventData) : {
    errorType: QoSErrorTypeValues,
    errorCode: QoSErrorCodeValues,
  } => {
    const playbackInfo = this.playbackInfo;
    const { errorType, errorCode } = convertErrorToUnifiedEnum(error);
    if (playbackInfo.breakOffCount === 0) {
      playbackInfo.firstErrorType = errorType;
      playbackInfo.firstErrorCode = errorCode;
    }
    playbackInfo.errorTypeList.push(errorType);
    playbackInfo.errorCodeList.push(errorCode);
    playbackInfo.breakOffCount++;
    return {
      errorType,
      errorCode,
    };
  };

  error = (error: ErrorEventData) : {
    errorType: QoSErrorTypeValues,
    errorCode: QoSErrorCodeValues,
  } => {
    const playbackInfo = this.playbackInfo;
    const { errorType, errorCode } = convertErrorToUnifiedEnum(error);
    playbackInfo.errorType = errorType;
    playbackInfo.errorCode = errorCode;
    return {
      errorType,
      errorCode,
    };
  };

  bufferNudgeOnStall = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.nudgeCount++;
  };

  setFeatureInfo = (key: keyof FeatureInfo, value: FeatureValue) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.features[key] = value;
  };

  addViewTime = (viewTime: number) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.playbackViewTime += viewTime;
  };

  recordNetworkFeatures = (features: NetworkFeatures) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.networkFeatures = features;
  };

  recordBufferRatioGroupUpdate = ({
    current,
    last,
    version,
    moved,
    bufferRatioWindow,
  }: {
    current: BufferRatioGroup;
    last: BufferRatioGroup;
    version: string;
    moved: boolean;
    bufferRatioWindow: number[];
  }) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.bufferRatioGroupUpdate = {
      current,
      last,
      version,
      moved,
      window: bufferRatioWindow,
    };
  };

  addAdViewTime = (adViewTime: number) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.adPlaybackViewTime += adViewTime;
  };

  updateFragDownloadStats = (fragDownloadStats?: FragDownloadStats) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.totalDownloadSize = fragDownloadStats ? (fragDownloadStats.video.totalDownloadSize + fragDownloadStats.audio.totalDownloadSize) * 8 / 1000 : 0; // kbits
    playbackInfo.totalDownloadTimeConsuming = fragDownloadStats ? (fragDownloadStats.video.totalDownloadTimeConsuming + fragDownloadStats.audio.totalDownloadTimeConsuming) / 1000 : 0; // seconds
    playbackInfo.totalDownloadFragDuration = fragDownloadStats ? Math.max(fragDownloadStats.video.totalDownloadFragDuration, fragDownloadStats.audio.totalDownloadFragDuration) : 0; // seconds
  };

  updateVideoFrames = (totalVideoFrames: number | undefined, droppedVideoFrames: number | undefined) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.totalVideoFrames = totalVideoFrames;
    playbackInfo.droppedVideoFrames = droppedVideoFrames;
  };

  updateAbrLoggingData = (abrLoggingData: AbrLoggingData | undefined) => {
    const playbackInfo = this.playbackInfo;
    if (!abrLoggingData) {
      return;
    }
    const isSamplingData = abrLoggingData.download_speed.length > 0;
    playbackInfo.abrLoggingData = {
      ...abrLoggingData,
      buffering: isSamplingData ? playbackInfo.bufferingList : [],
      startup: isSamplingData ? playbackInfo.startLoadTs.map(ts => toFixed2(ts / 1000)) : [],
      seek: isSamplingData ? playbackInfo.seekInfoList.map(seek => [toFixed2(seek.startTime / 1000), toFixed2(seek.endTime / 1000)]) : [],
    };
  };

  updateHlsFragmentCacheStats = (hlsFragmentCacheStats?: HlsFragmentCacheStats) => {
    const playbackInfo = this.playbackInfo;
    if (!hlsFragmentCacheStats) {
      return;
    }
    playbackInfo.hlsFragmentCacheStats = hlsFragmentCacheStats;
  };

  setDiscarded = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.is_discarded = true;
  };

  setBufferingDataState = (dataState: BufferDataState) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.bufferingDataState = dataState;
  };

  hasResumeStage = () => {
    const playbackInfo = this.playbackInfo;
    return playbackInfo.startSteps.length > 1;
  };

  endDurationRecord = () => {
    this.seekEnd();
  };

  getLatestStartStep = () => {
    const playbackInfo = this.playbackInfo;
    const { startSteps } = playbackInfo;
    return getArrayLastItem(startSteps) ?? START_STEP.UNKNOWN;
  };

  getLatestAdPodStartSteps = () => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps } = playbackInfo;
    return getArrayLastItem(adStartSteps) ?? [];
  };

  setHdmiConnection = (isHdmiConnected: boolean) => {
    const playbackInfo = this.playbackInfo;
    if (isHdmiConnected && playbackInfo.isHdmiDisconnecting) {
      playbackInfo.isHdmiDisconnecting = false;
      playbackInfo.hdmiReconnectedCount++;
    }
    if (!isHdmiConnected) {
      playbackInfo.isHdmiDisconnecting = true;
    }
  };

  incrementBwwOpenCount = () => {
    this.playbackInfo.bwwOpenCount += 1;
  };

  setBwwDidConvert = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.bwwDidConvert = true;
  };

  setAutoplayShown = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayShown = true;
  };

  setAutoplayNavigated = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayNavigated = true;
  };

  setAutoplayDeliberateConversion = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayDeliberateConversion = true;
  };

  setAutoplayTimeoutConversion = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayTimeoutConversion = true;
  };

  setAutoplayDismissByClickMiniPlayer = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayDismissByClickMiniPlayer = true;
  };

  setAutoplayDismissByPressBack = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.autoplayDismissByPressBack = true;
  };

  private adPlayerSetup = (isPreroll: boolean = true) => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps, adStartLoadTs, adViewedTs, adCurrentTimeProgressedTs, isSeeking, isBuffering } = playbackInfo;

    if (isSeeking) {
      this.seekEnd();
    }
    if (isBuffering) {
      this.bufferEnd({
        reason: StopBufferingReason.ad_start_load,
      });
    }

    playbackInfo.isAd = true;
    playbackInfo.isPreroll = isPreroll;
    playbackInfo.adSetupTs = now();
    // new adPlayer, may need play multiple ads, regard as multiple startup process
    adStartSteps.push([]);
    adStartLoadTs.push([]);
    adViewedTs.push([]);
    adCurrentTimeProgressedTs.push([]);
  };

  private isLatestStartupFinished = () => {
    const playbackInfo = this.playbackInfo;
    const { startSteps } = playbackInfo;
    return startSteps.length > 0 && getArrayLastItem(startSteps) > START_STEP.START_LOAD;
  };

  private isLatestAdStartupFinished = () => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps } = playbackInfo;
    if (adStartSteps.length === 0) return false;
    const curAdStartStep = getArrayLastItem(adStartSteps);
    return curAdStartStep.length > 0 && getArrayLastItem(curAdStartStep) > START_STEP.START_LOAD;
  };

  private startLoad = (data: StartLoadEventData) => {
    const playbackInfo = this.playbackInfo;
    const { startSteps, startLoadTs, viewedTs, currentTimeProgressedTs, isAdBuffering } = playbackInfo;
    const deviceInfo = Analytics.getAnalyticsConfig();
    const isFirstStartLoad = startSteps.length === 0;
    const isResumeFromMidroll = this.isLatestStartupFinished() && data.isResumeFromAd && !data.isResumeFromPreroll;
    if (isFirstStartLoad || isResumeFromMidroll) { // previous startup has finished, set up a new one
      if (isAdBuffering) {
        this.adBufferEnd({
          reason: StopBufferingReason.content_start_load,
        });
      }
      // content player resume from ad case is regarded as new startup
      startSteps.push(START_STEP.START_LOAD);
      startLoadTs.push(Number(now().toFixed(2)));
      viewedTs.push(0);
      currentTimeProgressedTs.push(0);
      if (isResumeFromMidroll) {
        playbackInfo.contentResumeInfo.push({
          isResumePositionAtCuePoint: playbackInfo.isResumePositionAtCuePoint,
          resumeStartupTime: -1,
          hitCache: this.player?.canHitHlsFragmentCache?.(),
        });
      }
    }
    playbackInfo.isAd = false;
    playbackInfo.deviceModel = deviceInfo?.model;
    playbackInfo.manufacturer = deviceInfo?.manufacturer;
    playbackInfo.browserVersion = deviceInfo?.browser_version;
    playbackInfo.appVersion = deviceInfo?.app_version;
    playbackInfo.os = deviceInfo?.os;
    playbackInfo.osVersion = deviceInfo?.os_version;
    playbackInfo.isMobile = deviceInfo?.is_mobile;
    playbackInfo.cdn = this.player?.getCDN?.() ?? '';
    playbackInfo.sdkInfo = this.player?.getSDKInfo?.();
  };

  private checkInaccurateImpressionAd() {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps } = playbackInfo;
    if (playbackInfo.adTimeupdateEmitted && flatten(adStartSteps)[playbackInfo.adCount - 1] === START_STEP.START_LOAD) {
      playbackInfo.inaccurateImpressionAdCount++;
    }
    playbackInfo.adTimeupdateEmitted = false;
  }

  private adStartLoad = () => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps, adStartLoadTs, adViewedTs, adCurrentTimeProgressedTs } = playbackInfo;
    this.checkInaccurateImpressionAd();
    playbackInfo.adCount++;
    playbackInfo.currentAdHappenedError = false;
    playbackInfo.currentAdHappenedBuffering = false;
    playbackInfo.currentAdImpressionFired = false;
    getArrayLastItem(adStartSteps)?.push(START_STEP.START_LOAD);
    getArrayLastItem(adStartLoadTs)?.push(Number(now().toFixed(2)));
    getArrayLastItem(adViewedTs)?.push(0);
    getArrayLastItem(adCurrentTimeProgressedTs)?.push(0);
  };

  private loadeddata = () => {
    // content first frame
    this.firstFrameViewed();
  };

  private canPlay = (data: CanPlayEventData = {
    isResumePositionBuffered: true,
  }) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.cdn = this.player?.getCDN?.() ?? '';
    playbackInfo.sdkInfo = this.player?.getSDKInfo?.();
    if (!data.isResumePositionBuffered) {
      return;
    }
    // content first frame
    this.firstFrameViewed();
  };

  private adLoadeddata = () => {
    // ad first frame
    this.adFirstFrameViewed();
  };

  private adCanPlay = () => {
    // ad first frame
    this.adFirstFrameViewed();
  };

  private currentTimeProgressed = () => {
    this.setCurrentTimeProgressedTs();
  };

  private adCurrentTimeProgressed = () => {
    this.setAdCurrentTimeProgressedTs();
  };

  private firstFrameViewed = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.isRetrying = false;
    const { startSteps, viewedTs, startLoadTs } = playbackInfo;
    const curStartStep = getArrayLastItem(startSteps) || START_STEP.UNKNOWN;
    if (curStartStep === START_STEP.START_LOAD) {
      startSteps[startSteps.length - 1] = START_STEP.VIEWED_FIRST_FRAME;
    }
    if (curStartStep >= START_STEP.START_LOAD) {
      if (getArrayLastItem(viewedTs) === 0) {
        viewedTs[viewedTs.length - 1] = toFixed2(now());
        if (getArrayLastItem(startLoadTs) && getArrayLastItem(viewedTs) >= getArrayLastItem(startLoadTs)) {
          const ffd = getArrayLastItem(viewedTs) - getArrayLastItem(startLoadTs);
          const cappingFfd = Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
          // firstFrame of the whole play session, may be content or preroll
          if (playbackInfo.firstFrameDuration < 0) {
            playbackInfo.firstFrameDuration = cappingFfd;
            playbackInfo.firstFrameDurationOriginal = ffd;
          }
          // firstFrame of content
          if (playbackInfo.contentFirstFrameDuration < 0) {
            playbackInfo.contentFirstFrameDuration = cappingFfd;
            playbackInfo.contentFirstFrameTs = now();
          } else {
            playbackInfo.totalContentResumeFirstFrameDuration += cappingFfd;
            const currentContentResumeInfo = getArrayLastItem(playbackInfo.contentResumeInfo);
            if (currentContentResumeInfo && currentContentResumeInfo.resumeStartupTime === -1) {
              currentContentResumeInfo.resumeStartupTime = Math.round(cappingFfd);
              const { details, canHit } = currentContentResumeInfo.hitCache ?? {};
              // not report cache details when resume startup successfully and hit cache
              if (details && canHit) {
                details.frags.main = [];
                details.frags.audio = [];
              }
            }
          }
          if (playbackInfo.joinTime === -1) {
            playbackInfo.joinTime = getArrayLastItem(viewedTs) - playbackInfo.startTs;
          }
        }
      }
    }
  };

  private adFirstFrameViewed = () => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps, adViewedTs, adStartLoadTs } = playbackInfo;
    const curAdStartStep = getArrayLastItem(adStartSteps) || [];
    const curAdViewedTs = getArrayLastItem(adViewedTs) || [];
    const curAdStartStepItem = getArrayLastItem(curAdStartStep) || START_STEP.UNKNOWN;
    const curAdStartLoadTs = getArrayLastItem(adStartLoadTs) || [];
    if (curAdStartStepItem === START_STEP.START_LOAD) {
      curAdStartStep[curAdStartStep.length - 1] = START_STEP.VIEWED_FIRST_FRAME;
    }
    if (curAdStartStepItem >= START_STEP.START_LOAD && getArrayLastItem(curAdViewedTs) === 0 && getArrayLastItem(curAdStartLoadTs)) {
      curAdViewedTs[curAdViewedTs.length - 1] = toFixed2(now());
      const ffd = getArrayLastItem(curAdViewedTs) - getArrayLastItem(curAdStartLoadTs);
      // firstFrame of the whole play session, may be content or preroll
      if (playbackInfo.firstFrameDuration < 0) {
        playbackInfo.firstFrameDuration = Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
        playbackInfo.firstFrameDurationOriginal = ffd;
      }
      if (playbackInfo.joinTime === -1) {
        playbackInfo.joinTime = getArrayLastItem(curAdViewedTs) - playbackInfo.startTs;
      }
      playbackInfo.totalAdFirstFrameDuration += Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
    }
  };

  private setCurrentTimeProgressedTs = () => {
    const playbackInfo = this.playbackInfo;
    const { startSteps, currentTimeProgressedTs } = playbackInfo;
    const curStartStep = getArrayLastItem(startSteps) || START_STEP.UNKNOWN;
    if (curStartStep >= START_STEP.START_LOAD) {
      if (getArrayLastItem(currentTimeProgressedTs) === 0) {
        currentTimeProgressedTs[currentTimeProgressedTs.length - 1] = toFixed2(now());
      }
      startSteps[startSteps.length - 1] = START_STEP.PLAY_STARTED;
    }
  };

  private setAdCurrentTimeProgressedTs = () => {
    const playbackInfo = this.playbackInfo;
    const { adStartSteps, adCurrentTimeProgressedTs } = playbackInfo;
    const curAdStartStep = getArrayLastItem(adStartSteps) || [];
    const curAdCurrentTimeProgressedTs = getArrayLastItem(adCurrentTimeProgressedTs) || [];
    const curAdStartStepItem = getArrayLastItem(curAdStartStep) || START_STEP.UNKNOWN;
    if (curAdStartStepItem >= START_STEP.START_LOAD) {
      if (getArrayLastItem(curAdCurrentTimeProgressedTs) === 0) {
        curAdCurrentTimeProgressedTs[curAdCurrentTimeProgressedTs.length - 1] = toFixed2(now());
      }
      curAdStartStep[curAdStartStep.length - 1] = START_STEP.PLAY_STARTED;
    }
  };

  private paused = () => {
    this.endDurationRecord();
  };

  private bufferStart = (data: BufferStartEventData = {}) => {
    const playbackInfo = this.playbackInfo;
    if (data.reason === StartBufferingReason.el_load_start
      || playbackInfo.isBuffering
      || playbackInfo.isSeeking
      || playbackInfo.isRetrying
      || playbackInfo.isAd
      || !this.isLatestStartupFinished()
      || (__ISOTT__ && this.isAppHiddenFn?.())) {
      return;
    }
    playbackInfo.isBuffering = true;
    playbackInfo.bufferingType = data.bufferingType;
    playbackInfo.bufferingTs = now();
    this.eventEmitter.emit(VODPlaybackEvents.bufferingStart, data);
  };

  private bufferEnd = (data: BufferEndEventData = {}, resetIsBuffering: boolean = true) => {
    const { playbackInfo, multiPlaysInfo } = this;
    if (playbackInfo.isBuffering
      && playbackInfo.bufferingTs
      && !playbackInfo.isSeeking
      && !playbackInfo.isAd
      && !playbackInfo.isRetrying
      && this.isLatestStartupFinished()) {
      const ts = now();
      const singleBufferingDuration = ts - playbackInfo.bufferingTs;
      if (singleBufferingDuration > SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION) {
        playbackInfo.bufferingList.push([toFixed2(playbackInfo.bufferingTs / 1000), toFixed2(ts / 1000)]);
        if (playbackInfo.bufferingCount === 0) {
          playbackInfo.firstBufferingStartTs = toFixed2(playbackInfo.bufferingTs);
          if (resetIsBuffering) {
            playbackInfo.firstBufferingEndTs = toFixed2(ts);
          }
        }
        if (playbackInfo.bufferingType === 'unknown') {
          const unknownBufferingCount = playbackInfo.bufferingCount - playbackInfo.networkBufferingCount;
          if (unknownBufferingCount === 0) {
            multiPlaysInfo.unknownBufferingPlays++; // this will only run once in one playback session
            if (!multiPlaysInfo.encounteredUnknownBuffering) {
              multiPlaysInfo.encounteredUnknownBuffering = true;
              setLocalData(ENCOUNTERED_UNKNOWN_BUFFERING_KEY, 'true');
            }
          }
        } else {
          playbackInfo.networkBufferingCount++;
          playbackInfo.totalNetworkBufferingDuration += Math.min(singleBufferingDuration, SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION);
        }
        playbackInfo.bufferingCount++;
        playbackInfo.totalBufferingDuration += Math.min(singleBufferingDuration, SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION);
        playbackInfo.totalBufferingDurationOriginal += singleBufferingDuration;
        this.eventEmitter.emit(VODPlaybackEvents.bufferingEnd, data, {
          bufferingDuration: toFixed2(singleBufferingDuration),
          bufferingStartTimeFromViewed: toFixed2((playbackInfo.bufferingTs - playbackInfo.contentFirstFrameTs) / 1000.0),
          intervalFromLastBuffering: playbackInfo.lastBufferingEndTs > 0 ? toFixed2((playbackInfo.bufferingTs - playbackInfo.lastBufferingEndTs) / 1000.0) : undefined,
        });
        playbackInfo.lastBufferingEndTs = ts;
      }
    }
    if (resetIsBuffering) {
      playbackInfo.isBuffering = false;
      playbackInfo.bufferingTs = 0;
      playbackInfo.bufferingType = undefined;
    }
  };

  private adBufferStart = (data: BufferStartEventData = {}) => {
    const playbackInfo = this.playbackInfo;
    if (data.reason === StartBufferingReason.el_load_start
      || playbackInfo.isAdBuffering
      || !playbackInfo.isAd
      || !this.isLatestAdStartupFinished()
      || (__ISOTT__ && this.isAppHiddenFn?.())) {
      return;
    }
    playbackInfo.isAdBuffering = true;
    playbackInfo.adBufferingTs = now();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private adBufferEnd = (data: BufferEndEventData = {}, resetAdIsBuffering: boolean = true) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.isAdBuffering
      && playbackInfo.adBufferingTs
      && playbackInfo.isAd
      && this.isLatestAdStartupFinished()) {
      const ts = now();
      const singleAdBufferingDuration = ts - playbackInfo.adBufferingTs;
      if (singleAdBufferingDuration > SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION) {
        if (!playbackInfo.currentAdHappenedBuffering) {
          playbackInfo.currentAdHappenedBuffering = true;
          playbackInfo.bufferingAdCount++;
        }
        playbackInfo.totalAdBufferingDuration += Math.min(singleAdBufferingDuration, SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION);
      }
    }
    if (resetAdIsBuffering) {
      playbackInfo.isAdBuffering = false;
      playbackInfo.adBufferingTs = 0;
    }
  };

  private seekStart = (data: SeekEventData) => {
    const playbackInfo = this.playbackInfo;
    // Do not record the seek case of startup resume position.
    if (playbackInfo.isAd
      || playbackInfo.isRetrying
      || !this.isLatestStartupFinished()
      || (__ISOTT__ && this.isAppHiddenFn?.())) {
      return;
    }
    if (playbackInfo.isBuffering) {
      this.bufferEnd({
        reason: StopBufferingReason.seek_start,
      });
    }
    if (playbackInfo.isSeeking) {
      this.seekEnd();
    }
    playbackInfo.isSeeking = true;
    playbackInfo.currentSeekInfo = {
      from: toFixed2(data.position),
      to: toFixed2(data.offset),
      startTime: toFixed2(now()),
    };
  };

  private seekEnd = (data?: SeekedEventData, resetIsSeeking: boolean = true) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.isSeeking
      && playbackInfo.currentSeekInfo
      && !playbackInfo.isAd
      && !playbackInfo.isRetrying
      && this.isLatestStartupFinished()) {
      const ts = now();
      const singleSeekDuration = ts - playbackInfo.currentSeekInfo.startTime;
      playbackInfo.seekCount++;
      playbackInfo.totalSeekDuration += Math.min(singleSeekDuration, SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION);
      playbackInfo.totalSeekDurationOriginal += singleSeekDuration;
      playbackInfo.currentSeekInfo.endTime = toFixed2(ts);
      playbackInfo.seekInfoList.push(playbackInfo.currentSeekInfo as {
        from: number;
        to: number;
        startTime: number;
        endTime: number;
      });
    }
    if (resetIsSeeking) {
      playbackInfo.isSeeking = false;
      playbackInfo.currentSeekInfo = undefined;
    }
  };

  private adError = (err: AdError, data: AdErrorEventData) => {
    const playbackInfo = this.playbackInfo;
    const { adUrlBlacklist } = this.multiPlaysInfo;
    if (!playbackInfo.currentAdHappenedError) {
      playbackInfo.currentAdHappenedError = true;
      playbackInfo.errorAdCount++;
    }
    if (data.ad?.video && isDecodeError(err)) {
      try {
        const url = new URL(data.ad.video);
        const adUrl = url.origin + url.pathname;
        const idx = adUrlBlacklist.findIndex(item => item.adUrl === adUrl);
        if (idx !== -1) {
          adUrlBlacklist.splice(idx, 1);
        }
        adUrlBlacklist.push({
          ts: now(),
          adUrl,
          error: err.message,
        });
        if (adUrlBlacklist.length > AD_URL_BLACKLIST_MAX_COUNT) {
          adUrlBlacklist.shift();
        }
        setLocalData(AD_URL_BLACKLIST_KEY, JSON.stringify(adUrlBlacklist));
      } catch (error) {
        logger.error(error, 'Failed to add ad url to blacklist');
      }
    }
  };

  private adTime = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.adTimeupdateEmitted = true;
  };

  private adQuartile = (quartile: number) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.adImpressions[quartile] === undefined) {
      playbackInfo.adImpressions[quartile] = 0;
    }
    playbackInfo.adImpressions[quartile]++;
    if (quartile === 0) {
      playbackInfo.currentAdImpressionFired = true;
    }
  };

  adPodFetch = (data: { isPreroll: boolean; }) => {
    const { isAdPodFetching } = this.playbackInfo;
    if (data.isPreroll) {
      isAdPodFetching[0] = true;
    } else {
      isAdPodFetching[1] = true;
    }
  };

  adPodFetchSuccess = (data: { isPreroll: boolean; responseTime?: number, adsCount: number }) => {
    const { adPodFetchData, isAdPodFetching } = this.playbackInfo;
    if (data.responseTime === undefined) return;
    if (data.isPreroll) {
      isAdPodFetching[0] = false;
      adPodFetchData[0].totalCount++;
      adPodFetchData[0].totalRequestDuration += data.responseTime;
      this.playbackInfo.prerollAdsCount = data.adsCount;
    } else {
      isAdPodFetching[1] = false;
      adPodFetchData[1].totalCount++;
      adPodFetchData[1].totalRequestDuration += data.responseTime;
    }
  };

  adPodFetchError = (data: { isPreroll: boolean }) => {
    const { adPodFetchData, isAdPodFetching } = this.playbackInfo;
    if (data.isPreroll) {
      isAdPodFetching[0] = false;
      adPodFetchData[0].totalCount++;
      adPodFetchData[0].errorCount++;
    } else {
      isAdPodFetching[1] = false;
      adPodFetchData[1].totalCount++;
      adPodFetchData[1].errorCount++;
    }
  };

  setIsResumePositionAtCuePoint = (isResumePositionAtCuePoint: boolean) => {
    this.playbackInfo.isResumePositionAtCuePoint = isResumePositionAtCuePoint;
  };

  setManifestCacheStats = (stats: { hitNum: number; requestNum: number }) => {
    this.playbackInfo.manifestCacheHitNum = stats.hitNum;
    this.playbackInfo.manifestRequestNum = stats.requestNum;
  };

  setPlayerDisplayMode = (playerDisplayMode: PlayerDisplayMode) => {
    /**
     * We persist the playback info when the user transitions in between
     * default and in-app picture in picture display modes in order to
     * preserve the playback state.
     */
    const isTransitionInAppPictureInPicture = playerDisplayMode === PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE
      || this.previousPlaybackInfo?.playerDisplayMode === PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE;
    const isSameContent = this.previousContentId === this.playbackInfo.contentId;

    if (isTransitionInAppPictureInPicture && isSameContent && this.previousPlaybackInfo !== undefined) {
      this.playbackInfo = cloneDeep(this.previousPlaybackInfo);
    }

    if (this.playbackInfo.playerDisplayMode !== playerDisplayMode) {
      this.playbackInfo.playerDisplayMode = playerDisplayMode;
      this.playbackInfo.playerDisplayModeTransitionCount++;
    }
  };

  segmentTimelineMisalignment = (data: { firstFragDurationDiff: number }) => {
    this.playbackInfo.segmentTimelineMisalignment = true;
    this.playbackInfo.firstFragDurationDiff = Math.max(this.playbackInfo.firstFragDurationDiff, data.firstFragDurationDiff);
  };

  setShowingUIComponents = (data: {
    title: boolean;
    rating: boolean;
    playerControls: boolean;
    autoPlay: boolean;
    thumbnail: boolean;
    autostartModal: boolean;
    audioDescriptionsModal: boolean;
    feedbackModal: boolean;
    bww: boolean;
    bwwExpanded: boolean;
  }) => {
    this.playbackInfo.showingUIComponents = Object.keys(data).filter(key => data[key as keyof typeof data]);
  };

  recordThumbnailPerformance = (blankMs: number, renderedMs: number) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.thumbnailsBlankMs += blankMs;
    playbackInfo.thumbnailComponentRenderedMs += renderedMs;
  };

  isContentFirstFrameViewed = () => {
    return this.playbackInfo.contentFirstFrameDuration !== -1;
  };

  recordContentApiRequestCount = () => {
    this.multiPlaysInfo.contentApiRequestCount++;
  };

  resetContentApiRequestCount = () => {
    this.multiPlaysInfo.contentApiRequestCount = 0;
  };

  setCachedVideos = (videos: Video[] | undefined, type: 'autoplay' | 'related') => {
    const key = type === 'autoplay' ? 'autoplayVideos' : 'relatedVideos';
    if (!videos) {
      this.multiPlaysInfo[key] = [];
      return;
    }
    const allProcessedContent: Video[] = [];
    videos.forEach(video => {
      const processedVideo = transformContent(video);
      const episodes = extractEpisodes(processedVideo);
      allProcessedContent.push(processedVideo, ...episodes);
    });
    this.multiPlaysInfo[key] = [...allProcessedContent];
  };

  getContentById = (contentId: string): Video | undefined => {
    const { multiPlaysInfo } = this;
    const content = multiPlaysInfo.autoplayVideos.find(content => content.id === contentId)
      || multiPlaysInfo.relatedVideos.find(content => content.id === contentId);
    if (content && isReuseAutoplayAndRelatedVideoResource()) {
      return content;
    }
    return undefined;
  };
}

export function attachVODPlaybackSession(player: Player, getVideoResource: () => VideoResource | undefined, videoResourceManager?: VideoResourceManager) {
  if (player.playerName !== PlayerName.VOD) return FREEZED_EMPTY_FUNCTION;
  VODPlaybackSession.getInstance().manageEventListener(player, getVideoResource, videoResourceManager, false);
  return () => {
    const instance = VODPlaybackSession.getInstance();
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    if (playbackInfo.startTs > 0) {
      instance.endPlayback();
      instance.resetPlaybackInfo();
    }
    instance.manageEventListener(player, getVideoResource, videoResourceManager, true);
  };
}
