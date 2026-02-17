/* eslint "@typescript-eslint/no-floating-promises": "error" */
import type { Location as HistoryLocation, Location } from 'history';
import Cookie from 'react-cookie';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { loadHomeScreen } from 'common/actions/container';
import { loadHistory } from 'common/actions/history';
import { resetDiscoveryRowState } from 'common/actions/ottUI';
import { loadQueue } from 'common/actions/queue';
import { addTransitionCompleteHook, setServiceUnavailable } from 'common/actions/ui';
import * as actions from 'common/constants/action-types';
import { OTT_STALE_DURATION } from 'common/constants/constants';
import { AGE_GATE_COOKIE, COPPA_REQUIRE_LOGOUT } from 'common/constants/cookies';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { load as loadAuth } from 'common/features/authentication/actions/auth';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type ApiClient from 'common/helpers/ApiClient';
import tubiHistory from 'common/history';
import type StoreState from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { trackLogging } from 'common/utils/track';

import { setContainerGridActiveId } from './containerGrid';
import type { TubiThunkAction } from '../types/reduxThunk';

function isSameAsCurrentLocation(url: string, currentLocation: HistoryLocation) {
  const { pathname, search } = currentLocation;
  const currentPathPlusSearch = [pathname, search].filter(Boolean).join('');
  // NB: this doesn't validate that `url` is an absolute path reference
  // (i.e. one that has no protocol, domain, or port), but it is assumed to be.
  return url === currentPathPlusSearch;
}

export const resetAppIfStale = (location: Location, awayFromAppTimestamp: number | undefined, targetUrl?: string): TubiThunkAction => {
  return (dispatch) => {
    if (typeof awayFromAppTimestamp !== 'number') return;
    const isAppStale = Date.now() - awayFromAppTimestamp > OTT_STALE_DURATION;
    if (isAppStale) {
      return dispatch(resetApp(location, targetUrl));
    }
  };
};

/**
 * reset app, including user/history/queue/content
 * targetUrl is destination after reloading
 * call SUCCESS action after the page transition
 * @return {Function}
 */
export const resetApp =
  (
    location: Location,
    targetUrl = `/?${Date.now()}`,
    force = true,
    clearExisting = false
  ): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> =>
    async (dispatch, getState) => {
      const isGDPREnabled = isGDPREnabledSelector(getState());
      const ageGateValue = Cookie.load(AGE_GATE_COOKIE);
      dispatch(setContainerGridActiveId(''));
      if (isGDPREnabled && ageGateValue === COPPA_REQUIRE_LOGOUT) {
        const redirectPath = __ISOTT__ ? OTT_ROUTES.ageUnavailable : WEB_ROUTES.ageUnavailable;
        tubiHistory.replace(redirectPath);
        return;
      }
      dispatch(actionWrapper(actions.APP_RESET_START));
      const { user } = getState().auth;
      if (clearExisting) {
        dispatch(actionWrapper(actions.UNLOAD_HISTORY));
        dispatch(actionWrapper(actions.UNLOAD_QUEUE));
      }
      dispatch(actionWrapper(actions.RESET_CONTENT_MODE));
      dispatch(resetDiscoveryRowState());
      const promises: Promise<unknown>[] = [
        user ? dispatch(loadAuth(location)) : null,
        user ? dispatch(loadHistory(force)) : null,
        user ? dispatch(loadQueue(location, force)) : null,
        dispatch(loadHomeScreen({ location, force, clearExisting })).catch((error) => {
          dispatch(setServiceUnavailable(true));
          throw error;
        }),
      ].filter((p): p is Exclude<typeof p, null> => p != null);
      await Promise.all(promises)
        .then(() => {
          const dispatchSuccessAction = () => dispatch(actionWrapper(actions.APP_RESET_SUCCESS));
          if (!isSameAsCurrentLocation(targetUrl, location)) {
            dispatch(addTransitionCompleteHook(dispatchSuccessAction));
            tubiHistory.push(targetUrl);
          } else {
            dispatchSuccessAction();
          }
          trackLogging({
            type: TRACK_LOGGING.clientInfo,
            subtype: LOG_SUB_TYPE.RESET,
            message: `Destination url: ${targetUrl}`,
          });
        })
        .catch((error) => {
          dispatch(actionWrapper(actions.APP_RESET_FAIL, { error }));
        });
    };
