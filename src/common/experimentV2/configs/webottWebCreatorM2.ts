import type { ExperimentDescriptor } from './types';

export const webottWebCreatorM2: ExperimentDescriptor<{
  enabled: boolean;
}> = {
  name: 'webott_web_creator_m2',
  defaultParams: {
    enabled: false,
  },
};
