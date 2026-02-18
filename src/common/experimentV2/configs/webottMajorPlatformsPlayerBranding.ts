import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsPlayerBranding: ExperimentDescriptor<{
  show_logo_in_player: boolean;
}> = {
  name: 'webott_major_platforms_player_branding',
  defaultParams: {
    show_logo_in_player: false,
  },
};
