import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { fetchRemoteConfig } from 'common/api/remoteConfig';
import { LOAD_REMOTE_CONFIG } from 'common/constants/action-types';
import type { RemoteConfigState } from 'common/constants/constants';
import type ApiClient from 'common/helpers/ApiClient';
import type StoreState from 'common/types/storeState';
import { getPlatform } from 'common/utils/platform';

import type { TubiThunkAction } from '../types/reduxThunk';

export const loadRemoteConfig = (): TubiThunkAction<ThunkAction<Promise<RemoteConfigState>, StoreState, ApiClient, Action>> =>
  async (dispatch, getState, client) => {
    const state = getState();
    const { auth: { deviceId } } = state;
    if (!deviceId) {
      throw new Error('Device ID is required to load remote config');
    }

    await dispatch({
      type: LOAD_REMOTE_CONFIG,
      payload: () => {
        return fetchRemoteConfig(client, getPlatform(), deviceId, state);
      },
    });

    const remoteConfig = getState().remoteConfig;

    if (__CLIENT__) {
      window.__REMOTE_CONFIG__ = remoteConfig;
    }
    return remoteConfig;
  };
