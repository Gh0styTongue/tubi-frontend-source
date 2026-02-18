import { createSelector } from 'reselect';

import { VIDEO_TILES_VALUE as VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';

import { hasRowsToSwapSelector } from './hasRowsToSwapSelector';
import { videoTilesSelector } from './videoTilesSelector';

export const shouldSwapFeaturedAndRecommendedSelector = createSelector(
  videoTilesSelector,
  hasRowsToSwapSelector,
  (videoTilesValue, hasBothRows) =>
    [
      // legacy values:
      VALUE.SWAP_FEATURED_AND_RECOMMENDED,
    ].includes(videoTilesValue)
    && hasBothRows
);
