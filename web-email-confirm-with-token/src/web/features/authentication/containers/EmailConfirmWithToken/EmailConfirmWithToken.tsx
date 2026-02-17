import React, { useEffect } from 'react';

import { EMAIL_VERIFICATION_INVALID_TOKEN, EMAIL_VERIFICATION_UNKNOWN } from 'common/constants/error-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { checkEmailConfirmToken } from 'common/features/authentication/api/auth';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { useAppDispatch } from 'common/hooks/useAppDispatch';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { EMAIL_VERIFICATION_FAIL } from 'web/components/TubiNotifications/emailVerificationFail';
import { EMAIL_VERIFICATION_SUCCESS } from 'web/components/TubiNotifications/notificationTypes';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

type RouteParams = {
  token: string;
};

const EmailConfirmWithToken: TubiContainerFC<Props, RouteParams> = ({
  params,
}) => {
  const { token } = params;
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(checkEmailConfirmToken(token)).then(() => {
      tubiHistory.replace(`${WEB_ROUTES.home}?notify=${EMAIL_VERIFICATION_SUCCESS.queryShortHand}`);
    }).catch((err) => {
      const statusCode = err.status;
      // 400 is an expected error response for invalid token
      if (statusCode === 400) {
        logger.info({ err }, EMAIL_VERIFICATION_INVALID_TOKEN);
      } else {
        logger.error({ err }, EMAIL_VERIFICATION_UNKNOWN);
      }
      tubiHistory.replace(`${WEB_ROUTES.home}?notify=${EMAIL_VERIFICATION_FAIL.queryShortHand}`);
    });
  }, [dispatch, token]);
  return <></>;
};

export default EmailConfirmWithToken;
