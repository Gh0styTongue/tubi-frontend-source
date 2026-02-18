import type { ExperimentDescriptor } from './types';

export const webottMajorsDiluteTimeEventV0: ExperimentDescriptor<{
  enable_dilute: boolean;
}> = {
  name: 'webott_majors_dilute_time_event_v0',
  defaultParams: {
    enable_dilute: false,
  },
  inYoubora: true,
};

