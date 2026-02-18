import { setKidsMode, toggleLoginModal, showWelcomeNotification } from 'common/actions/ui';
import { WEB_ROUTES } from 'common/constants/routes';
import { activateUser, setActiveUser } from 'common/features/authentication/actions/multipleAccounts';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import type { AuthThunk, User, Kid } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import { getIntl } from 'i18n/intl';
import { messages } from 'web/components/LoginModal/loginModalMessages';
import { isCreateParentFlow } from 'web/features/authentication/utils/auth';

type Flow = 'login' | 'register';

export const handleAddAdultsAccountSuccess = (user: User, _flow: Flow = 'login'): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const hasKids = user.kids && user.kids.length > 0;

    const location = tubiHistory.getCurrentLocation();
    const isCreatingParentAccount = isCreateParentFlow(location);

    // TODO: if user already exists in user list, we need to update the user in the list (?)
    // TODO: braze.changeUser for setActiveUser
    // TODO: analytics events
    if (isCreatingParentAccount) {
      // TODO: if user account's parental rating is kids, we need to stop and switch to kids mode
      const redirectPath = hasKids ? WEB_ROUTES.addAccountCreateParentNext : WEB_ROUTES.addKidsSetup;
      await dispatch(activateUser(user));
      tubiHistory.push(redirectPath);
    } else {
      const redirectPath = loginRedirectSelector(getState(), { queryString: location.search }) || WEB_ROUTES.home;
      const { formatMessage } = getIntl(getState().ui.userLanguageLocale);
      // go to previously visited page
      await dispatch(setActiveUser({ user, redirectPath, shouldBypassGate: true }));
      if (hasKids) {
        dispatch(toggleLoginModal({
          isOpen: true,
          title: formatMessage(messages.whoIsWatching),
          description: '',
        }));
      } else {
        dispatch(showWelcomeNotification());
      }
    }
  };
};

export const handleAddKidsAccountSuccess = (user: Kid): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const location = tubiHistory.getCurrentLocation();
    const redirectPath = loginRedirectSelector(getState(), { queryString: location.search }) || WEB_ROUTES.home;
    dispatch(setKidsMode(true));
    await dispatch(setActiveUser({ user, redirectPath, shouldBypassGate: true }));
    dispatch(showWelcomeNotification());
  };
};
