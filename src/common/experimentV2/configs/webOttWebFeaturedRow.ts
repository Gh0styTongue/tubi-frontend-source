import type { ExperimentDescriptor } from './types';

export const webOttWebFeaturedRow: ExperimentDescriptor<{
  featured_tile: 'control' | '1_tile' | '2_tile' | '2_tile_full_button';
}> = {
  name: 'webott_web_featured_row_v1',
  defaultParams: {
    featured_tile: 'control',
  },
};
