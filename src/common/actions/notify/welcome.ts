import { showWelcomeNotification, toggleLoginModal } from 'common/actions/ui';
import { WELCOME_QUERY_PARAM } from 'common/constants/constants';
import { userSelector } from 'common/features/authentication/selectors/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { getIntl } from 'i18n/intl';
import { messages } from 'web/components/LoginModal/loginModalMessages';
import { removeUrlParam } from 'web/utils/urlManipulation';

export const welcome = () => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const user = userSelector(state);
    if (!user) {
      return;
    }
    const hasKids = user.kids && user.kids.length > 0;
    if (hasKids) {
      const intl = getIntl(state.ui.userLanguageLocale);
      dispatch(toggleLoginModal({
        isOpen: true,
        title: intl.formatMessage(messages.whoIsWatching),
        description: '',
      }));
    } else {
      dispatch(showWelcomeNotification());
    }

    removeUrlParam(WELCOME_QUERY_PARAM);
  };
};
