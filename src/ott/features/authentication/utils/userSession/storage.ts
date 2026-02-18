import { setLocalStorageData, getLocalStorageData, removeLocalStorageData } from '@adrise/utils/lib/localStorage';
import { days, secs } from '@adrise/utils/lib/time';

import { loadFireboltSDK } from 'client/utils/fireboltSDK';
import logger from 'common/helpers/logging';

import { trackUserSessionLogging } from './track';

const ONE_YEAR_IN_SECONDS = days(365) / secs(1);

export const isSecureStorageAvailable = () => __IS_COMCAST_PLATFORM_FAMILY__ && __CLIENT__;

export const trackSecureStorageError = (message: string, err?: Error) => {
  if (err) {
    logger.error({ err }, message);
  }
  trackUserSessionLogging({
    message,
    sampleRate: 0.1,
    loggerConfig: {
      shouldSend: false,
    },
  });
};

export const setItem = async (key: string, value: string) => {
  if (isSecureStorageAvailable()) {
    let isSuccess = false;

    try {
      const { SecureStorage } = await loadFireboltSDK();
      await SecureStorage.set(SecureStorage.StorageScope.DEVICE, key, value, {
        ttl: ONE_YEAR_IN_SECONDS,
      });
      isSuccess = true;
    } catch (err) {
      trackSecureStorageError(`SecureStorage.set failed: ${err.message}`, err);
    }

    return isSuccess;
  }

  return setLocalStorageData(key, value);
};

export const getItem = async (key: string) => {
  if (isSecureStorageAvailable()) {
    try {
      const { SecureStorage } = await loadFireboltSDK();
      return await SecureStorage.get(SecureStorage.StorageScope.DEVICE, key);
    } catch (err) {
      trackSecureStorageError(`SecureStorage.get failed: ${err.message}`, err);
      return null;
    }
  }

  return getLocalStorageData(key);
};

export const removeItem = async (key: string) => {
  if (isSecureStorageAvailable()) {
    let isSuccess = false;

    try {
      const { SecureStorage } = await loadFireboltSDK();
      await SecureStorage.remove(SecureStorage.StorageScope.DEVICE, key);
      isSuccess = true;
    } catch (err) {
      trackSecureStorageError(`SecureStorage.remove failed: ${err.message}`, err);
    }

    return isSuccess;
  }

  return removeLocalStorageData(key);
};
