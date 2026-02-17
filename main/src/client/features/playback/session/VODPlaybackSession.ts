import type {
  Player,
  BufferStartEventData,
  ErrorEventData,
  SeekedEventData,
  ResumeFromAdData,
  BufferEndEventData,
  SDKInfo,
  FragDownloadStats,
} from '@adrise/player';
import {
  PLAYER_EVENTS,
  PlayerName,
  StopBufferingReason,
  StartBufferingReason,
} from '@adrise/player';
import {
  getLocalStorageData,
  removeLocalStorageData,
  setLocalStorageData,
} from '@adrise/utils/lib/localStorage';
import { now } from '@adrise/utils/lib/time';
import { getArrayLastItem } from '@adrise/utils/lib/tools';
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import Analytics from '@tubitv/analytics';
import cloneDeep from 'lodash/cloneDeep';
import flatten from 'lodash/flatten';
import type { ValueOf } from 'ts-essentials';

import { QoSErrorType, QoSErrorCode, convertErrorToUnifiedEnum } from 'client/features/playback/utils/convertErrorToUnifiedEnum';
import type { QoSErrorTypeValues, QoSErrorCodeValues } from 'client/features/playback/utils/convertErrorToUnifiedEnum';
import { isAppHidden } from 'client/systemApi/utils';
import {
  FREEZED_EMPTY_FUNCTION,
  LD_VOD_PLAYBACK_SESSION_SNAPSHOT,
} from 'common/constants/constants';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import type { VideoResourceAttributes } from 'common/features/playback/services/VideoResourceManager';
import logger from 'common/helpers/logging';
import type { VideoResource, VideoResourceType, VIDEO_RESOURCE_CODEC, HDCPVersion } from 'common/types/video';
import { toFixed2 } from 'common/utils/format';

import { generateRandomLogTrackId } from '../utils/generateRandomLogTrackId';

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
  adPreloaded?: FeatureValue;
  adAbnormalErrorConstrainView?: FeatureValue;
  notHandleNonFatalDRMError?: FeatureValue;
  srcNotSupportedErrorRetry?: FeatureValue;
  contentStartupStallRecovery?: FeatureValue;
  fastFailOnLevelTimeoutAndFragLoadError?: FeatureValue;
  // Can be removed if ottFireTVBrowseWhileWatching is not graduated
  bww?: FeatureValue;
};

type AdPodFetchData = {
  totalRequestDuration: number;
  totalCount: number;
  errorCount: number;
};

export const SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION = 200;
export const SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION = 60 * 1000 * 60;
export const SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION = 10 * 1000;

const VOD_PLAYBACK_SESSION_SNAPSHOT_UPDATE_INTERVAL = 10_000;

export type VODPlaybackInfo = {
  trackId: string,
  contentId?: string,
  isSeries: boolean,
  isAutoplay: boolean,
  isContinueWatching: boolean,
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
  seekingTs: number;
  totalSeekDuration: number;
  totalSeekDurationOriginal: number;
  seekCount: number;
  isBuffering: boolean;
  bufferingTs: number;
  totalBufferingDuration: number;
  totalBufferingDurationOriginal: number;
  bufferingCount: number;
  firstBufferingStartTs: number;
  firstBufferingEndTs: number;
  lastBufferingEndTs: number;
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
  totalAdFirstFrameDuration: number;
  isAdPodFetching: [boolean, boolean]; // 0 preroll, 1 midroll
  adPodFetchData: [AdPodFetchData, AdPodFetchData]; // 0 preroll, 1 midroll
  isPreroll: boolean;
  isAd: boolean;
  features: FeatureInfo;
  adTimeupdateEmitted: boolean;
  inaccurateImpressionAdCount: number;
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
};

type EnforceRequirement<T> = { [K in keyof Required<T>]: T[K]; };

const initialPlaybackInfo: EnforceRequirement<VODPlaybackInfo> = {
  trackId: '',
  startTs: -1,
  adSetupTs: -1,
  contentId: '',
  isSeries: false,
  isAutoplay: false,
  isContinueWatching: false,
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
  seekingTs: 0,
  totalSeekDuration: 0,
  totalSeekDurationOriginal: 0,
  seekCount: 0,
  isBuffering: false,
  bufferingTs: 0,
  totalBufferingDuration: 0,
  totalBufferingDurationOriginal: 0,
  bufferingCount: 0,
  firstBufferingStartTs: 0,
  firstBufferingEndTs: 0,
  lastBufferingEndTs: 0,
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
};

export enum VODPlaybackEvents {
  reportPlaybackSessionData = 'reportPlaybackSessionData',
  addViewTime = 'addViewTime',
  bufferingStart = 'bufferingStart',
  bufferingEnd = 'bufferingEnd',
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
};

// VODPlaybackSession means playback of one content
export class VODPlaybackSession {

  private playbackInfo: VODPlaybackInfo = {
    ...cloneDeep(initialPlaybackInfo),
  };

  private player?: Player;

  private getVideoResource?: () => VideoResource | undefined;

  private videoResourceManager?: VideoResourceManager;

  private eventEmitter = new TypedEventEmitter<Listeners>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private static _instance: VODPlaybackSession;

  private snapshotTimer?: ReturnType<typeof setTimeout>;

  static getInstance() {
    if (!this._instance) {
      this._instance = new VODPlaybackSession();
    }
    return this._instance;
  }

  static getVODPlaybackInfo = (): VODPlaybackInfo => {
    return this.getInstance().playbackInfo;
  };

  manageEventListener = (player: Player, getVideoResource: () => VideoResource | undefined, videoResourceManager: VideoResourceManager | undefined, remove: boolean) => {
    const key = remove ? 'off' : 'on';
    this.player = player;
    this.getVideoResource = getVideoResource;
    this.videoResourceManager = videoResourceManager;

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
  };

  createSnapshot = () => {
    if (!__SHOULD_LOCALLY_SAVE_VOD_QOS_LOG_ON_INTERVAL__ || !OnetrustClient.canLocallySaveVODQosLogOnInterval()) {
      return;
    }
    const previousSnapshotString = getLocalStorageData(LD_VOD_PLAYBACK_SESSION_SNAPSHOT);
    try {
      if (previousSnapshotString) {
        const previousSnapshot = JSON.parse(previousSnapshotString);
        if (!previousSnapshot.is_discarded) {
          this.eventEmitter.emit(VODPlaybackEvents.reportPlaybackSessionData, previousSnapshot);
        }
      }
    } catch (error) {
      logger.error('error while comparing snapshots: ', previousSnapshotString ?? /* istanbul ignore next */ '');
    }
    this.clearSnapshot();
    this.updateSnapshot();
    this.snapshotTimer = setInterval(() => {
      this.updateLatestData();
      this.updateSnapshot();
    }, VOD_PLAYBACK_SESSION_SNAPSHOT_UPDATE_INTERVAL);
  };

  updateSnapshot = () => {
    try {
      setLocalStorageData(LD_VOD_PLAYBACK_SESSION_SNAPSHOT, JSON.stringify(this.playbackInfo));
    } catch (error) {
      logger.error('error while updating local store LD_VOD_PLAYBACK_SESSION_SNAPSHOT', error);
    }
  };

  clearSnapshot = () => {
    clearInterval(this.snapshotTimer);
    removeLocalStorageData(LD_VOD_PLAYBACK_SESSION_SNAPSHOT);
  };

  startPlayback = (
    {
      isSeries,
      contentId,
      isAutoplay,
      isFromBrowseWhileWatching,
      isContinueWatching,
    }: {
      isSeries: boolean;
      contentId?: string;
      isAutoplay?: boolean
      isFromBrowseWhileWatching?: boolean
      isContinueWatching: boolean;
    }
  ) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.startTs > 0) {
      this.endPlayback();
      this.resetPlaybackInfo();
    }
    playbackInfo.contentId = contentId;
    playbackInfo.isSeries = isSeries;
    playbackInfo.isAutoplay = !!isAutoplay;
    playbackInfo.isContinueWatching = isContinueWatching;
    playbackInfo.startTs = now();
    playbackInfo.trackId = generateRandomLogTrackId();
    // only set if true to avoid sending up extra data
    if (isFromBrowseWhileWatching) {
      this.setFeatureInfo('bww', true);
    }
    this.createSnapshot();
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
    this.updateFragDownloadStats(fragDownloadStats);
    this.updateVideoFrames(totalVideoFrames, droppedVideoFrames);
  };

  endPlayback = () => {
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
    const playbackInfo = this.playbackInfo;
    const cloneInitialPlaybackInfo = cloneDeep(initialPlaybackInfo);
    Object.entries(cloneInitialPlaybackInfo).forEach(([key, value]) => {
      playbackInfo[key] = value;
    });
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

  addAdViewTime = (adViewTime: number) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.adPlaybackViewTime += adViewTime;
  };

  updateFragDownloadStats = (fragDownloadStats?: FragDownloadStats) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.totalDownloadSize = fragDownloadStats ? (fragDownloadStats.video.totalDownloadSize + fragDownloadStats.audio.totalDownloadSize) / 1024 : 0; // kbits
    playbackInfo.totalDownloadTimeConsuming = fragDownloadStats ? (fragDownloadStats.video.totalDownloadTimeConsuming + fragDownloadStats.audio.totalDownloadTimeConsuming) / 1000 : 0; // seconds
    playbackInfo.totalDownloadFragDuration = fragDownloadStats ? Math.max(fragDownloadStats.video.totalDownloadFragDuration, fragDownloadStats.audio.totalDownloadFragDuration) : 0; // seconds
  };

  updateVideoFrames = (totalVideoFrames: number | undefined, droppedVideoFrames: number | undefined) => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.totalVideoFrames = totalVideoFrames;
    playbackInfo.droppedVideoFrames = droppedVideoFrames;
  };

  setDiscarded = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.is_discarded = true;
  };

  hasResumeStage = () => {
    const playbackInfo = this.playbackInfo;
    return playbackInfo.startSteps.length > 1;
  };

  endDurationRecord = () => {
    this.seekEnd();
    this.bufferEnd({
      reason: StopBufferingReason.el_pause_event,
    });
    this.adBufferEnd({
      reason: StopBufferingReason.el_pause_event,
    });
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

  private startLoad = (data: ResumeFromAdData) => {
    const playbackInfo = this.playbackInfo;
    const { startSteps, startLoadTs, viewedTs, currentTimeProgressedTs, isAdBuffering } = playbackInfo;
    const deviceInfo = Analytics.getAnalyticsConfig();
    if (startSteps.length === 0 || (this.isLatestStartupFinished() && data.isResumeFromAd && !data.isResumeFromPreroll)) { // previous startup has finished, set up a new one
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
    getArrayLastItem(adStartSteps)?.push(START_STEP.START_LOAD);
    getArrayLastItem(adStartLoadTs)?.push(Number(now().toFixed(2)));
    getArrayLastItem(adViewedTs)?.push(0);
    getArrayLastItem(adCurrentTimeProgressedTs)?.push(0);
  };

  private loadeddata = () => {
    // content first frame
    this.firstFrameViewed();
  };

  private canPlay = () => {
    const playbackInfo = this.playbackInfo;
    playbackInfo.cdn = this.player?.getCDN?.() ?? '';
    playbackInfo.sdkInfo = this.player?.getSDKInfo?.();
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
          // firstFrame of the whole play session, may be content or preroll
          if (playbackInfo.firstFrameDuration < 0) {
            playbackInfo.firstFrameDuration = Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
            playbackInfo.firstFrameDurationOriginal = ffd;
          }
          // firstFrame of content
          if (playbackInfo.contentFirstFrameDuration < 0) {
            playbackInfo.contentFirstFrameDuration = Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
            playbackInfo.contentFirstFrameTs = now();
          } else {
            playbackInfo.totalContentResumeFirstFrameDuration += Math.min(ffd, SINGLE_EVENT_MAX_RECORD_FIRST_FRAME_DURATION);
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
      || (__ISOTT__ && isAppHidden())) {
      return;
    }
    playbackInfo.isBuffering = true;
    playbackInfo.bufferingTs = now();
    this.eventEmitter.emit(VODPlaybackEvents.bufferingStart, data);
  };

  private bufferEnd = (data: BufferEndEventData = {}, resetIsBuffering: boolean = true) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.isBuffering
      && playbackInfo.bufferingTs
      && !playbackInfo.isSeeking
      && !playbackInfo.isAd
      && !playbackInfo.isRetrying
      && this.isLatestStartupFinished()) {
      const ts = now();
      const singleBufferingDuration = ts - playbackInfo.bufferingTs;
      if (singleBufferingDuration > SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION) {
        if (playbackInfo.bufferingCount === 0) {
          playbackInfo.firstBufferingStartTs = toFixed2(playbackInfo.bufferingTs);
          if (resetIsBuffering) {
            playbackInfo.firstBufferingEndTs = toFixed2(ts);
          }
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
    }
  };

  private adBufferStart = (data: BufferStartEventData = {}) => {
    const playbackInfo = this.playbackInfo;
    if (data.reason === StartBufferingReason.el_load_start
      || playbackInfo.isAdBuffering
      || !playbackInfo.isAd
      || !this.isLatestAdStartupFinished()
      || (__ISOTT__ && isAppHidden())) {
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
      if (singleAdBufferingDuration > SINGLE_EVENT_MIN_RECORD_BUFFERING_DURATION && !playbackInfo.currentAdHappenedBuffering) {
        playbackInfo.currentAdHappenedBuffering = true;
        playbackInfo.bufferingAdCount++;
      }
    }
    if (resetAdIsBuffering) {
      playbackInfo.isAdBuffering = false;
      playbackInfo.adBufferingTs = 0;
    }
  };

  private seekStart = () => {
    const playbackInfo = this.playbackInfo;
    // Do not record the seek case of startup resume position.
    if (playbackInfo.isAd
      || playbackInfo.isRetrying
      || !this.isLatestStartupFinished()
      || (__ISOTT__ && isAppHidden())) {
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
    playbackInfo.seekingTs = now();
  };

  private seekEnd = (data?: SeekedEventData, resetIsSeeking: boolean = true) => {
    const playbackInfo = this.playbackInfo;
    if (playbackInfo.isSeeking
      && playbackInfo.seekingTs
      && !playbackInfo.isAd
      && !playbackInfo.isRetrying
      && this.isLatestStartupFinished()) {
      const singleSeekDuration = now() - playbackInfo.seekingTs;
      playbackInfo.seekCount++;
      playbackInfo.totalSeekDuration += Math.min(singleSeekDuration, SINGLE_EVENT_MAX_RECORD_BUFFERING_SEEKING_DURATION);
      playbackInfo.totalSeekDurationOriginal += singleSeekDuration;
    }
    if (resetIsSeeking) {
      playbackInfo.isSeeking = false;
      playbackInfo.seekingTs = 0;
    }
  };

  private adError = () => {
    const playbackInfo = this.playbackInfo;
    if (!playbackInfo.currentAdHappenedError) {
      playbackInfo.currentAdHappenedError = true;
      playbackInfo.errorAdCount++;
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
  };

  adPodFetch = (data: { isPreroll: boolean; }) => {
    const { isAdPodFetching } = this.playbackInfo;
    if (data.isPreroll) {
      isAdPodFetching[0] = true;
    } else {
      isAdPodFetching[1] = true;
    }
  };

  adPodFetchSuccess = (data: { isPreroll: boolean; responseTime?: number }) => {
    const { adPodFetchData, isAdPodFetching } = this.playbackInfo;
    if (data.responseTime === undefined) return;
    if (data.isPreroll) {
      isAdPodFetching[0] = false;
      adPodFetchData[0].totalCount++;
      adPodFetchData[0].totalRequestDuration += data.responseTime;
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
}

export function attachVODPlaybackSession(player: Player, getVideoResource: () => VideoResource | undefined, videoResourceManager?: VideoResourceManager) {
  if (player.playerName !== PlayerName.VOD) return FREEZED_EMPTY_FUNCTION;
  VODPlaybackSession.getInstance().manageEventListener(player, getVideoResource, videoResourceManager, false);
  return () => {
    VODPlaybackSession.getInstance().manageEventListener(player, getVideoResource, videoResourceManager, true);
  };
}
