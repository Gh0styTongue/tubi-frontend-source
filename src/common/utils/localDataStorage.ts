import {
  getLocalStorageData,
  removeLocalStorageData,
  setLocalStorageData,
  supportsLocalStorage,
} from '@adrise/utils/lib/localStorage';
import { secs, years } from '@adrise/utils/lib/time';
import Cookie from 'react-cookie';

import { COOKIE_DEVICE_ID, HOMESCREEN_USER_PREFERENCES_PARAM, NUM_SECONDS_IN_FIFTY_YEARS } from 'common/constants/constants';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import logger from 'common/helpers/logging';
import { deleteTizenCookie, getTizenCookie, saveTizenCookieValue } from 'common/services/tizen';
import { isClientTizenHttp } from 'common/utils/tizenProtocol';
import config from 'src/config';

export const MAX_COOKIE_SIZE = 4096;
export const MAX_SINGLE_COOKIE_SIZE = 1024;
export const LOCAL_STORAGE_EXPIRE_KEY = 'expire_time';

/**
 * check cookie size
 *
 * @param {string} key
 * @param {string} value
 * @returns {boolean} is cookie size valid
 */
export const isValidCookieSize = (key: string, value: string) => {
  if (value.length > MAX_SINGLE_COOKIE_SIZE) {
    logger.error(`Set cookie error, the cookie size for ${key} exceeds the maximum limit of ${MAX_SINGLE_COOKIE_SIZE} bytes.`);
    return false;
  }

  if (!__CLIENT__) return true;

  const totalSize = document.cookie.length + key.length + value.length;
  if (totalSize > MAX_COOKIE_SIZE) {
    logger.error(`Set cookie error, total cookie size with ${key} exceeds the maximum limit of ${MAX_COOKIE_SIZE} bytes.`);
    return false;
  }
  return true;
};

export const COOKIE_MAX_AGE = years(1) / secs(1); // 1 year in seconds

export const TUBI_IO = 'tubi.io';
export const TUBITV_COM = 'tubitv.com';

export const getCookieDomain = () => {
  const { fqdn } = config;
  if (fqdn.includes(TUBI_IO)) {
    return TUBI_IO;
  }
  if (fqdn.includes(TUBITV_COM)) {
    return TUBITV_COM;
  }
  return undefined;
};

function needTizenFileProtocolCookieService(): boolean {
  return __OTTPLATFORM__ === 'TIZEN' && !__SERVER__ && !isClientTizenHttp();
}

/**
 * set cookie value
 *
 * @param {string} key
 * @param {string} value
 * @param {?number} [age] Age in seconds
 * @param {?string} path
 * @param {?string} domain
 * @returns {undefined}
 */
// TODO @cbengtson, convert this function to use an object param

export const setCookie = (key: string, value: string, age = COOKIE_MAX_AGE, path = '/', domain?: string) => {
  if (!OnetrustClient.canSetLocalData(key)) {
    return;
  }
  // TODO @Fengjun: For now, let's not return the case of exceeding cookie max size limit
  // See if there are error logs on platforms
  // if (!isValidCookieSize(key, value)) return;
  isValidCookieSize(key, value);

  const maxAge = age === 0 ? undefined : age;
  const options = {
    maxAge,
    path,
    ...(domain && { domain }),
  };
  Cookie.save(key, value, options);

  if (needTizenFileProtocolCookieService()) {
    saveTizenCookieValue({ key, value, maxAge });
  }
};

const setData = (
  key: string,
  value: string,
  {
    age,
    useLocalStorageIfAvailable = true,
    path,
  }: { useLocalStorageIfAvailable?: boolean; age?: number; path?: string }
) => {
  if (!OnetrustClient.canSetLocalData(key)) {
    return;
  }
  if (useLocalStorageIfAvailable && setLocalStorageData(key, value)) {
    if (age) {
      // Use another key to save expire time for local storage
      const expireTime = new Date().getTime() + age * 1000;
      setLocalStorageData(`${key}_${LOCAL_STORAGE_EXPIRE_KEY}`, `${expireTime}`);
    }
  } else {
    setCookie(key, value, age, path);
  }
};

/**
 * set local data
 *
 * @param {string} key
 * @param {string} value
 * @param {?number} age Age in seconds for the cookie
 * @returns undefined
 */
export const setLocalData = (key: string, value: string, age?: number) => {
  setData(key, value, { age, useLocalStorageIfAvailable: true });
};

const getData = (key: string, isLocalStoragePreferred = true) => {
  if (typeof window === 'undefined' && isLocalStoragePreferred) return false;

  // return localStorage's value
  if (isLocalStoragePreferred && supportsLocalStorage(['getItem', 'removeItem'])) {
    const expireTime = getLocalStorageData(`${key}_${LOCAL_STORAGE_EXPIRE_KEY}`);
    if (expireTime) {
      if (Date.now() > parseInt(expireTime, 10)) {
        removeLocalStorageData(key);
        removeLocalStorageData(`${key}_${LOCAL_STORAGE_EXPIRE_KEY}`);
        return false;
      }
    }
    return getLocalStorageData(key);
  }

  // "Cookie.load(key)" could return object, we need to pass doNotParse: true to keep it the same as localStorage.getItem
  return Cookie.load(key, true);
};

/**
 * get local data
 *
 * @param {string} key
 * @returns {string|null|boolean} value of local data
 */
export const getLocalData = (key: string) => {
  return getData(key, true);
};

export const getAllKeysFromCookie = () => {
  const keys: string[] = [];
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    if (trimmedCookie === '') continue;
    const eqPos = trimmedCookie.indexOf('=');
    const name = eqPos > -1 ? trimmedCookie.substr(0, eqPos).trim() : trimmedCookie;
    if (name !== '') {
      keys.push(name);
    }
  }
  return keys;
};

export const getAllKeys = () => {
  if (typeof window === 'undefined') return [];
  if (supportsLocalStorage()) {
    return Object.keys(window.localStorage);
  }
  return getAllKeysFromCookie();
};

/**
 * get local cookie value as a string
 *
 * @param {string} key
 * @returns {string} value of cookie
 * @deprecated this doesn't work for samsung. use getCookieCrossPlatform instead
 */
export const getCookie = (key: string) => {
  return getData(key, false);
};

export const getCookieCrossPlatform = (key: string): Promise<string | undefined> => {
  if (needTizenFileProtocolCookieService()) {
    return getTizenCookie(key);
  }
  return Promise.resolve(getData(key, false));
};

/**
 * remove cookie
 *
 * @param {string} key
 */
export const removeCookie = (key: string, path = '/') => {
  Cookie.remove(key, { path });

  if (needTizenFileProtocolCookieService()) {
    deleteTizenCookie(key);
  }
};

const removeData = (key: string, useLocalStorageIfAvailable = true, path = '/') => {
  if (useLocalStorageIfAvailable && supportsLocalStorage(['removeItem'])) {
    removeLocalStorageData(key);
    removeLocalStorageData(`${key}_${LOCAL_STORAGE_EXPIRE_KEY}`);
  } else {
    removeCookie(key, path);
  }
};

/**
 * remove local data
 *
 * @param {string} key
 */
export const removeLocalData = (key: string) => {
  removeData(key);
};

export type UserPreferenceTitle = {
  dislike_selections: {
    contents: string[]
  },
  preference_selections: {
    contents: string[]
  },
  skip_selections: {
    contents: string[]
  },
};

export const USER_PREFERENCE_COOKIE_EXPIRES_SECONDS = 24 * 60 * 60; // 1 day

export const saveUserPreferences = (userPreferences: UserPreferenceTitle) => {
  const base64encode = window.btoa(JSON.stringify(userPreferences));
  setCookie(HOMESCREEN_USER_PREFERENCES_PARAM, base64encode, USER_PREFERENCE_COOKIE_EXPIRES_SECONDS, '/');
};

// Since Chrome v106, the max age for a cookie will be set to 400 days maximum, (other browsers may follow)
// https://developer.chrome.com/blog/cookie-max-age-expires
// So we want to ensure that long time users >400 days will not have their device Id reset, which could impact their user experience (recommendations, etc)
export const updateDeviceIdCookieExpires = () => {
  const currentDeviceId = getCookie(COOKIE_DEVICE_ID);
  if (currentDeviceId) {
    // copy from middleware/deviceid.ts
    setCookie(COOKIE_DEVICE_ID, currentDeviceId, NUM_SECONDS_IN_FIFTY_YEARS);
  }
};

export const safelyParseJSON = <T>(jsonString: string | null, defaultValue: T): T => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    logger.error({ error }, `Failed to parse JSON value: ${jsonString}`);
    return defaultValue;
  }
};
