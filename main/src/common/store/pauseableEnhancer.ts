import type { StoreEnhancer, Unsubscribe } from 'redux';

export type PauseableExt = {
  pauseNotifications: () => void;
  resumeNotifications: () => void;
};

const pauseableEnhancer = (): StoreEnhancer<PauseableExt> => (createStore) => (reducer, initialState) => {
  const store = createStore(reducer, initialState);
  let isPaused = false;
  let queuedCallbacks: VoidFunction[] = [];

  const pauseNotifications = () => {
    isPaused = true;
  };

  const resumeNotifications = (): void => {
    isPaused = false;
    while (queuedCallbacks.length && !isPaused) {
      queuedCallbacks.shift()!();
    }
  };

  const subscribe = (cb: () => void): Unsubscribe => {
    const unsubscribe = store.subscribe(() => {
      if (isPaused) {
        queuedCallbacks.push(cb);
      } else {
        cb();
      }
    });

    return () => {
      unsubscribe();
      queuedCallbacks = queuedCallbacks.filter(queuedCb => queuedCb !== cb);
    };
  };

  return {
    ...store,
    subscribe,
    pauseNotifications,
    resumeNotifications,
  };
};

export default pauseableEnhancer;
