import { DialogType } from '@tubitv/analytics/lib/dialog';
import type { History } from 'history';

import systemApi from 'client/systemApi';
import { openLeftNav } from 'common/actions/leftNav';
import { hideModal, showErrorModal, showNotFoundModal } from 'common/actions/modal';
import { COMCAST_ROUTE_CHANGE_ERROR } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { OTT_ROUTES } from 'common/constants/routes';
import { isUserNotFound, isLoginRequired } from 'common/features/authentication/utils/user';
import { LeftNavMenuOption } from 'common/types/ottUI';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { TubiStore } from 'common/types/storeState';
import { buildDialogEvent } from 'common/utils/analytics';
import { buildErrorMessage } from 'common/utils/errorCapture';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { matchesRoute } from 'common/utils/urlPredicates';
import { getIntl } from 'i18n/intl';

export interface ShowOTTErrorModalParams {
  store: TubiStore;
  history: History;
  location: string;
  errorCode?: string;
  error: {
    code: string;
    message: string;
    status: number;
    errorCode?: string;
  };
}

export const hideModalAndResetFocus = (): TubiThunkAction => {
  return (dispatch) => {
    dispatch(hideModal());
    const pathname = getCurrentPathname();
    /* istanbul ignore else */
    if (matchesRoute(OTT_ROUTES.home, pathname)) {
      dispatch(openLeftNav(LeftNavMenuOption.Account));
    }
  };
};

export function showOTTErrorModal({ store, history, location, errorCode, error }: ShowOTTErrorModalParams) {
  const {
    ui: { userLanguageLocale },
  } = store.getState();
  const intl = getIntl(userLanguageLocale);
  const message = errorCode ? `${buildErrorMessage(errorCode, intl)}` : undefined;

  if (__ISOTT__) {
    // There’s no need to display an error modal for the following error cases, as they are already
    // handled by handleCustomEvent in App.tsx.
    if (isUserNotFound(error.status, error.code) || isLoginRequired(error.status, error.errorCode)) {
      return;
    }

    store.dispatch(
      showErrorModal({
        onRetry: () => {
          store.dispatch(hideModal());
          history.push({
            pathname: location,
            state: {
              retry: true,
            },
          });
        },
        onCancel: () => store.dispatch(hideModalAndResetFocus()),
        isCloseText: true,
        message,
      })
    );
  }

  if (__IS_COMCAST_PLATFORM_FAMILY__) {
    systemApi.logError?.({
      message: 'Error fetching data on route change',
      visible: true,
      code: COMCAST_ROUTE_CHANGE_ERROR,
    });
  }

  trackEvent(eventTypes.DIALOG, buildDialogEvent(location, DialogType.NETWORK_ERROR, errorCode));
}

export function showOTTNotFoundModal(store: TubiStore, locate: string, history: History): void {
  if (__ISOTT__) {
    store.dispatch(
      showNotFoundModal({
        retry: () => history.push(locate),
        hideModal: () => store.dispatch(hideModalAndResetFocus()),
      })
    );
  }
  trackEvent(eventTypes.DIALOG, buildDialogEvent(locate, DialogType.CONTENT_NOT_FOUND));
}
