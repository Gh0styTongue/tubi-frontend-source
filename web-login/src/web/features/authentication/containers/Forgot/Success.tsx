import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from './Forgot.scss';

export const messages = defineMessages({
  message: {
    description: 'back to sign in button text',
    defaultMessage: 'Back to Sign In',
  },
});

interface Props {
  loginRedirect?: string | string[] | null;
}

export default function ResetSuccess({ loginRedirect }: Props) {
  let loginLink = WEB_ROUTES.signIn;
  if (loginRedirect) {
    loginLink += `?redirect=${encodeURIComponent(loginRedirect as string)}`;
  }
  return (
    <div data-test-id="resetSuccess">
      <Link to={loginLink} className={styles.successLink}>
        <FormattedMessage {...messages.message} />
      </Link>
    </div>
  );
}
