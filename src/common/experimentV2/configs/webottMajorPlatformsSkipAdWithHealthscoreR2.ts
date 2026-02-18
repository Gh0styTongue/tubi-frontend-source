import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsSkipAdWithHealthscoreR2: ExperimentDescriptor<{
  healthscore_r2: boolean;
}> = {
  name: 'webott_major_platforms_skip_ad_with_healthscore_r2_v0',
  layer: 'webott_major_platforms_ads_shared',
  defaultParams: {
    healthscore_r2: false,
  },
  inYoubora: true,
};
