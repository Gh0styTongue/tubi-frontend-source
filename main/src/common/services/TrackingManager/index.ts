import type { Store } from 'redux';

import type { StoreState } from 'common/types/storeState';

import TrackingManager from './TrackingManager';

type InstanceMap = WeakMap<Store<StoreState>, TrackingManager>;

// if using this on the server, we must know the store for this request, so we can have each request have
// its own TrackingManager instance.
const createInstanceMap = (): WeakMap<Store<StoreState>, TrackingManager> => new WeakMap<Store<StoreState>, TrackingManager>();
let instanceMap: InstanceMap;
/* istanbul ignore else */
if (__SERVER__) {
  instanceMap = createInstanceMap();
}
export const getServerInstance = (store?: Store<StoreState>) : TrackingManager => {
  if (__SERVER__) {
    if (!store || !instanceMap) {
      throw new Error('TrackingManager must be created with a store and have instanceMap');
    }
    if (!instanceMap.has(store)) {
      instanceMap.set(store, new TrackingManager());
    }
    return instanceMap.get(store)!;
  }
  throw new Error('getServerInstance must be called on the server');
};

let instance: TrackingManager;
/* istanbul ignore else */
if (__SERVER__) {
  instance = new Proxy({}, {
    get: () => {
      throw new Error('trackingManager must be used on client side, if you are using it on the server, you should use getServerInstance');
    },
  }) as TrackingManager;
} else {
  // Samsung don't have server side render, also don't use `HTMLBody.tsx` which we inserted `window.__TRACKING_QUEUE__
  // So we just initialize the instance with empty state.
  if (__OTTPLATFORM__ === 'TIZEN') {
    instance = new TrackingManager();
  } else {
    const initialQueue = window.__TRACKING_QUEUE__;
    instance = new TrackingManager({ eventsQueue: initialQueue });
    delete window.__TRACKING_QUEUE__;
  }
}

export const getInstance = (store?: Store<StoreState>): TrackingManager => {
  if (__SERVER__) {
    return getServerInstance(store);
  }
  return instance;
};

export default instance;
