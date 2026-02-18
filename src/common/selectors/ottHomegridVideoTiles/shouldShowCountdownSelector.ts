import { createSelector } from 'reselect';

import { VIDEO_TILES_VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';

import { videoTileTypeSelector } from './videoTileTypeSelector';

/**
 * Returns true if countdown should be shown before autoplay
 * Applies to variants B (FULL_VIDEO_WITH_COUNTDOWN), C (REFINED_CONTROL), and D (CINEMATIC)
 */
export const shouldShowCountdownSelector = createSelector(
  videoTileTypeSelector,
  (videoTileType) => {
    return (
      videoTileType === VIDEO_TILES_VALUE.FULL_VIDEO_WITH_COUNTDOWN ||
      videoTileType === VIDEO_TILES_VALUE.REFINED_CONTROL ||
      videoTileType === VIDEO_TILES_VALUE.CINEMATIC
    );
  }
);
