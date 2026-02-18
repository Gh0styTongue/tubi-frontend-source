import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { Manipulation, Messages, ActionStatus } from '@tubitv/analytics/lib/authEvent';

import { setShowToastForMobileToOTTSignIn } from 'common/actions/ui';
import { LOAD_AUTH_SUCCESS } from 'common/constants/action-types';
import type { TransferUserParams } from 'common/features/authentication/api/transferUser';
import { transferUser } from 'common/features/authentication/api/transferUser';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import type { TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { trackAccountEvent } from 'common/utils/analytics';
import { hasNil } from 'common/utils/nil';
import { getUrlParam } from 'common/utils/urlManipulation';

const updateQueryString = () => {
  const queryParams = { ...getUrlParam() };
  [
    'from_device_id',
    'from_platform',
    'refresh_token',
    'user_id',
    'allowSignIn',
  ].forEach(param => delete queryParams[param]);
  const { pathname } = tubiHistory.getCurrentLocation();
  const updatedPath = addQueryStringToUrl(pathname, queryParams);
  tubiHistory.replace(updatedPath);
};

export const checkTransferUser = async (store: TubiStore) => {
  const { dispatch, getState } = store;
  const {
    allowSignIn,
    from_device_id: fromDeviceId,
    from_platform: fromPlatform,
    refresh_token: refreshToken,
    user_id,
  } = getUrlParam();

  if (allowSignIn !== 'true') {
    return;
  }

  const userId = parseInt(user_id as string, 10);
  if (hasNil(fromDeviceId, fromPlatform, refreshToken, userId) || isLoggedInSelector(getState())) {
    updateQueryString();
    return;
  }

  try {
    const user = await dispatch(transferUser({
      refreshToken,
      userId,
      fromDeviceId,
      fromPlatform,
    } as TransferUserParams));
    dispatch(actionWrapper(LOAD_AUTH_SUCCESS, { result: user }));
    trackAccountEvent({
      manip: Manipulation.SIGNIN,
      current: 'MOBILE_APP',
      message: Messages.SUCCESS,
      status: ActionStatus.SUCCESS,
    });
    dispatch(setShowToastForMobileToOTTSignIn(true));
  } catch (error) {
    trackAccountEvent({
      manip: Manipulation.SIGNIN,
      current: 'MOBILE_APP',
      message: Messages.AUTH_FAIL,
      status: ActionStatus.FAIL,
    });
  } finally {
    updateQueryString();
  }
};
