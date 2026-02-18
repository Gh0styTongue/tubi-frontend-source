import type { ExperimentDescriptor } from './types';

const experiment: ExperimentDescriptor<{
  strip_properties: boolean;
}> = {
  name: 'webott_player_memory_only_pass_valid_properties_v0',
  defaultParams: {
    strip_properties: true,
  },
};

export default experiment;

