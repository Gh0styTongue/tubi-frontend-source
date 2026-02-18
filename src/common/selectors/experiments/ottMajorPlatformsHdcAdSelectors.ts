import { createSelector } from 'reselect';

import { OTT_ROUTES } from 'common/constants/routes';
import { getHdcAdExperimentState } from 'common/features/hdcAd/experimentState';
import { shouldShowWrapperSelector } from 'common/features/wrapper/selector';
import type { StoreState } from 'common/types/storeState';

import { isAdultsModeSelector, isUsCountrySelector } from '../ui';

// Re-export for backwards compatibility
export { getHdcAdExperimentState } from 'common/features/hdcAd/experimentState';
export type { HdcAdExperimentState } from 'common/features/hdcAd/experimentState';

export const ottHdcAdSelector = (_state: StoreState): boolean => {
  if (__IS_MAJOR_PLATFORM__) {
    const hdcAdExperimentState = getHdcAdExperimentState();
    return hdcAdExperimentState.getHdcEnabled();
  }
  return false;
};

export const isHdcAdEnabledForAdultsAndHomepageSelector = createSelector(
  isAdultsModeSelector,
  (_: StoreState, pathname: string) => pathname === OTT_ROUTES.home,
  (isAdultsMode, isHome) => {
    return isAdultsMode && isHome && __ISOTT__;
  }
);

export const isHdcAdEnabledSelector = createSelector(
  ottHdcAdSelector,
  isUsCountrySelector,
  isHdcAdEnabledForAdultsAndHomepageSelector,
  shouldShowWrapperSelector,
  (experimentValue, isUsCountry, idHdcAdEnabled, shouldShowWrapper) => {
    return (experimentValue || shouldShowWrapper) && isUsCountry && idHdcAdEnabled;
  }
);
