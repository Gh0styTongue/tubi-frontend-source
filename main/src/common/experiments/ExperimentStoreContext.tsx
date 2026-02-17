import type { ReactNode } from 'react';
import React, { useContext } from 'react';
import type { Store } from 'redux';

import type { StoreState } from 'common/types/storeState';

const ExperimentStoreContext = React.createContext<Store<StoreState> | undefined>(undefined);

/**
 * Provides an instance of the Redux store in order to correctly instantiate
 * `Experiment` instances on the server. Please don't use this to get access to
 * the store for other reasons!
 */
export function useExperimentStore(): Store<StoreState> | undefined {
  return useContext(ExperimentStoreContext);
}

export function ExperimentStoreProvider({ children, store }: { store: Store<StoreState>, children?: ReactNode }) {
  return <ExperimentStoreContext.Provider value={store}>{children}</ExperimentStoreContext.Provider>;
}

type RenderProp = (store: Store<StoreState> | undefined) => ReactNode;

export function ExperimentStoreConsumer({ children }: { children: RenderProp }) {
  return <ExperimentStoreContext.Consumer>{children}</ExperimentStoreContext.Consumer>;
}
