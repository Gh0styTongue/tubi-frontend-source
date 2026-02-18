import { createSelector } from 'reselect';

import { ottFireTVWrapperSelector } from 'common/selectors/experiments/ottFireTVWrapperSelectors';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { isHomeUrl } from 'common/utils/urlPredicates';

import { WRAPPER_CONTAINER_ID } from './constants';
import { HDC_WRAPPER_VIDEO } from '../hdcAd/constants';

export const isWrapperExperimentEnabledSelector = createSelector(
  isKidsModeEnabledSelector,
  (_: StoreState, pathname?: string) => isHomeUrl(pathname || ''),
  (isKidsModeEnabled, isHome) => {
    return __IS_MAJOR_PLATFORM__ && !isKidsModeEnabled && isHome;
  }
);

export const shouldShowWrapperSelector = createSelector(
  isWrapperExperimentEnabledSelector,
  ottFireTVWrapperSelector,
  (isWrapperExperimentEnabled, ottFireTVWrapperExperimentValue) => {
    return isWrapperExperimentEnabled && ottFireTVWrapperExperimentValue;
  }
);

export const isWrapperRowActiveSelector = createSelector(
  shouldShowWrapperSelector,
  (state: StoreState) => state.fire.containerUI.containerId,
  (shouldShowWrapper, activeContainerId) => {
    return shouldShowWrapper && activeContainerId === WRAPPER_CONTAINER_ID;
  }
);

const hdcAdSelector = (state: StoreState) => state.hdcAd;

export const wrapperNativeSelector = createSelector(
  hdcAdSelector,
  (_: StoreState, containerId?: string) => containerId,
  (hdcAd, containerId) => hdcAd.nativeCreativeMap?.[containerId || WRAPPER_CONTAINER_ID]
);

export const wrapperVideoSelector = createSelector(
  hdcAdSelector,
  (_: StoreState, containerId?: string) => containerId,
  (hdcAd, containerId) => hdcAd.videoCreativeMap?.[containerId || HDC_WRAPPER_VIDEO]
);

export const hasWrapperVideoPlayedSelector = createSelector(
  hdcAdSelector,
  (hdcAd) => hdcAd.hasWrapperVideoPlayed
);
