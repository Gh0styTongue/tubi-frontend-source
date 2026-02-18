import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsDelayLoadHomescreen: ExperimentDescriptor<{
  delay_load_homescreen_strategy: 0 | 1;
}> = {
  name: 'webott_major_platforms_delay_load_homescreen',
  defaultParams: {
    delay_load_homescreen_strategy: 0,
  },
};
