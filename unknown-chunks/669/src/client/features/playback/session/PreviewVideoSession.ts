import type { ErrorEventData } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';

import { exposeToTubiGlobal } from 'client/global';

type PreviewStage = 'IDLE' | 'READY' | 'IN_STREAM' | 'NONE' | 'COMPLETED';

export interface PreviewVideoSession {
  stage: PreviewStage;
  startTimestamp?: number;
  endTimestamp?: number;
  isBuffering: boolean;
  isPaused: boolean;
  bufferingTimestamp?: number;
  titleStartTimestamp: number;
  lastError?: ErrorEventData;
}

const initialVideoSession: PreviewVideoSession = {
  stage: 'NONE',
  startTimestamp: -1,
  titleStartTimestamp: -1,
  isBuffering: false,
  isPaused: false,
};

let videoSession: PreviewVideoSession;
resetPreviewVideoSession();

export function resetPreviewVideoSession() {
  videoSession = {
    ...initialVideoSession,
    startTimestamp: now(),
  };
  exposeToTubiGlobal({ previewVideoSession: videoSession });
}

export function getPreviewVideoSession(): PreviewVideoSession {
  return videoSession;
}

export function playerReady() {
  videoSession.stage = 'READY';
  videoSession.isBuffering = true;
}

export function paused() {
  videoSession.isPaused = true;
}

export function timeupdate() {
  videoSession.stage = 'IN_STREAM';
  if (videoSession.isPaused) {
    videoSession.isPaused = false;
  }
}

export function bufferStart() {
  videoSession.isBuffering = true;
  videoSession.bufferingTimestamp = now();
}

export function bufferEnd() {
  videoSession.isBuffering = false;
  videoSession.bufferingTimestamp = undefined;
}

export function contentError(error: ErrorEventData) {
  videoSession.lastError = error;
}

export function idle() {
  videoSession.stage = 'IDLE';
}

export function complete() {
  videoSession.stage = 'COMPLETED';
}
