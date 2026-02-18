import { createSelector } from 'reselect';

import { OTT_ROUTES } from 'common/constants/routes';
import { getExperiment } from 'common/experimentV2';
import { webottMajorPlatformsPivots } from 'common/experimentV2/configs/webottMajorPlatformsPivots';
import type { StoreState } from 'common/types/storeState';

export type PivotsVariant = 'default' | 'row0_pill' | 'row3_pill' | 'row0_sticky';

/**
 * Returns the current pivots experiment variant.
 * Returns 'default' if not on home page or is in kids mode.
 */
export const pivotsVariantSelector = createSelector(
  (state: StoreState) => state.ui.isKidsModeEnabled,
  (_state: StoreState, { pathname }: { pathname: string }) => pathname,
  (isKidsModeEnabled, pathname): PivotsVariant => {
    if (!__IS_MAJOR_PLATFORM__) return 'default';

    // Only show pivots on home page in non-kids mode
    if (isKidsModeEnabled || pathname !== OTT_ROUTES.home) {
      return 'default';
    }

    return getExperiment(webottMajorPlatformsPivots).get('pivots_variant');
  }
);

// TODO: Below selectors might be redundant and can be removed in the future
// Keeping them for now to avoid breaking changes from components that still use them
/**
 * Returns true if any pivot variant is enabled (not 'default')
 */
export const isPivotsEnabledSelector = (state: StoreState, { pathname }: { pathname: string }) => {
  const variant = pivotsVariantSelector(state, { pathname });
  return variant !== 'default';
};

export const isEventDetailsHackEnabledSelector = (_state: StoreState) => false;

export const IS_CONTAINER_HOISTING_ENABLED = false;

export const shouldShowPivotsSelector = createSelector(
  isPivotsEnabledSelector,
  (_: StoreState, { pathname }: { pathname: string }) => pathname,
  (isEnabled, pathname) => isEnabled && pathname === OTT_ROUTES.home,
);
