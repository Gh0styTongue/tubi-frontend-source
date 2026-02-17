import { getLocalData, setLocalData, removeLocalData } from 'client/utils/localDataStorage';

import type { ExperimentExposureDetails } from './types';

interface ExposuresSeenState {
  [experimentName: string]: string[]; // an array of treatment names that have had their exposure logged
}

const KEY = '__exposuresSeen';
export function markExposuresSeen(exposures: ExperimentExposureDetails[]): void {
  const seen = getAllExposuresSeen();
  exposures.forEach(({ experiment, treatment }) => {
    if (experiment in seen && seen[experiment].indexOf(treatment) < 0) {
      seen[experiment].push(treatment);
    } else {
      seen[experiment] = [treatment];
    }
  });
  setLocalData(KEY, JSON.stringify(seen));
}

export function getAllExposuresSeen(): ExposuresSeenState {
  const json = getLocalData(KEY) || '{}';
  return JSON.parse(json);
}

export function getExposuresSeen(experiment: string): string[] {
  return getAllExposuresSeen()[experiment] || [];
}

export function clearAllExposuresSeen(): void {
  removeLocalData(KEY);
}
