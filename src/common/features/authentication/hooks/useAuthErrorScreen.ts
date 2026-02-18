import type { Location } from 'history';
import { useEffect, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { saveAuthErrorTimestamp } from 'client/utils/auth';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import type { AuthErrorLocationState } from 'common/features/authentication/types/auth';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventActiveSelector, majorEventNameSelector } from 'common/selectors/remoteConfig';

export const messages = defineMessages({
  signInHeader: {
    description: 'The header of the auth sign in error page',
    defaultMessage: 'We can\'t sign you in right now',
  },
  signUpHeader: {
    description: 'The header of the auth sign up error page',
    defaultMessage: 'We can\'t create an account for you right now',
  },
  genericHeader: {
    description: 'The generic header of the auth error page',
    defaultMessage: 'Something went wrong',
  },
  description: {
    description: 'The description of the auth error page',
    defaultMessage: 'You can still watch your favorite movies and TV shows as a guest.',
  },
  descriptionDuringMajorEvent: {
    description: 'The description of the auth error page',
    defaultMessage: 'You can still watch your favorite movies and TV shows as a guest, including {majorEventName}!',
  },
  fallbackEventName: {
    description: 'The fallback for major event name',
    defaultMessage: 'the game',
  },
});

interface AuthErrorProps {
  location: Location;
}

const DEFAULT_LOCATION_STATE: AuthErrorLocationState = {
  isDelayedRegistration: 'false',
  type: 'activate',
};

/** This hook contains shared logic for the Web and OTT AuthError containers:
 * src/web/features/authentication/containers/AuthError/AuthError.tsx
 * src/ott/features/authentication/containers/AuthError/AuthError.tsx
 */
export const useAuthErrorScreen = ({ location }: AuthErrorProps) => {
  const { formatMessage } = useIntl();
  const { isDelayedRegistration: isDelayedRegistrationString, type } = {
    ...DEFAULT_LOCATION_STATE,
    ...location.query,
  };
  const isDelayedRegistration = JSON.parse(isDelayedRegistrationString);
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: tubiHistory.getCurrentLocation().search }));

  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  useEffect(() => {
    if (!isGDPREnabled) {
      saveAuthErrorTimestamp();
    }
  }, [isGDPREnabled]);

  const headerMessage = useMemo(() => {
    switch (type) {
      case 'signUp':
        return messages.signUpHeader;
      case 'signIn':
        return messages.signInHeader;
      case 'activate':
      case 'magicLink':
      default:
        return messages.genericHeader;
    }
  }, [type]);

  const isMajorEventActive = useAppSelector(isMajorEventActiveSelector);
  const majorEventName = useAppSelector(majorEventNameSelector) || formatMessage(messages.fallbackEventName);
  const description = isMajorEventActive
    ? formatMessage(messages.descriptionDuringMajorEvent, { majorEventName })
    : formatMessage(messages.description);

  return {
    description,
    isDelayedRegistration,
    header: formatMessage(headerMessage),
    loginRedirect,
  };
};
