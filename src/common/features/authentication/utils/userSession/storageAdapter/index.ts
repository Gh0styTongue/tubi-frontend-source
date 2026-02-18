/**
 * Storage adapter layer that abstracts the data source (localStorage vs Server/Redis).
 * This allows business logic to be agnostic about where user session data is stored.
 */
import type ApiClient from 'common/helpers/ApiClient';

import { isRedisPermitted } from '../helpers';
import { createLocalStorageAdapter } from './localStorageAdapter';
import { createServerStorageAdapter } from './serverStorageAdapter';
import type { SessionStorageAdapter } from './types';

export type { SessionStorageAdapter } from './types';
export { createLocalStorageAdapter } from './localStorageAdapter';
export { createServerStorageAdapter } from './serverStorageAdapter';

/**
 * Factory function to get the appropriate storage adapter.
 * Returns LocalStorageAdapter for platforms using localStorage,
 * or ServerStorageAdapter for platforms using Redis.
 *
 * @param client - ApiClient instance (used for server storage)
 * @returns The appropriate storage adapter based on platform configuration
 */
export const getStorageAdapter = (client: ApiClient): SessionStorageAdapter => {
  if (isRedisPermitted()) {
    return createServerStorageAdapter(client);
  }
  return createLocalStorageAdapter();
};
