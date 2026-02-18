import { parseQueryString, getQueryStringFromUrl } from '@adrise/utils/lib/queryString';
import { ActionStatus, Manipulation, Messages, UserType } from '@tubitv/analytics/lib/authEvent';

import {
  ACTIVATION_CODE_QUERY_PARAM, ACTIVATION_FLOW_QUERY_PARAM, COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import type { AuthError } from 'common/features/authentication/types/auth';
import { trackAccountEvent } from 'common/utils/analytics';

/*
 * Util function for activation device flow:
 * Activation for guest (See ActivationFirst):
 *   1. input activate code -> 2. register/login -> 3. redirect to /activate?code=[code]&referer=activate_first
 * If step 2 fails (like because of coppa), user wouldn't be able continue the activation.
 *
 * This function tracks the RegisterDevice account event,
 * so that we could analyse how many activation fails due to specific errors.
 */
export function onActivateDeviceFlowFail(error: AuthError, loginRedirect: string) {
  const redirectParams = parseQueryString(getQueryStringFromUrl(loginRedirect));
  if (redirectParams[ACTIVATION_FLOW_QUERY_PARAM] && redirectParams[ACTIVATION_CODE_QUERY_PARAM]) {
    if (COPPA_ERROR_STATUS_CODES.includes(error.status)) {
      trackAccountEvent({
        manip: Manipulation.REGISTER_DEVICE,
        userType: UserType.UNKNOWN_USER_TYPE,
        status: ActionStatus.FAIL,
        message: Messages.COPPA_FAIL,
      });
    }
  }
}

