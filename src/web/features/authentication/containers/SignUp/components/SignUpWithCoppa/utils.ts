import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { showEligibilityModal } from 'common/actions/ui';
import { updateUserSettings } from 'common/actions/userSettings';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  clearLoginActions,
  logout,
} from 'common/features/authentication/actions/auth';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import type { EnhancedAgeGateData } from 'common/features/authentication/types/auth';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { getBirthdayISOStr } from 'common/features/coppa/utils/ageGate';
import type ApiClient from 'common/helpers/ApiClient';
import tubiHistory from 'common/history';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { trackRegisterEvent, ProgressType } from 'web/features/authentication/utils/track';

export const fulfillUserInfo = (data: EnhancedAgeGateData, actions: AgeGateFormikActions): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> => {
  return (dispatch, getState) => {
    const location = tubiHistory.getCurrentLocation();
    const loginRedirect = loginRedirectSelector(getState(), { queryString: location.search });

    const { setStatus } = actions;
    const { gender, personalizedEmails } = data;
    trackRegisterEvent({ progress: ProgressType.SUBMIT_AGE_GATE });
    return dispatch(updateUserSettings(location, {
      birthday: getBirthdayISOStr(data),
      gender,
      ...(personalizedEmails ? {
        notification_settings: {
          gdpr_personalized_emails: personalizedEmails,
        },
      } : {}),
    }, true)).then(() => {
      // 200, user is coppa compliant
      setStatus({ formError: null });
      tubiHistory.replace(loginRedirect || WEB_ROUTES.home);
      if (loginRedirect) {
        dispatch(clearLoginActions());
      }
    }).catch(() => {
      setStatus({ formError: null });
      // logout will check for coppa states
      dispatch(logout(location, { logoutOnProxyServerOnly: true }))
        .then(() => tubiHistory.replace(WEB_ROUTES.home))
        .then(() => dispatch(showEligibilityModal()));
    });
  };
};
