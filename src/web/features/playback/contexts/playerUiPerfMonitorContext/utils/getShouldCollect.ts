import type { PlayerType } from 'client/features/playback/track/client-log';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

type SampleRate = Partial<Record<OTTPLATFORM, number>>;
// What % of devices should we collect performance data from? 1 is 100%, 0 is 0%
export const PLATFORM_SAMPLE_RATES: Partial<Record<PlayerType, SampleRate>> = {
  v: {
    FIRETV_HYB: 0.10,
  },
  p: {
    FIRETV_HYB: 0.05,
    VIZIO: 0.05,
    COMCAST: 0.05,
  },
};

// fall back on this sample rate if no platform-specific rate is defined
export const DEFAULT_SAMPLE_RATES: Partial<Record<PlayerType, number>> = {
  v: 0.10,
  p: 0.01,
};

export const DEFAULT_SAMPLE_RATE = 0.10;

/**
 * Should we enable the player UI performance monitor on this device?
 */
const shouldCollectCache = new Map<PlayerType, boolean>();
export const getShouldCollect = (playerType: PlayerType) => {
  // do not collect for unit tests
  if (__TESTING__) {
    return false;
  }
  if (FeatureSwitchManager.isEnabled(['Player', 'EnablePlayerUiPerfMonitor'])) {
    return true;
  }
  if (!shouldCollectCache.has(playerType)) {
    const playerTypeSampleRates = PLATFORM_SAMPLE_RATES[playerType] || {};
    const platformSampleRate = playerTypeSampleRates[__OTTPLATFORM__];
    const defaultSampleRate = DEFAULT_SAMPLE_RATES[playerType] || DEFAULT_SAMPLE_RATE;
    const sampleRate = platformSampleRate !== undefined ? platformSampleRate : defaultSampleRate;
    shouldCollectCache.set(playerType, Math.random() < sampleRate);
  }

  return shouldCollectCache.get(playerType)!;
};

// for testing only
export const resetShouldCollect = () => {
  shouldCollectCache.clear();
};
