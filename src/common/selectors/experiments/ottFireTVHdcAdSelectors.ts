import { createSelector } from 'reselect';

import { OTT_ROUTES } from 'common/constants/routes';
import { getConfig, FIRETV_HDC_AD, FIRETV_HDC_AD_VARIANT } from 'common/experiments/config/ottFireTVHdcAd';
import { shouldShowWrapperSelector } from 'common/features/wrapper/selector';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

import { isAdultsModeSelector, isUsCountrySelector } from '../ui';

export const ottFireTVHdcAdSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...FIRETV_HDC_AD,
    config: getConfig(),
  });

export const isHdcAdEnabledForAdultsAndHomepageSelector = createSelector(
  isAdultsModeSelector,
  (_: StoreState, pathname: string) => pathname === OTT_ROUTES.home,
  (isAdultsMode, isHome) => {
    return isAdultsMode && isHome && __ISOTT__;
  }
);

export const isHdcAdEnabledSelector = createSelector(
  ottFireTVHdcAdSelector,
  isUsCountrySelector,
  isHdcAdEnabledForAdultsAndHomepageSelector,
  shouldShowWrapperSelector,
  (experimentValue, isUsCountry, idHdcAdEnabled, shouldShowWrapper) => {
    return (experimentValue !== FIRETV_HDC_AD_VARIANT.control || shouldShowWrapper) && isUsCountry && idHdcAdEnabled;
  }
);
