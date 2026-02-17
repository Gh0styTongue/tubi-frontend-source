import systemApi from 'client/systemApi';
import { getCookie, setCookie } from 'client/utils/localDataStorage';
import { ADVERTISER_ID_CLIENT_HEADER_NAME } from 'common/constants/constants';
import { COOKIE_LOGIN_INVOKED } from 'common/constants/cookies';
import {
  STATUS_REQUEST_INTERVAL_IN_MS,
} from 'common/features/authentication/constants/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { ApiClientMethodOptions } from 'common/helpers/ApiClient';
import type { StoreState } from 'common/types/storeState';
import { getStatusPollingIntervalFromConfig } from 'common/utils/remoteConfig';
import { getAnonymousTokenRequestOptions } from 'common/utils/token';

export const setLoginInvokedTimestamp = () => {
  setCookie(COOKIE_LOGIN_INVOKED, Date.now().toString(), 10);
};

export const getLoginInvokedTimestamp = () => {
  return parseInt(getCookie(COOKIE_LOGIN_INVOKED), 10);
};

export const getAuthRequestOptions = ({
  state,
  options,
  useAnonymousToken,
}: {
  state: StoreState;
  options: ApiClientMethodOptions;
  useAnonymousToken?: boolean; // login and signup endpoints must use anonymous tokens
}) => {
  const shouldUseAnonymousToken = useAnonymousToken || !isLoggedInSelector(state);
  return {
    ...options,
    data: {
      ...options.data,
      useAnonymousToken: shouldUseAnonymousToken,
    },
    ...getAdvertiserIdClientHeadersOptions(options.headers),
    ...getAnonymousTokenRequestOptions(shouldUseAnonymousToken),
  };
};

export const getAdvertiserIdClientHeadersOptions = (headers?: Record<string, unknown>) => {
  if (systemApi.getAdvertiserId()) {
    return {
      headers: {
        ...headers,
        [ADVERTISER_ID_CLIENT_HEADER_NAME]: systemApi.getAdvertiserId(),
      },
    };
  }

  return {};
};

export const getStatusRequestInterval = (isMajorEventActive: boolean) => {
  return isMajorEventActive ? getStatusPollingIntervalFromConfig() : STATUS_REQUEST_INTERVAL_IN_MS;
};
