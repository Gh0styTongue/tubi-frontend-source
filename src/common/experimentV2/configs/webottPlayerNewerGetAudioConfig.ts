import type { ExperimentDescriptor } from './types';

const descriptor : ExperimentDescriptor<{
  use_newer: boolean;
}> = {
  name: 'webott_player_newer_get_audio_config_v0',
  defaultParams: {
    use_newer: false,
  },
  inYoubora: true,
};

export default descriptor;
