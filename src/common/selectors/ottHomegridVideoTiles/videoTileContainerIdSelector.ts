import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, RECOMMENDED_CONTAINER_ID } from 'common/constants/constants';
import { VIDEO_TILES_VALUE as VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';

import { videoTilesSelector } from './videoTilesSelector';

export const videoTileContainerIdSelector = createSelector(videoTilesSelector, (videoTilesValue) => {
  if (videoTilesValue === VALUE.RECOMMENDED_STAGING_PORTRAIT) {
    return RECOMMENDED_CONTAINER_ID;
  }
  return FEATURED_CONTAINER_ID;
});
