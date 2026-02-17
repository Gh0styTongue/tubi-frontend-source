import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import type { AuthError, AuthErrorLocationState } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';

// Return true if Account APIs are unavailable:
// no status code means that the error is unexpected and not handled by the app (e.g. request timeout)
// status >= 500 OR status is 429 during a major event
export const isAuthServerError = (error: AuthError, isMajorEventActive: boolean): boolean => {
  return !error.status ||
    error.status >= 500 ||
    (error.status === 429 && isMajorEventActive);
};

interface RedirectOptions {
  redirectWithPush?: boolean; // redirect using the push method for auth errors that occur in modals (e.g. SignInWithVizioPrompt) - this will allow the "Continue as Guest" action on the AuthError page to navigate back to the correct location
  type: AuthErrorLocationState['type'];
}

export const redirectToAuthErrorPage = (error: AuthError | null, options: RedirectOptions) => {
  const { status, code } = error || {};
  const { redirectWithPush, type } = options;
  const query = {
    isDelayedRegistration: status === 503 && code === 'ACCOUNT_PENDING_PROCESSING',
    type,
  };
  const redirectFn = redirectWithPush ? tubiHistory.push : tubiHistory.replace;
  redirectFn({
    pathname: __ISOTT__ ? OTT_ROUTES.authError : WEB_ROUTES.authError,
    query,
  });
};
