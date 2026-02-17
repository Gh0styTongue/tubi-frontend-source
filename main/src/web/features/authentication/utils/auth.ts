import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import type { IntlShape } from 'react-intl';

import { STUBIOS_HOSTNAMES } from 'common/constants/constants';
import type { AuthError } from 'common/features/authentication/types/auth';
import authMessages from 'web/features/authentication/constants/auth-message';

interface LinkParams {
  pathname?: string;
  queryParams?: Record<string, string>;
}

const CODE_MESSAGE_MAP = {
  EMAIL_USER_EXISTS: authMessages.emailUserAlreadyExists,
  INVALID_EMAIL_DOMAIN: authMessages.signupEmailInvalid,
  BELOW_MIN_AGE: authMessages.errorDuringRegistration,
};

export const getRegisterErrorMessage = (intl: IntlShape) => {
  const { formatMessage } = intl;
  const defaultMessage = authMessages.errorDuringRegistration;
  return (error: AuthError) => formatMessage(CODE_MESSAGE_MAP[error?.routeCode ?? ''] || defaultMessage);
};

export const getStubiosHostname = () => {
  return __PRODUCTION__ ? STUBIOS_HOSTNAMES.PROD : STUBIOS_HOSTNAMES.STAGING;
};

export const getStubiosLink = (linkParams?: LinkParams) => {
  const { pathname = '', queryParams = {} } = linkParams ?? {};
  const hostname = getStubiosHostname();
  return addQueryStringToUrl(`https://${hostname}${pathname}`, {
    ...queryParams,
    utm_source: 'tubi',
  });
};
