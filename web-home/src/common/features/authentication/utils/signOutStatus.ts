import { parseQueryString } from '@adrise/utils/lib/queryString';
import { ActionStatus, Manipulation, Messages, UserType } from '@tubitv/analytics/lib/authEvent';

import { SIGN_OUT_STATUS } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import trackingManager from 'common/services/TrackingManager';
import { removeUrlParam } from 'web/utils/urlManipulation';

type SignOutStatusType = ActionStatus | undefined;

type SignOutParams = {
  [SIGN_OUT_STATUS]: SignOutStatusType;
};

const getSignOutStatus = (): SignOutStatusType => {
  const {
    search,
  } = window.location;
  const signOutParams = (parseQueryString(search) as SignOutParams);
  return signOutParams[SIGN_OUT_STATUS];
};

const sendSignOutEvent = (isSuccess: boolean) => {
  trackingManager.addEventToQueue(eventTypes.ACCOUNT_EVENT, {
    manip: Manipulation.SIGNOUT,
    userType: UserType.EXISTING_USER,
    message: isSuccess ? Messages.SUCCESS : Messages.ERROR,
    status: isSuccess ? ActionStatus.SUCCESS : ActionStatus.FAIL,
  });
};

export const handleSignOutEvent = () => {
  const signOutStatus = getSignOutStatus();

  if (signOutStatus !== ActionStatus.SUCCESS && signOutStatus !== ActionStatus.FAIL) return;

  const isSuccess = signOutStatus === ActionStatus.SUCCESS;
  sendSignOutEvent(isSuccess);
  removeUrlParam(SIGN_OUT_STATUS);
};
