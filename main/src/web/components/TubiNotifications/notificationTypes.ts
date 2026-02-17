import { defineMessages } from 'react-intl';

import { resendEmailConfirmation } from 'common/features/authentication/actions/auth';
import type { Notification } from 'common/types/ui';

const messages = defineMessages({
  evsTitle: {
    description: 'email verification toast notification title',
    defaultMessage: 'Email Verified!',
  },
  evsDesc: {
    description: 'email verification toast notification description',
    defaultMessage: 'Thanks for verifying your email address.',
  },
  evfTitle: {
    description: 'email verification failed toast notification title',
    defaultMessage: 'Email Not Verified!',
  },
  evfDesc: {
    description: 'email verification failed toast notification description',
    defaultMessage: 'There was a technical issue verifying your email address. Please try again. If you wish, you may receive a new verification email.',
  },
  evfButton: {
    description: 'email verification failed toast notification button text',
    defaultMessage: 'Close',
  },
  evfButtonTwo: {
    description: 'email verification failed toast notification button text',
    defaultMessage: 'Resend Email',
  },
  changePwTitle: {
    description: 'change password toast notification title',
    defaultMessage: 'Success',
  },
  changePwDesc: {
    description: 'change password toast notification description',
    defaultMessage: 'Password was successfully set',
  },
  googleDesc: {
    description: 'google auth failed toast notification description',
    defaultMessage: 'Use another method for signing-in',
  },
  googleTitle: {
    description: 'google auth failed toast notification title',
    defaultMessage: 'Error with Google sign-in',
  },
  googleButton: {
    description: 'google auth failed toast notification button text',
    defaultMessage: 'Close',
  },
  kidsModeLockTitle: {
    description: 'title',
    defaultMessage: 'Welcome to Tubi Kids',
  },
  kidsModeLockDesc: {
    description: 'description',
    defaultMessage: 'You are only elligible to view Tubi Kids',
  },
  kidsModeLockButton: {
    description: 'button1',
    defaultMessage: 'Got it',
  },
  cannotExitKidsModeTitle: {
    description: 'title',
    defaultMessage: 'Cannot Exit Kids Mode',
  },
  cannotExitKidsModeDesc: {
    description: 'description',
    defaultMessage: 'Please try again in 24 hours. Questions? Contact support at www.tubi.tv/support',
  },
  cannotExitKidsModeButton: {
    description: 'button1',
    defaultMessage: 'Close',
  },
  guestModeLockTitle: {
    description: 'title for guest mode notification',
    defaultMessage: 'Welcome to Tubi, Guest',
  },
  guestModeLockDesc: {
    description: 'description for guest mode notification',
    defaultMessage: 'You are not eligible to create an account. Enjoy Tubi in Guest mode!',
  },
  guestModeLockButton: {
    description: 'button text for guest mode notification',
    defaultMessage: 'Got it',
  },
});

/**
 * Similar to eventTypes but for pre-set notification objects
 * each notificationType has a queryShortHand that is used to execute the notification on direct visit:
 * const emailVerificationFailed = notificationTypes.EMAIL_VERIFICATION_FAIL.queryShortHand;
 * `tubitv.com/?notify=${emailVerificationFailed}`
 */

interface NotificationEvent {
  queryShortHand?: string;
  notification: Notification;
}

export const EMAIL_VERIFICATION_SUCCESS: NotificationEvent = {
  queryShortHand: 'EVS',
  notification: {
    status: 'success',
    title: messages.evsTitle,
    description: messages.evsDesc,
  },
};

export const EMAIL_VERIFICATION_FAIL: NotificationEvent = {
  queryShortHand: 'EVF',
  notification: {
    status: 'warning',
    title: messages.evfTitle,
    description: messages.evfDesc,
    autoDismiss: false,
    buttons: [
      {
        title: messages.evfButton,
      },
      {
        title: messages.evfButtonTwo,
        primary: true,
        needsDispatch: true,
        action: resendEmailConfirmation,
      },
    ],
  },
};

export const CHANGE_PASSWORD_SUCCESS: NotificationEvent = {
  notification: {
    status: 'success',
    title: messages.changePwTitle,
    description: messages.changePwDesc,
  },
};

export const GOOGLE_AUTH_FAILED: NotificationEvent = {
  notification: {
    status: 'alert',
    description: messages.googleDesc,
    title: messages.googleTitle,
    autoDismiss: false,
    buttons: [
      {
        title: messages.googleButton,
        primary: true,
      },
    ],
  },
};

export const KIDS_MODE_ONLY: Notification = {
  status: 'info',
  title: messages.kidsModeLockTitle,
  description: messages.kidsModeLockDesc,
  autoDismiss: false,
  withShadow: true,
  buttons: [
    {
      title: messages.kidsModeLockButton,
      primary: true,
    },
  ],
};

export const GUEST_MODE_ONLY: Notification = {
  status: 'info',
  title: messages.guestModeLockTitle,
  description: messages.guestModeLockDesc,
  autoDismiss: false,
  withShadow: true,
  buttons: [
    {
      title: messages.guestModeLockButton,
      primary: true,
    },
  ],
};

export const CANNOT_EXIT_KIDS_MODE: Notification = {
  status: 'info',
  title: messages.cannotExitKidsModeTitle,
  description: messages.cannotExitKidsModeDesc,
  autoDismiss: false,
  withShadow: true,
  buttons: [
    {
      title: messages.cannotExitKidsModeButton,
      primary: true,
    },
  ],
};
