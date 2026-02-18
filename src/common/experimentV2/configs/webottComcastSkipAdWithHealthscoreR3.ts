import type { ExperimentDescriptor } from './types';

export const webottComcastSkipAdWithHealthscoreR3: ExperimentDescriptor<{
  healthscore_skip_threshold: number;
}> = {
  name: 'webott_comcast_skip_ad_with_healthscore_r3_v0',
  defaultParams: {
    healthscore_skip_threshold: 0.6,
  },
  inYoubora: true,
};

