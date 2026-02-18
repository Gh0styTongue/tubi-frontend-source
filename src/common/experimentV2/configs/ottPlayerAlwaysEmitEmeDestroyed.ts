import type { ExperimentDescriptor } from './types';

const descriptor : ExperimentDescriptor<{
  always_emit_destroyed: boolean;
}> = {
  name: 'webott_player_always_emit_eme_destroyed_v0',
  defaultParams: {
    always_emit_destroyed: false,
  },
  inYoubora: true,
};

export default descriptor;
