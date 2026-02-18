import type { Location } from 'history';
import { createSelector } from 'reselect';

import { WEB_ROUTES } from 'common/constants/routes';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type StoreState from 'common/types/storeState';
import { matchesRoute } from 'common/utils/urlPredicates';

// We do not need to show the initial consent modal on some pages where users cannot browse, search, or play content.
const GDPR_CONSENT_ROUTES_WHITELIST = [
  WEB_ROUTES.landing,

  /* auth routes */
  WEB_ROUTES.signIn,
  WEB_ROUTES.logout,
  WEB_ROUTES.activate,
  WEB_ROUTES.register,
  WEB_ROUTES.newPassword,
  WEB_ROUTES.forgotPassword,
  WEB_ROUTES.reset,
  WEB_ROUTES.resetToken,
  WEB_ROUTES.signInWithMagicLink,
  WEB_ROUTES.magicLinkStatus,

  /* static routes */
  WEB_ROUTES.support,
  WEB_ROUTES.supportedBrowsers,
  WEB_ROUTES.devices,
  WEB_ROUTES.terms,
  WEB_ROUTES.termsEmbedded,
  WEB_ROUTES.privacy,
  WEB_ROUTES.privacyEmbedded,
  WEB_ROUTES.yourPrivacyChoices,
  WEB_ROUTES.b2bprivacy,
  WEB_ROUTES.helpCenter,
  WEB_ROUTES.helpCenterArticle,
  WEB_ROUTES.helpCenterSearch,
  WEB_ROUTES.customCaptions,
  WEB_ROUTES.accessibilityHelpCenter,

  WEB_ROUTES.notFound,
];

export const isInitialConsentVisibleSelector = createSelector(
  isGDPREnabledSelector,
  (state: StoreState) => state.consent.consentRequired,
  (_: StoreState, props: { currentLocation: Location }) => props.currentLocation.pathname,
  (isGDPREnabled, consentRequired, pathname) => isGDPREnabled && consentRequired && !GDPR_CONSENT_ROUTES_WHITELIST.some(route => matchesRoute(route, pathname)),
);
