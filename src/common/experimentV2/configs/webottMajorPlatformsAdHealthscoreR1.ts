import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsAdHealthscoreR1: ExperimentDescriptor<{
  skip_ad_factor: 'only_error' | 'error_or_healthscore';
}> = {
  name: 'webott_major_platforms_ad_healthscore_r1',
  defaultParams: {
    skip_ad_factor: 'only_error',
  },
};
