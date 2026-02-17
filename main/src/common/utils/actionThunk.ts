import type { loadUserSettings } from 'common/actions/userSettings';

import type { TubiThunkDispatch } from '../types/reduxThunk';

/**
 * Runs a promise twice. Used for promise/thunk (ex. user settings) if we want to try loading it again
 * after it fails once.
 *
 * @param promise - action/thunk you want to dispatch
 * @param dispatch
 * @param forceResolve - example for fetchData, forceResolve to make sure we do not stop page loading
 * @returns resolved or rejected promise
 */
export const tryTwice = (promise: typeof loadUserSettings, dispatch: TubiThunkDispatch, forceResolve = false) => {
  return dispatch(promise())
    .catch(() => dispatch(promise()))
    .catch((error: Error) => forceResolve ? Promise.resolve() : Promise.reject(error));
};
