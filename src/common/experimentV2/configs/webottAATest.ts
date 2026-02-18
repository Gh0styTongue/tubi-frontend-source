import type { ExperimentDescriptor } from './types';

export const WebOTTAAExperiment: ExperimentDescriptor<{
    enabled: boolean;
}> = {
  name: 'webott_aa_test',
  defaultParams: {
    enabled: false,
  },
};
