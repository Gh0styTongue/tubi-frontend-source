import { useEffect } from 'react';

import type { ExperimentFactory } from 'common/experiments/types';

import useExperiment from './useExperiment';

function useExposureLogger<V, T extends string>(experimentConfig: ExperimentFactory<V, T>, shouldLogExposure = true) {
  const experiment = useExperiment(experimentConfig);
  useEffect(() => {
    if (shouldLogExposure) {
      experiment.logExposure();
    }
  }, [experiment, shouldLogExposure]);
}

export default useExposureLogger;
