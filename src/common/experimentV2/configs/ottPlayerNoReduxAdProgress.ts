import type { ExperimentDescriptor } from './types';

export default {
  name: 'webott_player_major_platforms_no_redux_ad_progress_v2',
  defaultParams: {
    use_redux_state: true,
  },
  inYoubora: true,
} as ExperimentDescriptor<{ use_redux_state: boolean }>;

