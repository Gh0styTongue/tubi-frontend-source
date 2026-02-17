import type StoreState from 'common/types/storeState';

export const castReceiverStateSelector = (state: StoreState) => state.chromecast?.castReceiverState ?? '';

export const castApiAvailableSelector = (state: StoreState) => {
  return state.chromecast?.castApiAvailable ?? false;
};

export const castReceiverPoitionSelector = (state: StoreState) => {
  return state.chromecast.position;
};
