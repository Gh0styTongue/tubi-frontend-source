import { createSelector } from 'reselect';

import { WEB_ROUTES } from 'common/constants/routes';
import { PurpleCarpetStatus } from 'common/features/purpleCarpet/type';
import type StoreState from 'common/types/storeState';
import { LOCALE_URL_PREFIXES } from 'i18n/constants';

// copied from src/common/features/purpleCarpet/selector.ts
// to solve to cycle deps issue
export const shouldShowPurpleCarpetSelector = (state: StoreState) => state.purpleCarpet.status !== PurpleCarpetStatus.NotAvailable;

// match home page with locale prefix
const REG_LOCALE_HOME_URL_PREFIX = new RegExp(`^/(?:${LOCALE_URL_PREFIXES.join('|')})?(?:${WEB_ROUTES.home}?)$`);
// copied from src/common/features/purpleCarpet/selector.ts
// to solve to cycle deps issue
export const shouldShowPurpleCarpetOnHomeScreenSelector = createSelector(
  shouldShowPurpleCarpetSelector,
  (state: StoreState) => state.purpleCarpet.status,
  (_state: StoreState, { pathname }: { pathname: string }) => pathname,
  (isPurpleCarpetEnabled, purpleCarpetStatus, pathname) => {
    if (!REG_LOCALE_HOME_URL_PREFIX.test(pathname)) {
      return false;
    }
    return isPurpleCarpetEnabled && [PurpleCarpetStatus.DuringGame, PurpleCarpetStatus.BeforeGame].includes(purpleCarpetStatus);
  }
);
