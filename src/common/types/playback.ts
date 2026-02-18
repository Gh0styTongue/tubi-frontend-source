import type {
  SET_TARGET_POSITION,
  EXIT_SEEKING,
  CLEAR_SEEK_TIMER,
  SHOW_CONTROLS,
  HIDE_CONTROLS,
  STEP_SEEK,
  RESET_PLAYER_UI,
  FAST_FORWARD,
  REWIND,
} from 'common/constants/action-types';

export type PlaybackAction = SetTargetPosition
  | ExitSeeking
  | ClearSeekTimer
  | ShowControls
  | HideControls
  | StepSeek
  | ResetPlayerUI
  | FastForward
  | Rewind;

interface SetTargetPosition {
  type: typeof SET_TARGET_POSITION;
  position: number;
}

interface ExitSeeking {
  type: typeof EXIT_SEEKING;
}

interface ClearSeekTimer {
  type: typeof CLEAR_SEEK_TIMER;
}

interface ShowControls {
  type: typeof SHOW_CONTROLS;
}

interface HideControls {
  type: typeof HIDE_CONTROLS;
}

interface StepSeek {
  type: typeof STEP_SEEK;
  targetPosition: number;
}

interface ResetPlayerUI {
  type: typeof RESET_PLAYER_UI;
}

interface FastForward {
  type: typeof FAST_FORWARD;
  seekRate: number;
}

interface Rewind {
  type: typeof REWIND;
  seekRate: number;
}

export const UNKNOWN_ERROR = 'unknown error';

/**
 * Complete network features data including both throughput and TTFB stats
 */
export type NetworkFeatures = {
  throughput: NetworkStatistics;
  ttfb: NetworkStatistics;
  records: NetworkRecord[];
  recordsCSV: string;
};

/**
 * Represents a single network feature record for a period
 */
export type NetworkRecord = {
  /** Average bandwidth during the period (kilobits per second) */
  bandwidth_kbps: number;
  /** Average latency (time-to-first-byte) during the period in milliseconds */
  latency_ms: number;
};

/**
 * Statistical metrics calculated from network records
 */
export type NetworkStatistics = {
  mean: number;
  std: number;
  min: number;
  max: number;
};
