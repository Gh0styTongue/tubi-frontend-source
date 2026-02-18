import { createSelector } from 'reselect';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { ottFireTVSkinsAdSelector } from 'common/selectors/experiments/ottFireTVSkinsAdSelectors';
import { isKidsModeSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { isHomeUrl } from 'common/utils/urlPredicates';

import { IS_PLATFORM_SUPPORT_SKINS_AD, SKINS_AD_CONTAINER_ID } from './constants';
import { getSkinsAdCreative } from './utils';

export const isSkinsAdExperimentEnabledSelector = createSelector(
  isKidsModeSelector,
  (_: StoreState, { pathname, contentMode }: { pathname?: string, contentMode?: CONTENT_MODE_VALUE }) => isHomeUrl(pathname || '') || contentMode === 'all',
  (isKidsModeEnabled, isHome) => {
    return IS_PLATFORM_SUPPORT_SKINS_AD && !isKidsModeEnabled && isHome;
  }
);

export const shouldShowSkinsAdSelector = createSelector(
  isSkinsAdExperimentEnabledSelector,
  ottFireTVSkinsAdSelector,
  (isSkinsAdExperimentEnabled, ottFireTVSkinsAdExperimentValue) => {
    return isSkinsAdExperimentEnabled && ottFireTVSkinsAdExperimentValue;
  }
);

export const isSkinsAdRowActiveSelector = createSelector(
  shouldShowSkinsAdSelector,
  (state: StoreState) => state.fire.containerUI.containerId,
  (shouldShowSkinsAd, activeContainerId) => {
    return shouldShowSkinsAd && activeContainerId === SKINS_AD_CONTAINER_ID;
  }
);

const skinsAdSelector = (state: StoreState) => state.skinsAd;

export const skinsAdCreativesSelector = createSelector(
  skinsAdSelector,
  (skinsAd) => skinsAd.creatives
);

export const skinsAdCustomSelector = createSelector(
  skinsAdCreativesSelector,
  (creatives) => getSkinsAdCreative(creatives, 'native_custom_video'),
);

export const skinsAdVideoSelector = createSelector(
  skinsAdCreativesSelector,
  (creatives) => getSkinsAdCreative(creatives, 'video'),
);

export const skinsAdStatusSelector = createSelector(
  skinsAdSelector,
  (skinsAd) => skinsAd.status
);
