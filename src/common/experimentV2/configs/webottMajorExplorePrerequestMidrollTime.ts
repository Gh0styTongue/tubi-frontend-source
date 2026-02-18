import type { ExperimentDescriptor } from './types';

export const webottMajorExplorePrerequestMidrollTime: ExperimentDescriptor<{
  time: 6 | 11 | 16;
}> = {
  name: 'webott_major_explore_pre_request_midroll_time_v0',
  defaultParams: {
    time: 11,
  },
};
