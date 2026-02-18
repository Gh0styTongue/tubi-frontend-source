/**
 * HDC Ad Experiment State
 * Provides a unified interface for HDC experiment state management.
 * This file is kept separate to avoid circular dependencies.
 */
import { getExperiment } from 'common/experimentV2';
import { ottHdcAllHoldback } from 'common/experimentV2/configs/ottHdcAllHoldback';

export interface HdcAdExperimentState {
  getHdcEnabled: () => boolean;
  logExposure: () => void;
}

export function getHdcAdExperimentState(): HdcAdExperimentState {
  if (!__IS_MAJOR_PLATFORM__) {
    return {
      getHdcEnabled: () => false,
      logExposure: () => {},
    };
  }

  const hdcExperiment = getExperiment(ottHdcAllHoldback, { disableExposureLog: true });

  return {
    getHdcEnabled: () => hdcExperiment.get('enabled'),
    logExposure: () => getExperiment(ottHdcAllHoldback),
  };
}

