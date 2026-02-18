import { createSelector } from 'reselect';

import { FEATURED_CONTAINER_ID, RECOMMENDED_CONTAINER_ID } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import {
  FIRETV_HOMEGRID_VIDEO_TILES,
  FIRETV_HOMEGRID_VIDEO_TILES_VALUE as VALUE,
  getConfig,
} from 'common/experiments/config/ottFireTVHomegridVideoTiles';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import { isKidsModeSelector } from 'common/selectors/ui';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVHomegridVideoTilesSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...FIRETV_HOMEGRID_VIDEO_TILES,
    config: getConfig(),
  });

const videoTilesSelector = createSelector(
  ottFireTVHomegridVideoTilesSelector,
  isKidsModeSelector,
  (_: StoreState, { pathname }: { pathname: string }) => pathname,
  (value, isKidsMode, pathname): VALUE => {
    if (pathname !== OTT_ROUTES.home || isKidsMode) {
      return VALUE.CONTROL;
    }
    return value;
  }
);

export const containerSelector = ({ container }: StoreState) => container;

// GOTCHA: can't use containersListSelector from
// src/common/selectors/container.ts because that would introduce a dependency
// cycle, so we'll just use this simplified one until we graduate. This one will
// only work properly on the home page because we're ignoring the content mode,
// but that's fine because we only run this experiment on the home page.
const containersListSelector = ({ container }: StoreState) =>
  container.containersList;

export const hasRowsToSwapSelector = createSelector(
  containersListSelector,
  (_: StoreState, { containerIds }: { containerIds?: string[] } = {}) => containerIds,
  (containerIdsFromState, containerIdsFromProps) => {
    const containerIds = containerIdsFromProps ?? containerIdsFromState;
    return containerIds.includes(FEATURED_CONTAINER_ID) && containerIds.includes(RECOMMENDED_CONTAINER_ID);
  }
);

export const shouldSwapFeaturedAndRecommendedSelector = createSelector(
  videoTilesSelector,
  hasRowsToSwapSelector,
  (videoTilesValue, hasBothRows) =>
    (
      videoTilesValue === VALUE.RECOMMENDED_STAGING_PORTRAIT
      || videoTilesValue === VALUE.SWAP_FEATURED_AND_RECOMMENDED
    )
    && hasBothRows
);

export const videoTileContainerIdSelector = createSelector(videoTilesSelector, (videoTilesValue) => {
  if (videoTilesValue === VALUE.RECOMMENDED_STAGING_PORTRAIT) {
    return RECOMMENDED_CONTAINER_ID;
  }
  return FEATURED_CONTAINER_ID;
});

export const isVideoTileActiveSelector = createSelector(
  videoTilesSelector,
  videoTileContainerIdSelector,
  (state: StoreState) => state.fire.containerUI.containerId,
  (videoTilesValue, containerId, activeContainerId) =>
    Boolean(videoTilesValue) &&
    videoTilesValue !== VALUE.SWAP_FEATURED_AND_RECOMMENDED &&
    activeContainerId === containerId
);

export const videoTileTypeSelector = createSelector(videoTilesSelector, (videoTilesValue) => {
  if (videoTilesValue === VALUE.SWAP_FEATURED_AND_RECOMMENDED) {
    return null;
  }
  return videoTilesValue || null;
});

export const isVideoTileRowSelector = createSelector(
  videoTileTypeSelector,
  (_: StoreState, { containerId }: { containerId: string | undefined }) => containerId,
  videoTileContainerIdSelector,
  (videoTileType, containerId, videoTileContainerId) =>
    Boolean(videoTileType && containerId === videoTileContainerId)
);

export const isStagingPortrait = (videoTileType: VALUE | null) =>
  videoTileType === VALUE.STAGING_PORTRAIT
  || videoTileType === VALUE.RECOMMENDED_STAGING_PORTRAIT;

export const isCinemascope = (videoTileType: VALUE | null) =>
  videoTileType === VALUE.CINEMASCOPE
  || videoTileType === VALUE.CINEMASCOPE_WITH_DESCRIPTION;

export const isStagingPortraitVideoTileRowSelector = createSelector(
  isVideoTileRowSelector,
  videoTileTypeSelector,
  (isVideoTileRow, videoTileType) =>
    isVideoTileRow && isStagingPortrait(videoTileType)
);

export const isCinemascopeVideoTileRowSelector = createSelector(
  isVideoTileRowSelector,
  videoTileTypeSelector,
  (isVideoTileRow, videoTileType) =>
    isVideoTileRow && isCinemascope(videoTileType)
);
