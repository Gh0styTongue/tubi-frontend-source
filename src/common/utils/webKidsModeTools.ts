import { days, secs } from '@adrise/utils/lib/time';

import { setCookie } from 'client/utils/localDataStorage';
import { COOKIE_IS_KIDS_MODE_ENABLED } from 'common/constants/cookies';
import { WEB_ROUTES } from 'common/constants/routes';
import type { LocaleOptionType } from 'i18n/constants';
import { LOCALE_URL_PREFIXES } from 'i18n/constants';

// set kids mode status in cookie for web
export const setKidsModeStatusInCookie = (isKidsModeEnabled: boolean) => {
  setCookie(COOKIE_IS_KIDS_MODE_ENABLED,
    isKidsModeEnabled ? 'true' : '', // cookie content
    // set a session cookie, otherwise remove the cookie with an expired date
    isKidsModeEnabled ? 0 : -1 * days(365) / secs(1), // age needs to be in seconds
  );
};

// hard redirect to home page when entering/exiting kids mode
export const kidsModeToggleRedirect = (preferredLocale?: LocaleOptionType) => {
  let target: string = WEB_ROUTES.home;

  if (preferredLocale && LOCALE_URL_PREFIXES.includes(preferredLocale)) {
    target = `/${preferredLocale}${target}`;
  }

  if (window) {
    location.href = target;
  }
};

export const espanolModeToggleRedirect = kidsModeToggleRedirect;
