import type {
  AdError,
  ErrorEventData,
  StartLoadEventData,
  AdPodCompleteEventData,
  AdPodFetchSuccess,
} from '@adrise/player';
import { ActionLevel } from '@adrise/player';
import { parseQueryString } from '@adrise/utils/lib/queryString';
import { now } from '@adrise/utils/lib/time';
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import { PlaybackSourceType } from '@tubitv/analytics/lib/genericEvents';
import cloneDeep from 'lodash/cloneDeep';
import { createContext } from 'react';

import { exposeToTubiGlobal } from 'client/global';
import { VODPlaybackSession } from 'common/playback/VODPlaybackSession';
import type { HDMIConnectionState } from 'common/types/video';
import type { FeedbackIssueTypeKey } from 'ott/features/playback/components/FeedbackModal/FeedbackModal';

import { isPauseExplicit } from '../predicates/isPauseExplicit';

export type VODStage = 'IDLE' // enter page
| 'EMPTY_PREROLL' // preroll is empty
| 'BEFORE_PREROLL' // preroll cue point filled
| 'PREROLL' // preroll ad startup/playing
| 'AFTER_PREROLL' // preroll ad pod complete
| 'BEFORE_MIDROLL' // midroll cue point filled
| 'MIDROLL' // midroll ad startup/playing
| 'AFTER_MIDROLL' // midroll ad pod complete
| 'CONTENT_STARTUP' // content startup
| 'READY' // content first frame viewed
| 'EARLY_START' // content play started(current time progressed)
| 'IN_STREAM' // content has been playing for a while(30 seconds after content play starts)
| 'FALLBACK' // doing fallback to another resource
| 'RELOAD' // doing reload current resource
| 'NONE'; // initial state

export type VODSubStage = 'START_LOAD' // ad/content start load
| 'SETUP_ADS_PLAYER' // ad player launched
| 'VIEWED_FIRST_FRAME' // ad/content first frame viewed
| 'AD_POD_FETCHING' // ad pod fetching
| 'AD_POD_FETCH_SUCCESS' // ad pod fetch success
| 'AD_POD_FETCH_ERROR' // ad pod fetch error
| 'AD_POD_COMPLETE' // ad pod complete
| 'NONE';

export type VODExitCauseType = 'DRM_CRASH'
| 'CDN_JITTER'
| 'SETUP_CRASH'
| 'MANIFEST_ERROR'
| 'PLAY_INTERRUPT' | 'AD_PLAY_INTERRUPT'
| 'VIDEO_FREEZE' | 'VIDEO_FREEZE_AFTER_AD' | 'VIDEO_ELEMENT_FREEZE'
| 'AD_BUFFERING' | 'VIDEO_BUFFERING_AFTER_AD'
| 'AD_STALL'
| 'AD_SRC_UNSET' | 'AD_FREEZE_AFTER_FIRST_FRAME' | 'AD_FREEZE_AFTER_SRC_SET' | 'AD_FREEZE_AFTER_PLAY'
| 'PLAYER_STATE_MISMATCH'
| 'AD_PAUSED' | 'VIDEO_PAUSED_AFTER_AD'
| 'VIS_PAUSE_AD' | 'USER_PAUSE_AD'
| 'VIS_PAUSE_VIDEO_AFTER_AD' | 'USER_PAUSE_VIDEO_AFTER_AD'
| 'AD_UNKNOWN_PAUSED' | 'VIDEO_UNKNOWN_PAUSED_AFTER_AD'
| 'AD_NOT_READY' | 'VIDEO_NOT_READY_AFTER_AD'
| 'RESUME_AFTER_AD_FAILURE' | 'FEEDBACK'
| 'CONTENT_NO_BUFFER' | 'CONTENT_LOAD_LONG' | 'QUICK_LEAVE_WITHOUT_BUFFER'
| 'CONTENT_START_WITHOUT_BUFFER' | 'BUFFER_CLEARED'
| 'RESUME_BEGINNING_AFTER_AD' | 'SEEK_TIMEOUT'
| 'SEEKING_WITHOUT_BUFFER' | 'REATTACH_CLEAR_BUFFER' | 'RELOAD_CLEAR_BUFFER' | 'FALLBACK_CLEAR_BUFFER'
| 'BUFFER_NUDGE_FAILED'
| 'END_OF_STREAM' | 'NEAR_END'
| 'NON_INTERESTED_AUTOSTART_TRAILER' | 'NON_INTERESTED_AUTOSTART_PREVIEW'
| 'QUICK_LEAVE_IN_1_MIN'
| 'BWW_SEARCH_NAVIGATE'
| 'BWW_EMBEDDED_SEARCH_CONVERTED'
| 'RELAUNCH_MODAL_EXIT'; // User clicked "Go to Homepage" from relaunch modal

export type VODExitSubCauseType = 'AD_NO_BUFFER' | 'AD_BLACK_SCREEN_NOTICE' | 'AD_LOAD_LONG';

export interface VODExitCause {
  type: VODExitCauseType;
  error?: ErrorEventData;
  message?: FeedbackIssueTypeKey | VODExitSubCauseType;
}

export enum VODPageSessionEvents {
  stageChange = 'stageChange',
  ended = 'ended',
  resumeBeginningAfterAd = 'resumeBeginningAfterAd',
}

type Listeners = {
  [VODPageSessionEvents.stageChange]: (stage: VODStage, previousStage: VODStage) => void;
  [VODPageSessionEvents.ended]: () => void;
  [VODPageSessionEvents.resumeBeginningAfterAd]: () => void;
};

const EARLY_START_GAP_MILLISECONDS = 30000;

const eventEmitter = new TypedEventEmitter<Listeners>();

// VODPageSession means lifecycle in a web page, includes playback of multiple contents
export interface VODPageSession {
  stage: VODStage;
  subStage: VODSubStage;
  contents: number;
  totalContents: number;
  ads: number;
  cuePoints: number;
  // automatic autoplay but not deliberately
  autoplay: boolean;
  autoplayDeliberate: boolean;
  autoplaySelectedIndex: number;
  startTs: number;
  endTs?: number;
  isAdStalled: boolean;
  isAd: boolean;
  isPaused: boolean;
  isPauseExplicit: boolean; // is this pause user-initiated
  pauseActionLevel: ActionLevel;
  isAdPauseExplicit: boolean; // is this a deliberate pause due to ads
  hasErrorModal: boolean;
  errorModalTs?: number;
  earlyStartTs: number;
  totalViewTime: number;
  totalAdViewTime: number;
  lastError?: ErrorEventData | undefined;
  lastAdError?: AdError;
  cause?: VODExitCause;
  doubts?: VODExitCauseType[];
  lastFeedback?: FeedbackIssueTypeKey;
  utmSource?: string;
  isAPPLaunchedFromDeepLink: boolean;
  hdmiConnectionStatus: HDMIConnectionState;
  isReattachingVideoElement: boolean;
  playbackSourceType: PlaybackSourceType;
  isPrefetchAds?: boolean;
  // aim for the current ad
  adPauseInfo: {
    ui: number;
    vis: number;
    event: number;
    buffering: number;
  };
  bwwPeekRowImpressionCount: number;
  bwwOpenCount: number;
  bwwConvertCount: number;
  isExtensionReady: boolean;
}

function getDefaultAdPauseInfo(): VODPageSession['adPauseInfo'] {
  return {
    ui: 0,
    vis: 0,
    event: 0,
    buffering: 0,
  };
}

function isAfterAdStage(stage: VODStage): boolean {
  return ['AFTER_MIDROLL', 'AFTER_PREROLL'].includes(stage);
}

let vodStage: VODStage = 'NONE';

type EnforceRequirement<T> = { [K in keyof Required<T>]: T[K]; };

// We need to guarantee we reset each keys
const initialVideoSession: EnforceRequirement<VODPageSession> = {
  stage: 'NONE',
  subStage: 'NONE',
  contents: 0,
  totalContents: 0,
  ads: 0,
  cuePoints: 0,
  autoplay: false,
  autoplayDeliberate: false,
  autoplaySelectedIndex: -1,
  startTs: -1,
  isAdStalled: false,
  isAd: false,
  isPaused: false,
  pauseActionLevel: ActionLevel.NONE,
  isPauseExplicit: false,
  isAdPauseExplicit: false,
  hasErrorModal: false,
  earlyStartTs: -1,
  totalViewTime: 0,
  totalAdViewTime: 0,
  endTs: undefined,
  errorModalTs: undefined,
  lastError: undefined,
  lastAdError: undefined,
  cause: undefined,
  doubts: undefined,
  lastFeedback: undefined,
  utmSource: undefined,
  isAPPLaunchedFromDeepLink: false,
  hdmiConnectionStatus: 'unknown',
  isReattachingVideoElement: false,
  playbackSourceType: PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE,
  adPauseInfo: getDefaultAdPauseInfo(),
  bwwPeekRowImpressionCount: 0,
  bwwOpenCount: 0,
  bwwConvertCount: 0,
  isExtensionReady: false,
  isPrefetchAds: false,
};

const videoSession: VODPageSession = {
  /* istanbul ignore next */
  get stage() {
    return vodStage;
  },
  /* istanbul ignore next */
  set stage(s) {
    if (vodStage === s) return;
    eventEmitter.emit(VODPageSessionEvents.stageChange, s, vodStage);
    vodStage = s;
  },
  ...cloneDeep(initialVideoSession),
};

export function resetVODPageSession() {
  const cloneInitialVideoSession = cloneDeep(initialVideoSession);
  const { isAPPLaunchedFromDeepLink, totalContents, ...restOfProperties } = cloneInitialVideoSession;
  Object.assign(videoSession, restOfProperties);
  videoSession.startTs = now();
  exposeToTubiGlobal({ VODPageSession: videoSession });
}

/**
 * Do not rely on this in the components under OTTContentPlaybackContainer.
The video session lifecycle should be as long as the video page. But we will reset it when we unmount the container.
React will unmount the parent element first and then the children element. That will cause confusion.
If you need to fetch VOD stage, please fetch it from the context.
 * @returns VODPageSession
 */
export function getVODPageSession(): VODPageSession {
  return videoSession;
}

export function getVODPageSessionEventEmitter(): typeof eventEmitter {
  return eventEmitter;
}

export function enterPage({
  isAutomaticAutoplay,
  isDeeplink,
}: {
  isAutomaticAutoplay: boolean;
  resumePosition?: number;
  contentId?: string;
  isDeeplink?: boolean;
}) {
  const queryObj = parseQueryString(location.search);
  videoSession.stage = 'IDLE';
  videoSession.subStage = 'NONE';
  videoSession.contents++;
  videoSession.totalContents++;
  videoSession.autoplay = isAutomaticAutoplay;
  videoSession.autoplayDeliberate = !!queryObj.deliberate;
  videoSession.utmSource = queryObj.utm_source as string | undefined;
  videoSession.isAPPLaunchedFromDeepLink = videoSession.isAPPLaunchedFromDeepLink || !!isDeeplink;
  setPlaybackSourceType();
}

export function setPlaybackSourceType() {
  const { autoplay_from_trailer, video_preview } = parseQueryString(location.search);
  if (autoplay_from_trailer) {
    videoSession.playbackSourceType = PlaybackSourceType.AUTOPLAY_FROM_TRAILER;
  } else if (video_preview) {
    videoSession.playbackSourceType = PlaybackSourceType.VIDEO_PREVIEWS;
  }
}

export function setExtensionReady() {
  videoSession.isExtensionReady = true;
}

export function cuePointFilled({ isPreroll }: { isPreroll: boolean }) {
  videoSession.stage = isPreroll ? 'BEFORE_PREROLL' : 'BEFORE_MIDROLL';
  videoSession.subStage = 'NONE';
  videoSession.cuePoints++;
}

export function adPodFetch() {
  videoSession.subStage = 'AD_POD_FETCHING';
}

export function adPodFetchSuccess(data: AdPodFetchSuccess) {
  if (videoSession.subStage === 'AD_POD_FETCHING') {
    videoSession.subStage = 'AD_POD_FETCH_SUCCESS';
  }
  if (data.isPrefetchAds) {
    videoSession.isPrefetchAds = true;
  }
}

export function adPodFetchError() {
  if (videoSession.subStage === 'AD_POD_FETCHING') {
    videoSession.subStage = 'AD_POD_FETCH_ERROR';
  }
}

export function adPodEmpty({ isPreroll }: { isPreroll: boolean }) {
  if (isPreroll && videoSession.stage === 'IDLE') {
    videoSession.stage = 'EMPTY_PREROLL';
    videoSession.subStage = 'NONE';
  }
}

export function adPlayerSetup() {
  videoSession.isAd = true;
  videoSession.subStage = 'SETUP_ADS_PLAYER';
}

export function adStartLoad({ isPreroll }: { isPreroll: boolean }) {
  videoSession.ads++;
  videoSession.stage = isPreroll ? 'PREROLL' : 'MIDROLL';
  videoSession.subStage = 'START_LOAD';
  videoSession.adPauseInfo = getDefaultAdPauseInfo();
  videoSession.isAdStalled = false;
  if (!isPreroll && videoSession.isPrefetchAds) {
    videoSession.isPrefetchAds = false;
  }
}

export function adFirstFrameViewed({ isPreroll }: { isPreroll: boolean }) {
  videoSession.stage = isPreroll ? 'PREROLL' : 'MIDROLL';
  videoSession.subStage = 'VIEWED_FIRST_FRAME';
}

export function adCurrentTimeProgressed({ isPreroll }: { isPreroll: boolean }) {
  videoSession.stage = isPreroll ? 'PREROLL' : 'MIDROLL';
  videoSession.subStage = 'NONE';
}

export function adStall() {
  videoSession.isAdStalled = true;
}

export function adTime() {
  videoSession.isAdStalled = false;
}

export function adPodComplete(data: AdPodCompleteEventData) {
  videoSession.stage = data.isPreroll ? 'AFTER_PREROLL' : 'AFTER_MIDROLL';
  videoSession.isAdStalled = false;
  videoSession.subStage = 'AD_POD_COMPLETE';
}

export function contentStartLoad(data: StartLoadEventData) {
  const { isResumeFromAd } = data;
  videoSession.isAd = false;
  if (!isResumeFromAd) {
    videoSession.stage = 'CONTENT_STARTUP';
  }
  videoSession.subStage = 'START_LOAD';
}

export function contentFirstFrameViewed() {
  videoSession.subStage = 'VIEWED_FIRST_FRAME';
  if (isAfterAdStage(videoSession.stage)) {
    return;
  }
  videoSession.stage = 'READY';
}

export function contentCurrentTimeProgressed() {
  if (!isAfterAdStage(videoSession.stage)) {
    videoSession.stage = 'EARLY_START';
  }
  videoSession.earlyStartTs = now();
  videoSession.subStage = 'NONE';
}

// intended to be called just before paused()
// gets reset when pauses end
export function markPauseAction(level: ActionLevel) {
  videoSession.isPauseExplicit = isPauseExplicit(level);
  videoSession.pauseActionLevel = level;
  if (videoSession.isAd) {
    videoSession.isAdPauseExplicit = videoSession.isPauseExplicit;
    if (videoSession.isPauseExplicit) {
      const keyToIncrement: keyof VODPageSession['adPauseInfo'] = level === ActionLevel.VISIBILITY_CHANGE ? 'vis' : 'ui';
      videoSession.adPauseInfo[keyToIncrement]++;
      if (VODPlaybackSession.getVODPlaybackInfo().isAdBuffering) {
        videoSession.adPauseInfo.buffering++;
      }
    }
  }
}

export function paused() {
  videoSession.isPaused = true;
}

export function adPaused() {
  paused();
  videoSession.adPauseInfo.event++;
}

export function timeupdate() {
  videoSession.isReattachingVideoElement = false;
  if (videoSession.isPaused) {
    videoSession.isPaused = false;
    videoSession.isPauseExplicit = false;
    videoSession.pauseActionLevel = ActionLevel.NONE;
    videoSession.isAdPauseExplicit = false;
  }
  if (['FALLBACK', 'RELOAD'].includes(videoSession.stage)) {
    videoSession.stage = 'EARLY_START';
    videoSession.subStage = 'NONE';
    videoSession.earlyStartTs = now();
  }
  if ((videoSession.stage === 'EARLY_START' ||
      (['AFTER_PREROLL', 'AFTER_MIDROLL'].includes(videoSession.stage) && videoSession.subStage === 'NONE'))
    && now() - videoSession.earlyStartTs > EARLY_START_GAP_MILLISECONDS) {
    videoSession.stage = 'IN_STREAM';
    videoSession.subStage = 'NONE';
  }
}

export function fallback() {
  videoSession.stage = 'FALLBACK';
  videoSession.subStage = 'NONE';
}

export function feedback(feedbackIssue: FeedbackIssueTypeKey) {
  videoSession.lastFeedback = feedbackIssue;
}

export function showErrorModal() {
  videoSession.hasErrorModal = true;
  videoSession.errorModalTs = now();
}

export function hideErrorModal() {
  videoSession.hasErrorModal = false;
  videoSession.errorModalTs = undefined;
}

export function adError(error: AdError) {
  videoSession.lastAdError = error;
}

export function contentError(error: ErrorEventData) {
  videoSession.lastError = { ...error, recv_time: now() };
}

export function addViewTime(viewTime: number) {
  videoSession.totalViewTime += viewTime;
}

export function addAdViewTime(adViewTime: number) {
  videoSession.totalAdViewTime += adViewTime;
}

export function setCause(cause: VODExitCause) {
  videoSession.cause = cause;
}

export function setDoubts(doubts: VODExitCauseType[]) {
  videoSession.doubts = doubts;
}

// We will call this when we unmount the player page container
// That means the user leave the player page
export function endVODSession() {
  eventEmitter.emit(VODPageSessionEvents.ended);
}

export function reloadSrc() {
  videoSession.stage = 'RELOAD';
  videoSession.subStage = 'NONE';
}

export function reattachVideoElement() {
  videoSession.isReattachingVideoElement = true;
}

export function updateHdmiConnectionStatus(newStatus: HDMIConnectionState) {
  videoSession.hdmiConnectionStatus = newStatus;
}

export function incrementBwwPeekRowImpressionCount() {
  videoSession.bwwPeekRowImpressionCount++;
}

export function incrementBwwOpenCount() {
  videoSession.bwwOpenCount++;
}

export function incrementBwwConvertCount() {
  videoSession.bwwConvertCount++;
}

export function setAutoplaySelectedIndex(selectedIndex: number) {
  videoSession.autoplaySelectedIndex = selectedIndex;
}

export const VODPageSessionContext = createContext(getVODPageSession().stage);
