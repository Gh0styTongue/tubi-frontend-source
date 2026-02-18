/**
 * URL utilities for authentication flows.
 * Helpers for detecting activation flow context.
 */
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';

/** Routes that are part of the device activation flow */
const ACTIVATION_ROUTES = [WEB_ROUTES.activate, WEB_ROUTES.addKids] as string[];

/**
 * Determines if user is currently in the device activation flow.
 * Used to show different UI layouts for activation vs normal auth.
 */
export const isInActivationFlow = () => {
  const location = tubiHistory.getCurrentLocation();
  // if user visits activation page, we'll show a different layout of GuestActions
  const isActivationPage = ACTIVATION_ROUTES.includes(location.pathname);
  // if user visits sign up page from activation page, we'll show a different compact sign up form
  const redirect = location.query.redirect;
  const redirectPath = ((Array.isArray(redirect) ? redirect[0] : redirect) || '').split('?')[0];
  const isSignupPage = location.pathname === WEB_ROUTES.register &&
    ACTIVATION_ROUTES.includes(redirectPath);
  return isActivationPage || isSignupPage;
};
