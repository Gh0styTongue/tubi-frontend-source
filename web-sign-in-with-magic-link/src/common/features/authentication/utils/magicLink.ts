import Analytics from '@tubitv/analytics';
import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import type { AnalyticsConfigProps } from '@tubitv/analytics/lib/baseTypes';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { Location } from 'history';

import { SET_LAST_MAGIC_LINK_UID } from 'common/constants/action-types';
import * as eventTypes from 'common/constants/event-types';
import { ottHandleActivateSuccess, registerErrorHandler } from 'common/features/authentication/actions/auth';
import {
  getMagicLinkStatus,
  getRegistrationLinkStatus,
  sendMagicLink,
  sendRegistrationLink,
} from 'common/features/authentication/api/auth';
import type { User } from 'common/features/authentication/types/auth';
import { getStatusRequestInterval } from 'common/features/authentication/utils/auth';
import { isAuthServerError, redirectToAuthErrorPage } from 'common/features/authentication/utils/error';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { actionWrapper } from 'common/utils/action';
import { buildDialogEvent, trackAccountEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

const SEND_EMAIL_COOL_DOWN_TIME_IN_MS = 20_000;
const SEND_EMAIL_MAX_COUNT = 3;
const EMAIL_SENT_FADE_TIME_IN_MS = 5_000;
const MAX_FAILED_ATTEMPTS = 4;

export interface SignInWithMagicLinkObservablesParams {
  dispatch: TubiThunkDispatch;
  email: string | undefined;
  lastMagicLinkUID?: string | null;
  forRegistration?: boolean;
  onSuccessfulLogin(result: User): void;
  onSendEmailError(): void;
  onCheckStatusError(): void;
  onTooManyAttempts(): void;
  onShowEmailSent(show: boolean): void;
  location: Location;
  isMajorEventActive?: boolean;
}

export const createSignInWithMagicLinkObservables = ({
  dispatch,
  email,
  lastMagicLinkUID,
  forRegistration,
  onSuccessfulLogin,
  onTooManyAttempts,
  onSendEmailError,
  onCheckStatusError,
  onShowEmailSent,
  location,
  isMajorEventActive = false,
}: SignInWithMagicLinkObservablesParams) => {
  let destroyed = false;
  let sendEmailCoolDownTimeout: undefined | ReturnType<typeof setTimeout>;
  let sendEmailIntervalTimeout: undefined | ReturnType<typeof setTimeout>;
  let tryRegisterAgainTimeout: undefined | ReturnType<typeof setTimeout>;
  let showEmailSentFadeTimeout: undefined | ReturnType<typeof setTimeout>;
  let sendEmailCount = 0;

  const statusRequestInterval = getStatusRequestInterval(isMajorEventActive);

  function destroy(): void {
    destroyed = true;
    clearTimeout(sendEmailCoolDownTimeout);
    clearTimeout(sendEmailIntervalTimeout);
    clearTimeout(tryRegisterAgainTimeout);
    clearTimeout(showEmailSentFadeTimeout);
    sendEmailCoolDownTimeout = undefined;
    sendEmailIntervalTimeout = undefined;
    tryRegisterAgainTimeout = undefined;
    showEmailSentFadeTimeout = undefined;
  }

  function startPolling(uid: string) {
    let failedAttemptCounts = 0;
    clearTimeout(sendEmailIntervalTimeout);
    clearTimeout(tryRegisterAgainTimeout);

    function onRegistered(result: User) {
      const promise = __WEBPLATFORM__ === 'WEB' ? Promise.resolve() : dispatch(ottHandleActivateSuccess(location, result));
      promise.then(() => {
        Analytics.mergeConfig(
          (): AnalyticsConfigProps => ({
            user_id: `${result.userId}`,
            auth_type: result.authType,
          }),
        );
        trackAccountEvent({
          manip: Manipulation.SIGNIN,
          current: 'EMAIL',
          message: Messages.SUCCESS,
          status: ActionStatus.SUCCESS,
        });
        onSuccessfulLogin(result);
      }).catch((err) => {
        failedAttemptCounts++;
        if (isAuthServerError(err, isMajorEventActive)) {
          redirectToAuthErrorPage(err, { type: 'magicLink' });
        } else if (failedAttemptCounts === MAX_FAILED_ATTEMPTS) {
          onSendEmailError();
        } else {
          tryRegisterAgainTimeout = setTimeout(() => onRegistered(result), statusRequestInterval);
        }
      });
    }

    function mainEmailInterval() {
      sendEmailIntervalTimeout = setTimeout(() => {
        const checkStatusAction = forRegistration ? getRegistrationLinkStatus : getMagicLinkStatus;
        dispatch(checkStatusAction(uid)).then((result) => {
          if (result.status === 'REGISTERED') {
            onRegistered(result);
          } else {
            mainEmailInterval();
          }
        }).catch((error: any) => {
          if (error.statusCode === 404) {
            onCheckStatusError();
            return;
          }

          if (forRegistration) {
            try {
              dispatch(registerErrorHandler({ error }));
            } catch (e) {
              // noop
            }
            return;
          }
          mainEmailInterval();
        });
      }, statusRequestInterval);
    }
    mainEmailInterval();
  }

  function sendEmail(isByUser: boolean) {
    if (sendEmailCount >= SEND_EMAIL_MAX_COUNT || sendEmailCoolDownTimeout !== undefined) {
      onTooManyAttempts();
      return;
    }
    if (!email) return;
    const sendEmailAction = forRegistration ? sendRegistrationLink : sendMagicLink;
    dispatch(sendEmailAction(email))
      .then((uid) => {
        sendEmailCount++;
        sendEmailCoolDownTimeout = setTimeout(() => {
          sendEmailCoolDownTimeout = undefined;
        }, SEND_EMAIL_COOL_DOWN_TIME_IN_MS);
        dispatch(actionWrapper(SET_LAST_MAGIC_LINK_UID, { lastMagicLinkUID: uid }));
        if (isByUser) {
          if (!destroyed) {
            onShowEmailSent(true);
            showEmailSentFadeTimeout = setTimeout(() => onShowEmailSent(false), EMAIL_SENT_FADE_TIME_IN_MS);
          }
          const eventObj = buildDialogEvent(
            getCurrentPathname(),
            DialogType.LOGIN_REQUEST,
            'resend_link',
            DialogAction.SHOW
          );
          trackEvent(eventTypes.DIALOG, eventObj);
        }

        if (!uid) {
          return;
        }

        startPolling(uid);
      })
      .catch((error) => {
        if (isAuthServerError(error, isMajorEventActive)) {
          return redirectToAuthErrorPage(error, { type: 'magicLink' });
        }
        if (error.statusCode === 429) {
          onTooManyAttempts();
        } else {
          onSendEmailError();
        }
      });
  }

  if (lastMagicLinkUID) {
    startPolling(lastMagicLinkUID);
  }

  return {
    sendEmail,
    destroy,
  };
};
