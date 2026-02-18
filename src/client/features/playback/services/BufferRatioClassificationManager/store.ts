import { days } from '@adrise/utils/lib/time';

import { setLocalData, getLocalData, removeLocalData } from 'client/utils/localDataStorage';
import logger from 'common/helpers/logging';

import type { BufferRatioStore } from './types';
import { BufferRatioGroup, THRESHOLDS_VERSION, THRESHOLDS_V1_1 } from './types';

export const STORAGE_KEY = 'tubi_buffer_ratio_classification';

function createEmptyStore(): BufferRatioStore {
  return {
    version: THRESHOLDS_VERSION,
    createdAt: Date.now(),
    group: BufferRatioGroup.CORE,
    bufferRatioWindow: [],
    lastUpdated: Date.now(),
  };
}

export function validateStore(store: unknown): store is BufferRatioStore {
  if (!store || typeof store !== 'object') {
    return false;
  }

  const candidate = store as Record<string, unknown>;

  // Check required properties exist and have correct types
  if (typeof candidate.version !== 'string') {
    return false;
  }

  if (typeof candidate.createdAt !== 'number') {
    return false;
  }

  if (typeof candidate.lastUpdated !== 'number') {
    return false;
  }

  // Check if group is a valid BufferRatioGroup
  if (candidate.group !== BufferRatioGroup.BEST &&
      candidate.group !== BufferRatioGroup.CORE &&
      candidate.group !== BufferRatioGroup.LOW_END) {
    return false;
  }

  // Check if bufferRatioWindow is an array of numbers
  if (!Array.isArray(candidate.bufferRatioWindow)) {
    return false;
  }

  if (!candidate.bufferRatioWindow.every((item: unknown) => typeof item === 'number')) {
    return false;
  }

  return true;
}

export function loadStore(): BufferRatioStore {
  try {
    const stored = getLocalData(STORAGE_KEY);
    if (!stored) {
      return createEmptyStore();
    }

    const parsedStore: unknown = JSON.parse(stored);

    // Validate the parsed store structure
    if (!validateStore(parsedStore) || parsedStore.version !== THRESHOLDS_VERSION) {
      logger.debug('[BufferRatioClassification] Invalid store structure, creating empty store');
      removeLocalData(STORAGE_KEY);
      return createEmptyStore();
    }

    return parsedStore;
  } catch (error) {
    logger.debug('[BufferRatioClassification] Failed to load store:', error);
    return createEmptyStore();
  }
}

export function saveStore(store: BufferRatioStore): void {
  setLocalData(STORAGE_KEY, JSON.stringify(store), days(30));
}

export function updateSlidingWindow(record: BufferRatioStore, bufferRatio: number): BufferRatioStore {
  const currentTime = Date.now();

  // Add new session
  const newRatios = [...record.bufferRatioWindow, bufferRatio];

  // Keep only last N sessions
  const maxLength = THRESHOLDS_V1_1.windowLength;
  if (newRatios.length > maxLength) {
    newRatios.splice(0, newRatios.length - maxLength);
  }

  return {
    ...record,
    bufferRatioWindow: newRatios,
    lastUpdated: currentTime,
  };
}
