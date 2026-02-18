import type { ExperimentDescriptor } from './types';

export const webottWebDesktopTopNav: ExperimentDescriptor<{
  navbar_variant: 'default' | 'topnav_sticky_with_reduced_height';
  top_nav_height: number;
}> = {
  name: 'webott_web_desktop_top_nav',
  defaultParams: {
    navbar_variant: 'default',
    top_nav_height: 96,
  },
};
