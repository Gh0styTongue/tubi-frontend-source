import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, RECOMMENDED_CONTAINER_ID } from 'common/constants/constants';
import { VIDEO_TILES_VALUE } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';
import { isWrapperRowActiveSelector } from 'common/features/wrapper/selector';
import type { StoreState } from 'common/types/storeState';

import { videoTileTypeSelector } from './videoTileTypeSelector';

/**
 * Returns true if this is row 1 or 2 (Featured or Recommended) in REFINED_CONTROL variant
 * These rows use smaller tiles (360x202) instead of the default size
 */
const containerIdPropSelector = (_state: StoreState, props: { containerId: string }) => props.containerId;

export const isSmallTileRow1or2 = (videoTileType: VIDEO_TILES_VALUE | null, containerId: string) => {
  return (
    videoTileType === VIDEO_TILES_VALUE.REFINED_CONTROL ||
    videoTileType === VIDEO_TILES_VALUE.CINEMATIC
  ) &&
  (containerId === FEATURED_CONTAINER_ID || (videoTileType === VIDEO_TILES_VALUE.CINEMATIC && containerId === RECOMMENDED_CONTAINER_ID));
};

export const isSmallTileRow1or2Selector = createSelector(
  videoTileTypeSelector,
  containerIdPropSelector,
  isSmallTileRow1or2,
);

export const isRefinedControlRow1or2Selector = createSelector(
  videoTileTypeSelector,
  containerIdPropSelector,
  (videoTileType, containerId) => {
    return videoTileType === VIDEO_TILES_VALUE.REFINED_CONTROL && (containerId === FEATURED_CONTAINER_ID || containerId === RECOMMENDED_CONTAINER_ID);
  }
);

export const isRefinedControlRow2Selector = createSelector(
  videoTileTypeSelector,
  containerIdPropSelector,
  (videoTileType, containerId) => {
    return videoTileType === VIDEO_TILES_VALUE.REFINED_CONTROL && containerId === RECOMMENDED_CONTAINER_ID;
  }
);

export const isCinematicRow1or2Selector = createSelector(
  videoTileTypeSelector,
  containerIdPropSelector,
  (videoTileType, containerId) => {
    return videoTileType === VIDEO_TILES_VALUE.CINEMATIC && (containerId === FEATURED_CONTAINER_ID || containerId === RECOMMENDED_CONTAINER_ID);
  }
);

export const shouldShowDimPeekForWrapperSelector = (state: StoreState, props: { pathname: string }) => {
  const videoTileType = videoTileTypeSelector(state, props);
  const isWrapperRowActive = isWrapperRowActiveSelector(state, props.pathname);
  return (videoTileType === VIDEO_TILES_VALUE.FULL_VIDEO_WITH_COUNTDOWN || videoTileType === VIDEO_TILES_VALUE.CINEMATIC || videoTileType === VIDEO_TILES_VALUE.REFINED_CONTROL) && isWrapperRowActive;
};
