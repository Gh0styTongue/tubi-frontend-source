import jwt_decode from 'jwt-decode';
import { v4 as uuid } from 'uuid';

import { trackDeviceIdMismatch } from 'client/features/playback/track/client-log';
import { getCookieCrossPlatform, getLocalData, setCookie } from 'client/utils/localDataStorage';
import { COOKIE_DEVICE_ID, NUM_SECONDS_IN_FIFTY_YEARS } from 'common/constants/constants';
import { setDeviceId as setDeviceIdAction } from 'common/features/authentication/actions/auth';
import ApiClient from 'common/helpers/ApiClient';
import type { TubiStore } from 'common/types/storeState';
import { getRefreshTokenFromStorage, setDeviceIdForTokenRequests } from 'common/utils/token';

const client = new ApiClient();

const setDeviceId = (store: TubiStore, deviceId: string, { persist = true }: {persist?: boolean} = {}) => {
  setDeviceIdForTokenRequests(deviceId);
  if (persist) {
    setCookie(COOKIE_DEVICE_ID, deviceId, NUM_SECONDS_IN_FIFTY_YEARS);
  }
  store.dispatch(setDeviceIdAction(deviceId));
};

const getDeviceIdFromAuthToken = (store: TubiStore) => {
  const state = store.getState();
  const { auth } = state;
  const isLoggedIn = !!auth.user;
  const token = isLoggedIn ? auth.user?.token : getRefreshTokenFromStorage();
  if (token) {
    return jwt_decode<any>(token).device_id;
  }
  return undefined;
};

export const setupDeviceId = async (store: TubiStore) => {
  let isDeviceIdMismatch = false;
  let tokenDeviceId = 'unknown';
  let storageRefreshTokenDeviceId = 'unknown';
  let authDeviceId = 'unknown';

  let deviceId;
  try {
    deviceId = await getCookieCrossPlatform(COOKIE_DEVICE_ID);
  } catch {
    // If we're here, it's likely because the /oz/tizen/cookie/*
    // endpoint failed.

    // Try to read the deviceId from the token if we failed to
    // read it from the cookie (e.g. like if the /oz/tizen/cookie endpoint
    // fails)
    deviceId = getDeviceIdFromAuthToken(store);

    // Set the deviceId in the store. If we didn't find a device id on a user
    // token, just use a temporary one. We don't want to persist it though
    // because:
    // * the other endpoint failed so this one probably will too
    // * if we used a temporary one, we don't want to overwrite
    //   the user's original deviceId.
    setDeviceId(store, deviceId ?? uuid(), { persist: false });
    return;
  } finally {
    try {
      // TODO @cbengtson remove this logic after logs indicate users are no longer seeing a mismatch
      /* istanbul ignore next */
      if (__OTTPLATFORM__ === 'TIZEN') {
        const { auth } = store.getState();
        const isLoggedIn = !!auth.user;
        const deviceIdFromToken = getDeviceIdFromAuthToken(store);
        if (deviceIdFromToken !== deviceId && !!deviceIdFromToken) {
          setCookie(COOKIE_DEVICE_ID, deviceIdFromToken, NUM_SECONDS_IN_FIFTY_YEARS);
          store.dispatch(setDeviceIdAction(deviceIdFromToken));
          client.sendBeacon('/oz/log', {
            data: {
              errorStatus: '204',
              errorMessage: `token: ${deviceIdFromToken} cookie: ${deviceId} useragent: ${typeof navigator !== 'undefined' && navigator.userAgent}`,
              customLogMessage: `${isLoggedIn ? 'Logged In' : 'Guest'} deviceId mismatch between cookie and token`,
            },
          });
          isDeviceIdMismatch = true;
          tokenDeviceId = deviceIdFromToken;
          authDeviceId = deviceId ?? 'unknown';
          storageRefreshTokenDeviceId = jwt_decode<any>(getRefreshTokenFromStorage()).device_id;
        }
      }
    /* istanbul ignore next */
    } catch (error) {
      // do nothing, just don't break the app
    }
    if (__OTTPLATFORM__ === 'TIZEN' && isDeviceIdMismatch) {
      trackDeviceIdMismatch({
        tokenDeviceId,
        authDeviceId,
        cookieDeviceId: deviceId ?? 'unknown',
        localStorageDeviceId: getLocalData(COOKIE_DEVICE_ID) ?? 'unknown',
        storageRefreshTokenDeviceId,
      });
    }
  }

  const storedDeviceId = store.getState().auth.deviceId;

  if (!deviceId) {
    setDeviceId(store, uuid());
  } else if (deviceId !== storedDeviceId) {
    // The failsafe page comes with a deviceId in the store state that was
    // generated at compile time. This deviceId will need to be replaced, so
    // replace the mismatched deviceId in the store with the correct deviceId
    // in the cookie.
    setDeviceId(store, deviceId);
  }
};
