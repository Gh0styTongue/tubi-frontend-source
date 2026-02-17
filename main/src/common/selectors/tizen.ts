import { createSelector } from 'reselect';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { CW_CONSENT_KEY } from 'common/features/gdpr/constants';
import type { StoreState } from 'common/types/storeState';

import { isUsCountrySelector } from './ui';

export const hlsNotEnabledVersions = [
  '2.3', // 2015 avplay
  '2.4', // 2016 avplay
];

export const shouldUpdatePreviewSelector = createSelector(
  (state: StoreState) => state.pmr.loaded,
  isLoggedInSelector,
  (state: StoreState) => state.history.loaded,
  (pmrLoaded, isLoggedIn, historyLoaded) => {
    if (isLoggedIn) {
      return pmrLoaded && historyLoaded;
    }
    return pmrLoaded;
  },
);

export const shouldReportContinueWatchingSelector = createSelector(
  isUsCountrySelector,
  isLoggedInSelector,
  (state: StoreState) => state.consent.consents.some(({ key, value }) => key === CW_CONSENT_KEY && value === 'opted_in'),
  (state: StoreState) => state.history.loaded,
  (isUsCountry, isLoggedIn, hasConsent, historyLoaded) => {
    const needConsent = isUsCountry && !hasConsent;
    return !needConsent && isLoggedIn && historyLoaded;
  },
);

export const useHlsSelector = createSelector(
  (state: StoreState) => {
    if (__OTTPLATFORM__ !== 'TIZEN') {
      return false;
    }

    try {
      const userAgent = state.ui.userAgent.ua;
      for (const notEnabledVersion of hlsNotEnabledVersions) {
        if (userAgent.indexOf(`Tizen ${notEnabledVersion}`) !== -1) {
          return false;
        }
      }
    } catch {
      // state userAgent isn't always set and the type
      // at compile time assumes it exists. This catch
      // is being used to avoid multiple optional
      // chaining.
      return false;
    }
    return true;
  },
  (tizenUseHls) => tizenUseHls,
);
