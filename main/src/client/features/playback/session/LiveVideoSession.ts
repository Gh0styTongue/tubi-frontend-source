import { PLAYER_EVENTS } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import { exposeToTubiGlobal } from 'client/global';

// Check discussion in this PR https://github.com/adRise/www/pull/13649
type LivePlaybackStage =
  // UNDER_PREVIEW: The player is playing on the preview banner. This means the user watches on the home screen and might not focus entirely on the content. Because going back to the home screen is not easy, we will mark this stage whenever the user returns to the preview mode.
  'UNDER_PREVIEW'
  // WITH_EPG: When the user scrolls to different channels, the channel guide overlay will activate, blocking parts of the screen. This can make it difficult for the user to focus on the content, so it is considered a separate stage. However, the channel guide is easy to trigger, so we only mark it as a separate stage the first time it appears.
  | 'WITH_EPG'
  // EARLY_START: We consider the time that 80% of fullscreen playback will exceed as an early start stage.
  | 'EARLY_START'
  // PAUSED_RESUME: Like the EARLY_START stage, this refers to recovery from a paused state.
  | 'PAUSED_RESUME'
  // IN_STREAM: Normal playback.
  | 'IN_STREAM'
  | 'AD';

// We consider one live channel playback as a live video session. That's because the user will stick more to one channel if it plays well.
export type LiveStage = LivePlaybackStage
  // IDLE: The player is not ready yet.
  | 'IDLE'
  // Ready: The player is prepared, but playback has not started.
  | 'READY'
  // UNDER_PREVIEW: The player is playing on the preview banner. This means the user watches on the home screen and might not focus entirely on the content. Because going back to the home screen is not easy, we will mark this stage whenever the user returns to the preview mode.
  | 'UNDER_PREVIEW'
    // PAUSED: An edge case may be where we pause linear playback, such as during a visibility change.
  | 'PAUSED';

const EARLY_START_GAP_SECONDS = 30;

type PauseCause = 'HDMI' | 'VISIBILITY';

export interface LiveVideoSession {
  stage: LiveStage;
  adsCount: number;
  previewDuration: number;
  fullscreenDuration: number;
  fullscreenDurationAfterLastStart: number;
  withEPGDuration: number;
  startTimestamp: number;
  errorModalTimestamp?: number;
  // isBuffering: boolean;
  stallDuration: number;
  stallCount: number;
  isPaused: boolean;
  bufferingTimestamp?: number;
  hasErrorModal: boolean;
  errorModalResolved: boolean;
  errorModalCount: number;
  lastError?: ErrorEventData | null;
  isPreview: boolean;
  withEPG: boolean;
  isFullscreen: boolean;
  prevPosition: number;
  isAd: boolean;
  pauseCause?: PauseCause;
  isRevisit: boolean;
  isBuffering: boolean;
  // Consider it as deliberate watch when user enter fullscreen mode
  isDeliberate: boolean;
  passiveExitCause?: PLAYER_EVENTS.linearSessionExpired;
}

const initialVideoSession: LiveVideoSession = {
  stage: 'IDLE',
  startTimestamp: -1,
  errorModalTimestamp: -1,
  adsCount: 0,
  previewDuration: 0,
  withEPGDuration: 0,
  fullscreenDuration: 0,
  fullscreenDurationAfterLastStart: 0,
  errorModalCount: 0,
  stallDuration: 0,
  stallCount: 0,
  isBuffering: false,
  isPaused: false,
  isPreview: false,
  withEPG: false,
  isFullscreen: false,
  hasErrorModal: false,
  errorModalResolved: true,
  isAd: false,
  prevPosition: -1,
  isRevisit: false,
  isDeliberate: false,
};

let videoSession: LiveVideoSession;
resetLiveVideoSession();

export function resetLiveVideoSession() {
  videoSession = {
    ...initialVideoSession,
    startTimestamp: now(),
  };
  exposeToTubiGlobal({ liveVideoSession: videoSession });
}

export function getLiveVideoSession(): LiveVideoSession {
  return videoSession;
}

function setPlaybackStage() {
  const {
    stage, isPreview, isAd, fullscreenDurationAfterLastStart,
    withEPG, isPaused,
  } = videoSession;
  if (isPaused) {
    videoSession.stage = 'PAUSED';
    return;
  }
  // Paused --> Paused Resume
  if (stage === 'PAUSED') {
    videoSession.stage = 'PAUSED_RESUME';
    videoSession.fullscreenDurationAfterLastStart = 0;
    return;
  }
  if (isPreview) {
    videoSession.stage = 'UNDER_PREVIEW';
    return;
  }
  if (isAd) {
    videoSession.stage = 'AD';
    return;
  }
  if (fullscreenDurationAfterLastStart < EARLY_START_GAP_SECONDS) {
    if (stage === 'PAUSED_RESUME') return;
    if (withEPG) {
      videoSession.stage = 'WITH_EPG';
      return;
    }
    videoSession.stage = 'EARLY_START';
    return;
  }
  videoSession.errorModalResolved = true;
  videoSession.stage = 'IN_STREAM';
}

function updateDuration(position: number) {
  const positionInt = Math.floor(position);
  const { prevPosition, isPreview, withEPG, isFullscreen } = videoSession;
  videoSession.prevPosition = positionInt;
  if (prevPosition < 0 || positionInt === prevPosition) return;
  if (isPreview) {
    videoSession.previewDuration++;
    return;
  }
  if (withEPG) {
    videoSession.withEPGDuration++;
    return;
  }
  if (isFullscreen) {
    videoSession.fullscreenDuration++;
    videoSession.fullscreenDurationAfterLastStart++;
  }
}

export function playerReady() {
  videoSession.stage = 'READY';
}

export function adStart() {
  videoSession.adsCount++;
  videoSession.isAd = true;
  setPlaybackStage();
}

export function adComplete() {
  videoSession.isAd = false;
  setPlaybackStage();
}

export function paused(cause: PauseCause) {
  videoSession.isPaused = true;
  videoSession.stage = 'PAUSED';
  videoSession.pauseCause = cause;
}

export function toggleFullscreen(state: PlayerDisplayMode) {
  if (state === PlayerDisplayMode.BANNER) {
    videoSession.isFullscreen = false;
    videoSession.withEPG = false;
    videoSession.isPreview = true;
    setPlaybackStage();
    return;
  }
  if (state === PlayerDisplayMode.DEFAULT) {
    videoSession.isFullscreen = true;
    videoSession.isPreview = false;
    setPlaybackStage();
  }
}

export function markRevisit() {
  videoSession.isRevisit = true;
}

export function markLinearSessionExpireReload() {
  videoSession.passiveExitCause = PLAYER_EVENTS.linearSessionExpired;
}

export function toggleConsole(visible: boolean) {
  videoSession.withEPG = visible;
  // We always toggle fullscreen before toggle console, so we mark deliberate in the later one.
  if (!visible && videoSession.isFullscreen) {
    videoSession.isDeliberate = true;
  }
  setPlaybackStage();
}

export function timeupdate({ position }: { position: number }) {
  if (position <= 0) return;
  if (videoSession.isPaused) {
    videoSession.isPaused = false;
    delete videoSession.pauseCause;
  }
  updateDuration(position);
  setPlaybackStage();
}

export function showErrorModal() {
  videoSession.hasErrorModal = true;
  videoSession.errorModalResolved = false;
  videoSession.fullscreenDurationAfterLastStart = 0;
  videoSession.errorModalCount += 1;
  videoSession.errorModalTimestamp = now();
}

export function hideErrorModal() {
  videoSession.hasErrorModal = false;
  videoSession.errorModalTimestamp = undefined;
}

export function contentError(error: LiveVideoSession['lastError']) {
  videoSession.lastError = error;
}

export function bufferEnd(duration: number) {
  videoSession.stallDuration += duration;
  videoSession.stallCount += 1;
}
