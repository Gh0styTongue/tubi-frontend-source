export const enum BufferRatioGroup {
  BEST = 'BEST',
  CORE = 'CORE',
  LOW_END = 'LOW_END'
}

export const enum StreakCategory {
  ENTER_BEST = 'ENTER_BEST',
  EXIT_BEST = 'EXIT_BEST',
  ENTER_LOW_END = 'ENTER_LOW_END',
  EXIT_LOW_END = 'EXIT_LOW_END',
  NONE = 'NONE'
}

export interface HysteresisThresholds {
  version: string;
  coreToBest: {
    enterBestBufferRatio: number;
    exitBestBufferRatio: number;
    enterBestSessionCount: number;
    exitBestSessionCount: number;
  };
  coreToLowEnd: {
    enterLowEndBufferRatio: number;
    exitLowEndBufferRatio: number;
    enterLowEndSessionCount: number;
    exitLowEndSessionCount: number;
  };
  windowLength: number;
}

// Tolerance streak result for v1.1 algorithm
export interface ToleranceStreakResult {
  qualifyingCount: number;
  totalExamined: number;
  breaksUsed: number;
  meetsRequirement: boolean;
}

// Flattened Buffer Ratio Store (tracks single device)
export interface BufferRatioStore {
  version: string;
  createdAt: number;
  group: BufferRatioGroup; // current group
  bufferRatioWindow: number[]; // buffer ratio records, last 10
  lastUpdated: number; // last updated timestamp
}

/**
 * Buffer ratio classification thresholds with 1-break tolerance for ENTER transitions
 * Conservative approach to handle abnormal samples gracefully
 */
export const THRESHOLDS_V1_1: HysteresisThresholds = {
  version: '1.1',
  coreToBest: {
    enterBestBufferRatio: 0.02, // ≤ 0.02% to count as "low"
    exitBestBufferRatio: 0.03, // > 0.03% is "bad" while in BEST
    enterBestSessionCount: 5, // 5 of 6 sessions (1 break allowed)
    exitBestSessionCount: 3, // 3 poor sessions → drop to CORE
  },
  coreToLowEnd: {
    enterLowEndBufferRatio: 0.25, // ≥ 0.25% to count as "high"
    exitLowEndBufferRatio: 0.15, // < 0.15% counts as recovery
    enterLowEndSessionCount: 5, // 5 of 6 sessions (1 break allowed)
    exitLowEndSessionCount: 3, // 3 good sessions to exit LOW_END
  },
  windowLength: 10,
};

export const THRESHOLDS_VERSION = THRESHOLDS_V1_1.version;
