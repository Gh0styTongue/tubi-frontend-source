import type { ExperimentDescriptor } from './types';

export const webottWebPlayerRegister: ExperimentDescriptor<{
  cta_text: 'default' | 'register_text' | 'signup_text';
}> = {
  name: 'webott_web_player_register_v1',
  defaultParams: {
    cta_text: 'default',
  },
};
