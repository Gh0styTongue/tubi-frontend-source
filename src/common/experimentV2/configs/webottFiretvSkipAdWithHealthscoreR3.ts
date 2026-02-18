import type { ExperimentDescriptor } from './types';

export const webottFiretvSkipAdWithHealthscoreR3: ExperimentDescriptor<{
  healthscore_skip_threshold: number;
}> = {
  name: 'webott_firetv_skip_ad_with_healthscore_r3_v0',
  defaultParams: {
    healthscore_skip_threshold: 0.4, // FireTV uses lower default
  },
  inYoubora: true,
};

