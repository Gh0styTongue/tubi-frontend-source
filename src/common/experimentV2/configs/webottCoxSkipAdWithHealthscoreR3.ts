import type { ExperimentDescriptor } from './types';

export const webottCoxSkipAdWithHealthscoreR3: ExperimentDescriptor<{
  healthscore_skip_threshold: number;
}> = {
  name: 'webott_cox_skip_ad_with_healthscore_r3_v0',
  defaultParams: {
    healthscore_skip_threshold: 0.6,
  },
  inYoubora: true,
};

