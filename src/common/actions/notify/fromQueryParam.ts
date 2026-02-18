import type { ThunkAction } from 'redux-thunk';

import { addNotification } from 'common/actions/ui';
import type ApiClient from 'common/helpers/ApiClient';
import type StoreState from 'common/types/storeState';
import type * as uiTypes from 'common/types/ui';
import { EMAIL_VERIFICATION_FAIL } from 'web/components/TubiNotifications/emailVerificationFail';
import * as notificationTypes from 'web/components/TubiNotifications/notificationTypes';

/**
 * If there are any notification to be called given the url param from direct visit they will be called
 * @param queryShortHand - e.g. EMAIL_VERIFICATION_FAIL.queryShortHand
 */
export function notifyFromQueryParam(
  queryShortHand?: string
): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch) => {
    if (!queryShortHand) return;
    const allNotificationTypes = { ...notificationTypes, EMAIL_VERIFICATION_FAIL };
    Object.keys(allNotificationTypes).forEach((notif) => {
      const presetNotification = allNotificationTypes[notif];
      if (presetNotification.queryShortHand === queryShortHand) {
        dispatch(addNotification(presetNotification.notification, 'query-preset'));
      }
    });
  };
}

