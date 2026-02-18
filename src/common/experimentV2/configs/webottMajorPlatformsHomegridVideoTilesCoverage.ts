import type { ExperimentDescriptor } from './types';

export const enum VIDEO_TILES_COVERAGE_VALUE {
  // experiment 1.9 values:
  CONTROL = '',
  FULL_VIDEO_TILE_COVERAGE = 'full_video_tile_coverage',
}

/**
 * Builds on `webott_major_platforms_homegrid_video_tiles_1_8`.
 * This experiment should only be evaluated (and therefore log exposure) when the
 * user is already in the 1.8 `full_video_with_countdown` treatment.
 */
export const webottMajorPlatformsHomegridVideoTilesCoverage: ExperimentDescriptor<{
  type: VIDEO_TILES_COVERAGE_VALUE;
}> = {
  name: 'webott_major_platforms_homegrid_video_tiles_1_9',
  defaultParams: {
    type: VIDEO_TILES_COVERAGE_VALUE.CONTROL,
  },
};
