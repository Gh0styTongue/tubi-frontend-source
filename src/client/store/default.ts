import type { Store } from 'redux';

import type StoreState from 'common/types/storeState';

let store: Store<StoreState> | undefined;

export function setStore(reduxStore: Store<StoreState>): void {
  store = reduxStore;
}

export function getStore(): Store<StoreState> {
  if (store === undefined) {
    throw new Error('accessing store prior to initialization');
  }
  return store;
}
