import { WEB_ROUTES } from 'common/constants/routes';
import { getConfig, WEB_COMPACT_SIGNUP_FORM } from 'common/experiments/config/webCompactSignupForm';
import tubiHistory from 'common/history';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const isActivationFlowSelector = () => {
  const location = tubiHistory.getCurrentLocation();
  // if user visits activation page, we'll show a different layout of GuestActions
  const isActivationPage = location.pathname === WEB_ROUTES.activate;
  // if user visits sign up page from activation page, we'll show a different compact sign up form
  const isSignupPage =
    location.pathname === WEB_ROUTES.register &&
    location.search.includes(`redirect=${encodeURIComponent(WEB_ROUTES.activate)}`);
  return isActivationPage || isSignupPage;
};

export const isInCompactSignupFormTreatmentSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_COMPACT_SIGNUP_FORM,
    config: getConfig(),
  });

export const isCompactViewSelector = (state: StoreState) => {
  return isInCompactSignupFormTreatmentSelector(state) && isActivationFlowSelector();
};
