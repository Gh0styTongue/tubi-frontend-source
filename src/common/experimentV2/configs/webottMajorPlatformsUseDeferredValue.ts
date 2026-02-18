import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsUseDeferredValue: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_major_platforms_use_deferred_value',
  defaultParams: {
    enable: false,
  },
};
