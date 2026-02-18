import { createSelector } from 'reselect';

import { CREATORS_CONTAINER_ID } from 'common/constants/constants';
import { VIDEO_TILES_VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';
import type { StoreState } from 'common/types/storeState';

import { ottMajorPlatformsCreatorverseSelector } from './experiments/ottMajorPlatformsCreatorverse';
import { videoTilesSelector } from './ottHomegridVideoTiles/videoTilesSelector';
import { containerBrandingMapSelector } from './ui';

export const isContainerBrandingActiveSelector = createSelector(
  (state: StoreState, { pathname }: { pathname: string }) => videoTilesSelector(state, { pathname }),
  ottMajorPlatformsCreatorverseSelector,
  containerBrandingMapSelector,
  (state: StoreState) => state.ottUI?.debouncedGridUI.activeContainerId,
  (videoTilesValue, ottMajorPlatformsCreatorverseEnabled, containerBrandingMap, activeContainerId) => {
    if (!(
      videoTilesValue === VIDEO_TILES_VALUE.VIDEO_TILES_NO_SWAP_NO_DIM_PEEK
      && ottMajorPlatformsCreatorverseEnabled
      && activeContainerId === CREATORS_CONTAINER_ID // hard code the container id here for now, will be updated to use backend logic later
    )) return false;
    return containerBrandingMap[activeContainerId] ?? true; // true by default, because the branding is before all the tiles and should be active by default
  }
);
