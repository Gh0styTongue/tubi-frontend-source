import { createSelector } from 'reselect';

import { ParentalRating } from 'common/constants/ratings';
import {
  isAgeGateRequiredSelector,
  isCoppaEnabledSelector,
  isUserCoppaCompliantSelector,
} from 'common/features/coppa/selectors/coppa';
import { isWebEpgEnabledSelector } from 'common/selectors/epg';
import { isMobileWebAndroidPlaybackEnabledSelector } from 'common/selectors/experiments/webAndroidPlaybackSelector';
import type { StoreState } from 'common/types/storeState';

export const isAndroidMobileWebSelector = createSelector(
  ({ ui: { isMobile } }: StoreState) => isMobile,
  ({ ui: { userAgent: { os } } }: StoreState) => os?.name === 'Android',
  (isMobile, isAndroid) => isMobile && isAndroid,
);

export const isAndroidMobileWebLinearPlaybackEnabledSelector = createSelector(
  isAndroidMobileWebSelector,
  // Copy from 'common/utils/capabilityDetection' to avoid circular dependency
  ({ ui: { userAgent: { os, browser } } }: StoreState) => browser?.name === 'Chrome' && parseInt(os?.version ?? '0', 10) >= 5,
  isMobileWebAndroidPlaybackEnabledSelector,
  (isAndroidMobile, isChromeMobile, isMobileWebAndroidPlaybackEnabled) => isAndroidMobile && isChromeMobile && isMobileWebAndroidPlaybackEnabled,
);

export const isIOSMobileSelector = createSelector(
  ({ ui: { isMobile } }: StoreState) => isMobile,
  ({ ui: { userAgent: { os } } }: StoreState) => os?.name === 'iOS',
  (isMobile, isIOS) => isMobile && isIOS
);

export const isWebLiveNewsEnableSelector = createSelector(
  isCoppaEnabledSelector,
  isUserCoppaCompliantSelector,
  isAgeGateRequiredSelector,
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  ({ remoteConfig: { isLiveAvailableInCountry } }: StoreState) => isLiveAvailableInCountry,
  ({ userSettings: { parentalRating } }: StoreState) => parentalRating > ParentalRating.TEENS,
  (
    isCoppaEnabled,
    isUserCoppaCompliant,
    isAgeGateRequired,
    isKidsModeEnabled,
    isLiveAvailableInCountry,
    isParentalRatingHigherThanTeens,
  ) => {
    if (
      isKidsModeEnabled
      || !isLiveAvailableInCountry
      || !isParentalRatingHigherThanTeens
    ) {
      return false;
    }
    if (isCoppaEnabled) {
      if (isAgeGateRequired) {
        return true;
      }
      return isUserCoppaCompliant;
    }
    return true;
  }
);

// iOS and some Android devices(non-chrome or os < 5.0) could display the linear channels but don't support playback.
export const isWebLinearPlaybackSupportedSelector = createSelector(
  isWebLiveNewsEnableSelector,
  isIOSMobileSelector,
  isAndroidMobileWebLinearPlaybackEnabledSelector,
  ({ ui: { isMobile } }: StoreState) => isMobile,
  (isWebLiveNewsEnabled, isIOSMobile, isAndroidLinearPlaybackSupported, isMobile) => {
    return isMobile && (!isAndroidLinearPlaybackSupported || isIOSMobile) ? false : isWebLiveNewsEnabled;
  }
);

// With loadVideo we can get live video from video state. With loadEPGInfoByContentIds, we can get it from epg state.
// The data format is almost the same except there are programs in epg.
export const liveVideoSelector = createSelector(
  isWebEpgEnabledSelector,
  ({ video: { byId } }: StoreState) => byId,
  ({ epg: { byId } } : StoreState) => byId,
  (state: StoreState, contentId: string) => contentId,
  (isWebEpgEnabled, videoById, epgById, contentId) => {
    if (isWebEpgEnabled) {
      return epgById[contentId] || videoById[contentId];
    }
    return videoById[contentId];
  }
);
