import { setLocalStorageData, getLocalStorageData, removeLocalStorageData } from '@adrise/utils/lib/localStorage';
import { days, secs } from '@adrise/utils/lib/time';

import { loadFireboltSDK } from 'client/utils/fireboltSDK';

import { trackUserSessionLogging } from './track';

const ONE_YEAR_IN_SECONDS = days(365) / secs(1);

// We can entirely remove SecureStorage or migrate to a self-hosted solution after Sea Lion. For now,
// I’d like to update only this condition to minimize changes to the critical pathway before Sea Lion.
export const isSecureStorageAvailable = () => false;

export const trackSecureStorageError = (message: string, err: Error) => {
  trackUserSessionLogging({
    message,
    loggerConfig: {
      data: { err },
    },
  });
};

export const setItem = async (key: string, value: string) => {
  /* istanbul ignore if - TODO: enable this test once we decide to use SecureStorage again */
  if (isSecureStorageAvailable()) {
    let isSuccess = false;

    try {
      const { SecureStorage } = await loadFireboltSDK();
      await SecureStorage.set(SecureStorage.StorageScope.DEVICE, key, value, {
        ttl: ONE_YEAR_IN_SECONDS,
      });
      isSuccess = true;
    } catch (err) {
      trackSecureStorageError('SecureStorage.set failed', err);
    }

    return isSuccess;
  }

  return setLocalStorageData(key, value);
};

export const getItem = async (key: string) => {
  /* istanbul ignore if - TODO: enable this test once we decide to use SecureStorage again */
  if (isSecureStorageAvailable()) {
    try {
      const { SecureStorage } = await loadFireboltSDK();
      return await SecureStorage.get(SecureStorage.StorageScope.DEVICE, key);
    } catch (err) {
      trackSecureStorageError('SecureStorage.get failed', err);
      return null;
    }
  }

  return getLocalStorageData(key);
};

export const removeItem = async (key: string) => {
  /* istanbul ignore if - TODO: enable this test once we decide to use SecureStorage again */
  if (isSecureStorageAvailable()) {
    let isSuccess = false;

    try {
      const { SecureStorage } = await loadFireboltSDK();
      await SecureStorage.remove(SecureStorage.StorageScope.DEVICE, key);
      isSuccess = true;
    } catch (err) {
      trackSecureStorageError('SecureStorage.remove failed', err);
    }

    return isSuccess;
  }

  return removeLocalStorageData(key);
};
