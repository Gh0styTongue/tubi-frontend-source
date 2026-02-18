import { Manipulation } from '@tubitv/analytics/lib/authEvent';
import type { ActionStatus, Messages } from '@tubitv/analytics/lib/authEvent';
import type { AuthType } from '@tubitv/analytics/lib/baseTypes';
import type { LocationDescriptor, LocationState } from 'history';

import { OTT_ROUTES } from 'common/constants/routes';
import { REGEX_NAME_INVALID_CHARS_GLOBAL } from 'common/constants/validate-rules';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
import { trackAccountEvent } from 'common/utils/analytics';
import { isNameInvalid } from 'common/utils/form';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getUrlParam } from 'common/utils/urlManipulation';
import { isLoginWithAmazonAvailableSelector } from 'ott/features/authentication/selectors/amazon';
import { isComcastEmailPrefillEnabledSelector } from 'ott/features/authentication/selectors/emailPrefill';
import { isLoginWithGoogleOneTapAvailableSelector } from 'ott/features/authentication/selectors/googleOneTap';
import { isOTTMagicLinkEnabledSelector } from 'ott/features/authentication/selectors/magicLink';

export const getReferer = () => {
  let referer = getCurrentPathname();
  if (referer === OTT_ROUTES.universalSignIn) {
    const query = getUrlParam();
    if (query.from) {
      referer = decodeURIComponent(query.from as string);
    }
  }
  return referer;
};

export const getUniversalSignInPage = (state: StoreState, locationState?: LocationState): LocationDescriptor => {
  const signInWithActivateRoute = {
    pathname: OTT_ROUTES.activate,
    query: { from: getReferer() },
    state: locationState,
  };

  const signInWithAmazonRoute = {
    pathname: OTT_ROUTES.signInWithAmazon,
    state: { from: getReferer(), ...locationState },
  };

  const forcedFlowRoute = {
    activate: signInWithActivateRoute,
    amazon: signInWithAmazonRoute,
  }[FeatureSwitchManager.get('ForceLoginWithFlow') as string];

  if (forcedFlowRoute) {
    return forcedFlowRoute;
  }

  if (isComcastEmailPrefillEnabledSelector(state)) {
    return { pathname: OTT_ROUTES.signInWithComcast, state: { from: getReferer(), ...locationState } };
  }

  if (isLoginWithAmazonAvailableSelector(state)) {
    return signInWithAmazonRoute;
  }

  if (isLoginWithGoogleOneTapAvailableSelector(state)) {
    return { pathname: OTT_ROUTES.signInWithGoogleOneTap, state: { from: getReferer(), ...locationState } };
  }

  if (isOTTMagicLinkEnabledSelector(state)) {
    return { pathname: OTT_ROUTES.enterEmailWithEscape, query: { from: getReferer(), ...locationState } };
  }

  return signInWithActivateRoute;
};

export const FALLBACK_NAME = 'Tubi User';

// Remove invalid characters & check remaining length
export const removeInvalidChars = (name: string) => {
  const cleanedName = name.replace(REGEX_NAME_INVALID_CHARS_GLOBAL, '');
  return cleanedName.length > 0 ? cleanedName : FALLBACK_NAME;
};

export const parseNameFromEmail = (email: string) => {
  const name = email.substring(0, email.indexOf('@'));
  if (isNameInvalid(name)) {
    return removeInvalidChars(name);
  }
  return name;
};

interface TrackRegisterEventParams {
  message: Messages;
  status: ActionStatus;
}

export type TrackRegisterEventGenerator = (
  current: AuthType
) => ({ message, status }: TrackRegisterEventParams) => void;

export const trackRegisterEventGenerator: TrackRegisterEventGenerator = (current) => {
  return ({ message, status }) => {
    trackAccountEvent({
      manip: Manipulation.SIGNUP,
      current,
      message,
      status,
    });
  };
};
