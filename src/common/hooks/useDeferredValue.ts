import { useDeferredValue as useReactDeferredValue } from 'react';

import { useExperiment } from 'common/experimentV2';
import { webottMajorPlatformsUseDeferredValue } from 'common/experimentV2/configs/webottMajorPlatformsUseDeferredValue';

export const useDeferredValue = <T>(value: T) => {
  const shouldUseDeferredValue = useExperiment(webottMajorPlatformsUseDeferredValue).get('enable');
  const deferredValue = useReactDeferredValue(value);
  if (shouldUseDeferredValue) {
    return deferredValue;
  }
  return value;
};
