import type { ExperimentDescriptor } from './types';

export const webottWebDesktopMovieRegGating: ExperimentDescriptor<{
  preview_type: 'control' | 'preview_no_banner' | 'preview_with_banner';
}> = {
  name: 'webott_web_desktop_movie_reg_gating_v1',
  defaultParams: {
    preview_type: 'control',
  },
};

