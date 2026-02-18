import type { ExperimentDescriptor } from './types';

const experiment: ExperimentDescriptor<{
  can_use_trailer: boolean;
}> = {
  name: 'webott_player_use_trailer_for_preview_v0',
  defaultParams: {
    can_use_trailer: false,
  },
  inYoubora: true,
};

export default experiment;
