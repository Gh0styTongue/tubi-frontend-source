import { defineMessages } from 'react-intl';

import { resendEmailConfirmation } from 'common/features/authentication/actions/auth';
import type { NotificationEvent } from 'web/components/TubiNotifications/notificationTypes';

const messages = defineMessages({
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
});

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

