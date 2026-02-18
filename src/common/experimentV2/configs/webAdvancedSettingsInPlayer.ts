import type { ExperimentDescriptor } from './types';

export const webAdvancedSettingsInPlayer: ExperimentDescriptor<{
  advanced_settings_in_player: boolean;
}> = {
  name: 'web_advanced_settings_in_player',
  defaultParams: {
    advanced_settings_in_player: false,
  },
};
