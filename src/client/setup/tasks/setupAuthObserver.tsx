import memoize from 'lodash/memoize';

import {
  getBridge, setupDsBridgeForDevEnv,
} from 'client/utils/clientTools';
import logger from 'common/helpers/logging';
import type { TubiStore } from 'common/types/storeState';
import { getAuthType } from 'common/utils/analytics';

export const addAuthChangeListener = (store: TubiStore, listeners: ((store: TubiStore) => void)[] = []) => {
  if (!listeners.length) {
    return;
  }

  const accountChangeSubscription = memoize(
    () => {
      // we need store to notify on every account change,
      // so only preserve latest arguments for memoize
      accountChangeSubscription?.cache?.clear?.();
      try {
        listeners.forEach((listener) => {
          listener(store);
        });
      } catch (err) {
        /* istanbul ignore next */
        logger.error(err, 'error when calling accountChangeSubscription');
      }
    },
    () => {
      const {
        auth: { user },
      } = store.getState();
      return JSON.stringify(user);
    }
  );
  store.subscribe(accountChangeSubscription);
};

export const notifyAccountChange = (store: TubiStore) => {
  const state = store.getState();
  const {
    auth: { user, loaded },
  } = state;
  const { userId, token, refreshToken, email, name } = (user as any) || {};
  const params = {
    user_id: userId || 0,
    access_token: token || '',
    refresh_token: refreshToken || '',
    email: email || '',
    name: name || '',
    auth_type: getAuthType(state),
  };
  // For registered users, isAuthFullyLoaded should be true if state.auth.loaded is true or the every value of params is not empty
  // For guest users, isAuthFullyLoaded is always true
  const isAuthFullyLoaded = loaded || !user || Object.keys(params).every((key) => !!params[key]);
  if (!isAuthFullyLoaded) {
    return;
  }
  notifyNativeAccountChange(params);
};

const notifyNativeAccountChange = (params: Record<string, unknown>) => {
  if (!__IS_ANDROIDTV_HYB_PLATFORM__ && __OTTPLATFORM__ !== 'FIRETV_HYB') {
    return;
  }

  /* istanbul ignore next -- this is only for development */
  if (__DEVELOPMENT__) {
    setupDsBridgeForDevEnv({
      changeUserAccount() {},
    });
  }

  let bridge;
  try {
    bridge = getBridge({ debug: __IS_ALPHA_ENV__ || !__PRODUCTION__ });
    bridge.init();
  } catch (err) {
    /* istanbul ignore next */
    logger.error(err, 'error when setting up bridge in setupAuthObserver');
  }

  bridge?.callHandler('changeUserAccount', params);
};

export const notifyAnonymousTokenChange = (anonymousToken: Record<string, unknown>) => {
  /* istanbul ignore else */
  if (anonymousToken) {
    // Sync with native when anonymous token refreshed
    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, id, key } = anonymousToken;
    const params = {
      user_id: 0,
      email: '',
      name: '',
      auth_type: getAuthType(),
      access_token: '',
      refresh_token: '',
      anonymous_sign_id: id || '',
      anonymous_sign_key: key || '',
      anonymous_access_token: accessToken || '',
      anonymous_refresh_token: refreshToken || '',
      // Because the Android team needs an absolute time in milliseconds,
      // convert from relative time in seconds to absolute time in milliseconds
      expires_in: Date.now() + ((expiresIn as number) * 1000 || 0),
    };

    notifyNativeAccountChange(params);
  }
};
