import type {
  AdError,
  ErrorEventData,
} from '@adrise/player';
import {
  ActionLevel,
} from '@adrise/player';
import { parseQueryString } from '@adrise/utils/lib/queryString';
import { now } from '@adrise/utils/lib/time';
import { TypedEventEmitter } from '@adrise/utils/lib/TypedEventEmitter';
import { PlaybackSourceType } from '@tubitv/analytics/lib/genericEvents';
import cloneDeep from 'lodash/cloneDeep';
import { createContext } from 'react';

import { exposeToTubiGlobal } from 'client/global';
import { updatePlayerSnapshot } from 'client/snapshot';
import type { HDMIConnectionState } from 'common/types/video';
import type { FeedbackIssueTypeKey } from 'ott/features/playback/components/FeedbackModal/FeedbackModal';

import { isPauseExplicit } from '../predicates/isPauseExplicit';

export type VODStage = 'IDLE' | 'EMPTY_PREROLL' | 'READY' | 'BEFORE_PREROLL' | 'PREROLL' | 'AFTER_PREROLL' | 'EARLY_START' | 'IN_STREAM' | 'BEFORE_MIDROLL' | 'MIDROLL' | 'AFTER_MIDROLL' | 'DRM_FALLBACK' | 'NONE';

export type VODExitCauseType = 'DRM_CRASH'
| 'CDN_JITTER'
| 'SETUP_CRASH'
| 'MANIFEST_ERROR'
| 'PLAY_INTERRUPT' | 'AD_PLAY_INTERRUPT'
| 'VIDEO_FREEZE' | 'VIDEO_FREEZE_AFTER_AD'
| 'AD_BUFFERING' | 'VIDEO_BUFFERING_AFTER_AD'
| 'AD_STALL'
| 'AD_NO_BUFFER' | 'AD_BLACK_SCREEN_NOTICE' | 'AD_LOAD_LONG'
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
| 'SEEKING_WITHOUT_BUFFER' | 'REATTACH_CLEAR_BUFFER' | 'RELOAD_CLEAR_BUFFER'
| 'BUFFER_NUDGE_FAILED' | 'EPISODE_REGISTRATION_GATE'
| 'END_OF_STREAM' | 'NEAR_END'
| 'NON_INTERESTED_AUTOSTART_TRAILER' | 'NON_INTERESTED_AUTOSTART_PREVIEW'
| 'QUICK_LEAVE_IN_1_MIN';

export interface VODExitCause {
  type: VODExitCauseType;
  error?: ErrorEventData;
  message?: FeedbackIssueTypeKey;
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

// Data Source: https://app.periscopedata.com/app/adrise:tubi/1072801/WebOTT-Player-Exit?widget=16677576&udv=1765408
// We need to update this monthly.
// Last updated: 2023/05/08
const EARLY_START_GAP_SECONDS_MAP: {
  [key in OTTPLATFORM]?: number;
} = {
  FIRETV_HYB: 80,
  COMCAST: 48,
  COX: 48,
  LGTV: 50,
  PS5: 60,
  VIZIO: 60,
  XBOXONE: 50,
};

const EARLY_START_GAP_SECONDS = EARLY_START_GAP_SECONDS_MAP[__OTTPLATFORM__] || 30;

const eventEmitter = new TypedEventEmitter<Listeners>();

// VODPageSession means lifecycle in a web page, includes playback of multiple contents
export interface VODPageSession {
  stage: VODStage;
  contents: number;
  ads: number;
  cuePoints: number;
  // automatic autoplay but not deliberately
  autoplay: boolean;
  startTs: number;
  convertPosition: number;
  // Ad/Content convert
  convertTs?: number;
  endTs?: number;
  isAdStalled: boolean;
  isAd: boolean;
  isPaused: boolean;
  isPauseExplicit: boolean; // is this pause user-initiated
  pauseActionLevel: ActionLevel;
  isAdPauseExplicit: boolean; // is this a deliberate pause due to ads
  hasErrorModal: boolean;
  errorModalTs?: number;
  lastAdTs?: number;
  titleStartTs: number;
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
  isReloadingSrc: boolean;
  isReattachingVideoElement: boolean;
  isInEpisodeRegistrationGate: boolean;
  playbackSourceType: PlaybackSourceType;
}

let vodStage: VODStage = 'NONE';

type EnforceRequirement<T> = { [K in keyof Required<T>]: T[K]; };

// We need to guarantee we reset each keys
const initialVideoSession: EnforceRequirement<VODPageSession> = {
  stage: 'NONE',
  contents: 0,
  ads: 0,
  cuePoints: 0,
  autoplay: false,
  startTs: -1,
  titleStartTs: -1,
  isAdStalled: false,
  isAd: false,
  isPaused: false,
  pauseActionLevel: ActionLevel.NONE,
  isPauseExplicit: false,
  isAdPauseExplicit: false,
  hasErrorModal: false,
  convertPosition: 0,
  totalViewTime: 0,
  totalAdViewTime: 0,
  convertTs: undefined,
  endTs: undefined,
  errorModalTs: undefined,
  lastAdTs: undefined,
  lastError: undefined,
  lastAdError: undefined,
  cause: undefined,
  doubts: undefined,
  lastFeedback: undefined,
  utmSource: undefined,
  isAPPLaunchedFromDeepLink: false,
  hdmiConnectionStatus: 'unknown',
  isReattachingVideoElement: false,
  isReloadingSrc: false,
  isInEpisodeRegistrationGate: false,
  playbackSourceType: PlaybackSourceType.UNKNOWN_PLAYBACK_SOURCE,
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
    updatePlayerSnapshot();
  },
  ...cloneDeep(initialVideoSession),
};

function isEarlyStart() {
  return ['EARLY_START', 'AFTER_PREROLL', 'AFTER_MIDROLL'].includes(videoSession.stage);
}

export function isContentPlaying() {
  return ['EARLY_START', 'IN_STREAM'].includes(videoSession.stage);
}

export function resetVODPageSession() {
  const cloneInitialVideoSession = cloneDeep(initialVideoSession);
  Object.entries(cloneInitialVideoSession).forEach(([key, value]) => {
    if (key !== 'isAPPLaunchedFromDeepLink') {
      videoSession[key] = value;
    }
  });
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
  resumePosition,
  isDeeplink,
}: {
  isAutomaticAutoplay: boolean;
  resumePosition?: number;
  contentId?: string;
  isDeeplink?: boolean;
}) {
  const queryObj = parseQueryString(location.search);
  videoSession.stage = 'IDLE';
  videoSession.contents++;
  videoSession.autoplay = isAutomaticAutoplay;
  videoSession.convertPosition = resumePosition ?? 0;
  videoSession.utmSource = queryObj.utm_source as string | undefined;
  videoSession.isAPPLaunchedFromDeepLink = videoSession.isAPPLaunchedFromDeepLink || !!isDeeplink;
  setPlaybackSourceType();
}

export function setPlaybackSourceType() {
  const {
    autoplay_from_trailer,
    video_preview,
  } = parseQueryString(location.search);
  if (autoplay_from_trailer) {
    videoSession.playbackSourceType = PlaybackSourceType.AUTOPLAY_FROM_TRAILER;
  } else if (video_preview) {
    videoSession.playbackSourceType = PlaybackSourceType.VIDEO_PREVIEWS;
  }
}

// content player loadeddata
export function playerReady() {
  videoSession.stage = 'READY';
}

export function cuePointFilled(isPreroll: boolean) {
  videoSession.stage = isPreroll ? 'BEFORE_PREROLL' : 'BEFORE_MIDROLL';
  videoSession.cuePoints++;
}

export function adPodEmpty(isPreroll: boolean) {
  if (isPreroll && videoSession.stage === 'IDLE') {
    videoSession.stage = 'EMPTY_PREROLL';
  }
}

export function adPodStart(isPreroll: boolean) {
  videoSession.stage = isPreroll ? 'PREROLL' : 'MIDROLL';
  videoSession.convertTs = now();
  videoSession.isAd = true;
}

export function adStart(isPreroll: boolean) {
  videoSession.stage = isPreroll ? 'PREROLL' : 'MIDROLL';
  if (!videoSession.convertTs) {
    videoSession.convertTs = now();
  }
  videoSession.ads++;
  videoSession.isAd = true;
  videoSession.isAdStalled = false;
  videoSession.lastAdTs = now();
}

export function adStall() {
  videoSession.isAdStalled = true;
}

export function contentStart(position: number) {
  videoSession.stage = videoSession.stage === 'PREROLL'
    ? 'AFTER_PREROLL'
    : videoSession.stage === 'MIDROLL'
      ? 'AFTER_MIDROLL'
      : 'EARLY_START';
  videoSession.convertTs = now();
  videoSession.convertPosition = position;
  videoSession.isAd = false;
  videoSession.isAdStalled = false;
}

// intended to be called just before paused()
// gets reset when pauses end
export function markPauseAction(level: ActionLevel) {
  videoSession.isPauseExplicit = isPauseExplicit(level);
  videoSession.pauseActionLevel = level;
  videoSession.isAdPauseExplicit = videoSession.isAd && videoSession.isPauseExplicit;
}

export function paused() {
  videoSession.isPaused = true;
}

export function timeupdate(position: number) {
  videoSession.isReloadingSrc = false;
  videoSession.isReattachingVideoElement = false;
  if (videoSession.stage === 'READY') {
    videoSession.stage = 'EARLY_START';
    videoSession.titleStartTs = now();
    return;
  }
  if (!isEarlyStart()) return;
  if (position - videoSession.convertPosition > EARLY_START_GAP_SECONDS) {
    videoSession.stage = 'IN_STREAM';
  }
  if (videoSession.isPaused) {
    videoSession.isPaused = false;
    videoSession.isPauseExplicit = false;
    videoSession.pauseActionLevel = ActionLevel.NONE;
    videoSession.isAdPauseExplicit = false;
  }
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
  if (videoSession.stage.includes('MIDROLL')) {
    updatePlayerSnapshot();
  }
}

export function contentError(error: ErrorEventData) {
  videoSession.lastError = error;
  if (videoSession.stage.includes('MIDROLL')) {
    updatePlayerSnapshot();
  }
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
  videoSession.isReloadingSrc = true;
}

export function reattachVideoElement() {
  videoSession.isReattachingVideoElement = true;
}

export function updateHdmiConnectionStatus(newStatus: HDMIConnectionState) {
  videoSession.hdmiConnectionStatus = newStatus;
}

// Set a flag to indicate that the user has entered the episode registration gate
// So we can set the correct exit cause when the user leaves the page
export function enterEpisodeRegistrationGate() {
  videoSession.isInEpisodeRegistrationGate = true;
}

export const VODPageSessionContext = createContext(getVODPageSession().stage);

