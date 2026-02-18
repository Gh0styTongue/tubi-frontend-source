import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, FREEZED_EMPTY_ARRAY, HISTORY_CONTAINER_ID, PIVOTS_CONTAINER_ID, RECOMMENDED_CONTAINER_ID } from 'common/constants/constants';
import type { VIDEO_TILES_VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';
import { VIDEO_TILES_VALUE as VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { HDC_CONTAINER_PREFIX } from 'common/features/hdcAd/constants';
import { WRAPPER_CONTAINER_ID } from 'common/features/wrapper/constants';
import { containerChildrenIdMapSelector } from 'common/selectors/container';
import { isMyStuffPageActiveSelector } from 'common/selectors/contentMode';
import type { StoreState } from 'common/types/storeState';
import { homeActiveContainerIdSelector } from 'ott/containers/Home/selectors';
import { isLiveEventOrBannerContainerSelector } from 'ott/features/liveEvent/selectors';

import { videoTileTypeSelector } from './videoTileTypeSelector';

/** returns the container ID passed as props to the selector */
const containerIdPropSelector = (_state: StoreState, props: { containerId?: string | undefined }) => props.containerId;

/** returns the container ID. If passed as a selector prop, uses that. Otherwise, uses the active container ID from the home screen. */
const containerIdSelector = createSelector(
  containerIdPropSelector,
  homeActiveContainerIdSelector,
  (containerIdProp, activeContainerId) => containerIdProp ?? activeContainerId,
);

/** returns the children of the container (based on either props.containerId or the active container ID from the home screen) */
const containerChildrenSelector = createSelector(
  containerChildrenIdMapSelector,
  containerIdSelector,
  (containerChildrenIdMap, containerId) => containerChildrenIdMap[containerId] || FREEZED_EMPTY_ARRAY
);

/** returns true if the container is a tile row (any row that renders tiles) */
export const isTileRow = (isMyStuffPageActive: boolean, isLoggedIn: boolean, containerId: string, isEmpty: boolean, isLiveEventOrBannerRow: boolean) => {
  if (containerId === WRAPPER_CONTAINER_ID) {
    // wrapper row
    return false;
  }

  if (isLiveEventOrBannerRow) {
    return false;
  }

  if (containerId === PIVOTS_CONTAINER_ID) {
    return false;
  }

  if (containerId.startsWith(HDC_CONTAINER_PREFIX)) {
    return false;
  }
  if (containerId === HISTORY_CONTAINER_ID) {
    if (isMyStuffPageActive) {
      if (isEmpty) {
        // prompt to indicate that the user has no stuff
        return false;
      }
    } else if (!isLoggedIn) {
      // login prompt
      return false;
    }
  }

  return true;
};

/** selector that returns true if the container is a tile row (any row that renders tiles) */
const isTileRowSelector = createSelector(
  isMyStuffPageActiveSelector,
  isLoggedInSelector,
  containerIdSelector,
  (state: StoreState, props: { pathname: string; containerId?: string }) => containerChildrenSelector(state, props).length === 0,
  isLiveEventOrBannerContainerSelector,
  isTileRow
);

/** returns true if the row is a video tile row */
export const isVideoTileRow = (
  isTileRow: boolean,
  videoTileType: VIDEO_TILES_VALUE | null,
  containerId: string
) => {
  if (!isTileRow) {
    return false;
  }

  // For variants C, D, E: rows 1-2 (Featured and Recommended) are NOT video tile rows
  const isRow1or2 = containerId === FEATURED_CONTAINER_ID || containerId === RECOMMENDED_CONTAINER_ID;
  const shouldStartFromRow3 =
    videoTileType === VALUE.REFINED_CONTROL ||
    videoTileType === VALUE.CINEMATIC ||
    videoTileType === VALUE.TRUE_CONTROL;

  if (shouldStartFromRow3 && isRow1or2) {
    return false;
  }

  // All 1.7 variants are video tile rows (with conditional logic for C, D, E above)
  return (
    videoTileType === VALUE.FULL_VIDEO_WITH_COUNTDOWN ||
    videoTileType === VALUE.REFINED_CONTROL ||
    videoTileType === VALUE.CINEMATIC ||
    videoTileType === VALUE.TRUE_CONTROL
  );
};

/** selector that returns true if the container is a video tile row */
export const isVideoTileRowSelector = createSelector(
  isTileRowSelector,
  videoTileTypeSelector,
  containerIdSelector,
  isVideoTileRow,
);
