import type { ExperimentDescriptor } from './types';

export enum VIDEO_TILES_VALUE {
  // experiment 1.3 values:
  CONTROL = '',
  VIDEO_TILES_NO_SWAP_NO_DIM_PEEK = 'video_tiles_no_swap_no_dim_peek',

  // legacy values:
  SWAP_FEATURED_AND_RECOMMENDED = 'recommended',
}

export const webottMajorPlatformsHomegridVideoTiles: ExperimentDescriptor<{
  type: VIDEO_TILES_VALUE;
}> = {
  name: 'webott_major_platforms_homegrid_video_tiles_1_4_v2',
  defaultParams: {
    type: VIDEO_TILES_VALUE.CONTROL,
  },
};

