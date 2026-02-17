/* istanbul ignore file */
import { middleware as fetchMiddleware } from '@tubitv/refetch';
import get from 'lodash/get';
import type { StoreEnhancerStoreCreator } from 'redux';
import { createStore as _createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import type ApiClient from 'common/helpers/ApiClient';
import type { PauseableExt } from 'common/store/pauseableEnhancer';
import pauseableEnhancer from 'common/store/pauseableEnhancer';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';

import clientMiddleware from '../middleware/clientMiddleware';
import { getTopLevelReducer } from '../reducers/reducer';

export default function createStore(client: ApiClient, data: Partial<StoreState> = {}) {
  const middleware = [
    fetchMiddleware(),
    thunk.withExtraArgument(client),
    clientMiddleware(client),
  ];

  const storeEnhancers = [
    applyMiddleware<TubiThunkDispatch, StoreState>(...middleware),
    pauseableEnhancer(),
  ];

  if (__STAGING__) {
    const remoteDebuggerReduxDevToolCompose = typeof window !== 'undefined'
      && get(window, ['remoteDebuggerLauncher', 'composeWithDevTools']);
    // Enable remote debugger redux devTools if we find remote debugger
    if (remoteDebuggerReduxDevToolCompose) {
      storeEnhancers.push(remoteDebuggerReduxDevToolCompose({ trace: true }));
    }
  }

  const store = _createStore(
    getTopLevelReducer(),
    data,
    compose<StoreEnhancerStoreCreator<PauseableExt>>(...storeEnhancers)
  );

  return store;
}
