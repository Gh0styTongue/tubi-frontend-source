import { useCallback, useMemo } from 'react';

import ottMajorRequestAdsAfterSeek from 'common/experiments/config/ottMajorRequestAdsAfterSeek';
import { getExperiment } from 'common/experimentV2';
import { ottMajorRequestAdsAfterSeek as ottMajorRequestAdsAfterSeekV2 } from 'common/experimentV2/configs/ottMajorRequestAdsAfterSeek';
import useExperiment from 'common/hooks/useExperiment';

export const useOTTMajorRequestAdsAfterSeek = () => {
  const experiment = useExperiment(ottMajorRequestAdsAfterSeek);
  let value = experiment.getValue();
  if (!experiment.isInExperiment()) {
    const statsigExperiment = getExperiment(ottMajorRequestAdsAfterSeekV2, { disableExposureLog: true });
    value = statsigExperiment.get('enable');
  }

  const logExposure = useCallback(() => {
    if (experiment.isInExperiment()) {
      experiment.logExposure();
    } else {
      getExperiment(ottMajorRequestAdsAfterSeekV2);
    }
  }, [experiment]);

  return useMemo(() => ({
    value,
    logExposure,
  }), [value, logExposure]);
};
