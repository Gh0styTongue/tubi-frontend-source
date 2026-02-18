import type { ExperimentDescriptor } from './types';

export const webottWebPlayerInAppPip: ExperimentDescriptor<{
  in_app_pip_enabled: boolean;
}> = {
  name: 'webott_web_player_in_app_pip_v3',
  defaultParams: {
    in_app_pip_enabled: false,
  },
};
