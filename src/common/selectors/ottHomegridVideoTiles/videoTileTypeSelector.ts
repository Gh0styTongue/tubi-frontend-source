import { createSelector } from 'reselect';

import { VIDEO_TILES_VALUE as VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';

import { videoTilesSelector } from './videoTilesSelector';

export const videoTileTypeSelector = createSelector(videoTilesSelector, (videoTilesValue): Exclude<VALUE, typeof VALUE.SWAP_FEATURED_AND_RECOMMENDED> | null => {
  if (videoTilesValue === VALUE.SWAP_FEATURED_AND_RECOMMENDED) {
    return null;
  }
  return videoTilesValue || null;
});
