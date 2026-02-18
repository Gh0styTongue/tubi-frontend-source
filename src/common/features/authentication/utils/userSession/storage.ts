import { setLocalStorageData, getLocalStorageData, removeLocalStorageData } from '@adrise/utils/lib/localStorage';

// Keep async signatures for API consistency with serverStorageAdapter
/* eslint-disable require-await */

export const setItem = async (key: string, value: string) => {
  return setLocalStorageData(key, value);
};

export const getItem = async (key: string) => {
  return getLocalStorageData(key);
};

export const removeItem = async (key: string) => {
  return removeLocalStorageData(key);
};
