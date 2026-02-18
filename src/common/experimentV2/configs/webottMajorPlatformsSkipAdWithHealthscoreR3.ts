import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsSkipAdWithHealthscoreR3: ExperimentDescriptor<{
  healthscore_skip_threshold: number;
}> = {
  name: 'webott_major_platforms_skip_ad_with_healthscore_r3_v0',
  layer: 'webott_major_platforms_ads_shared',
  defaultParams: {
    healthscore_skip_threshold: 0.6,
  },
  inYoubora: true,
};

