import type { ExperimentDescriptor } from './types';

export default {
  name: 'webott_player_ignore_play_promise_v0',
  defaultParams: {
    ignore_play_promise: false,
  },
  inYoubora: true,
} as ExperimentDescriptor<{ ignore_play_promise: boolean }>;

