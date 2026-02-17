import { OnetrustClient } from 'common/features/gdpr/onetrust';

/**
 * if current environment supports sessionstorage
 */
export const supportsSessionStorage = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    return Boolean(window.sessionStorage && window.sessionStorage.getItem);
  } catch (err) {
    return false;
  }
};

export const setData = (key: string, value: string): void => {
  if (!OnetrustClient.canSetLocalData(key)) {
    return;
  }
  if (supportsSessionStorage()) window.sessionStorage.setItem(key, value);
};

export const getData = (key: string): string | null => {
  if (supportsSessionStorage()) {
    return window.sessionStorage.getItem(key);
  }
  return null;
};

export const removeData = (key: string): void => {
  if (supportsSessionStorage()) window.sessionStorage.removeItem(key);
};

export const clearData = (): void => {
  if (supportsSessionStorage()) window.sessionStorage.clear();
};
