import Cookie from 'react-cookie';

import { resetApp } from 'common/actions/resetApp';
import { setKidsMode } from 'common/actions/ui';
import { setUserCoppaState } from 'common/actions/userSettings';
import {
  AGE_GATE_COOKIE,
  COPPA_COMPLIANT,
  NOT_COPPA_COMPLIANT,
} from 'common/constants/cookies';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { logout } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import {
  isCoppaEnabledSelector,
  isUserCoppaRequireLogoutSelector,
  isUserNotCoppaCompliantSelector,
} from 'common/features/coppa/selectors/coppa';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { TubiStore } from 'common/types/storeState';

export const setupCoppa = (store: TubiStore, dispatch: TubiThunkDispatch) => {
  let state = store.getState();
  const isCoppaEnabled = isCoppaEnabledSelector(state);
  const isLoggedIn = isLoggedInSelector(state);

  if (!isCoppaEnabled) {
    return;
  }

  /**
   * For guest users, read AGE_GATE_COOKIE and save it into redux store.
   * For users logged in, their COPPA state is saved in redux store after `fetchUserAge` in actions/userSettings.
   */
  if (!isLoggedIn) {
    const ageGateValue = Cookie.load<string>(AGE_GATE_COOKIE);
    if (ageGateValue === COPPA_COMPLIANT) {
      setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
    } else if (ageGateValue === NOT_COPPA_COMPLIANT) {
      setUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
    }
  }

  /**
   * 1. coppa compliant: ignore and continue
   * 2. coppa not compliant:
   *    Only guest users whose age is under 13 (varies by region).
   *    Logged-in users with age under 13 are deleted.
   * 3. require logout: legal reason.
   * 4. require_age_gate: Logged-in users without age.
   *    Handled in helpers/routing(web) and withAgeGate(ott) by showing different UI.
   */

  // call store.getState again to get latest value
  state = store.getState();
  const location = tubiHistory.getCurrentLocation();
  if (isUserNotCoppaCompliantSelector(state)) {
    const currentUrl = [location.pathname, location.search].filter(Boolean).join('');
    const lockInKidsMode = () => {
      dispatch(setKidsMode(true));
      dispatch(resetApp(location, currentUrl));
    };
    if (isLoggedIn) {
      dispatch(logout(location)).then(lockInKidsMode);
    } else {
      lockInKidsMode();
    }
  } else if (isUserCoppaRequireLogoutSelector(state)) {
    const redirectForGDPRUsers = () => {
      /* istanbul ignore else */
      if (isGDPREnabledSelector(state)) {
        const redirectPath = __ISOTT__ ? /* istanbul ignore next */OTT_ROUTES.ageUnavailable : WEB_ROUTES.ageUnavailable;
        tubiHistory.replace(redirectPath);
      }
    };
    if (isLoggedIn) {
      dispatch(logout(location)).then(redirectForGDPRUsers);
    } else {
      redirectForGDPRUsers();
    }
  }
};
