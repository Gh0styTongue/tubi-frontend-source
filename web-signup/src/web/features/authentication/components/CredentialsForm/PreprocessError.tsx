import { ErrorMessage } from '@tubitv/web-ui';
import React from 'react';
import type { IntlFormatters } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import credentialsFormMessages from 'web/features/authentication/components/CredentialsForm/credentialsFormMessages';
import authMessages from 'web/features/authentication/constants/auth-message';

import styles from './CredentialsForm.scss';

interface FormStatus {
  formError: {
    message: string;
  };
  emailExists: boolean;
}

interface Props {
  formatMessage: IntlFormatters['formatMessage'];
  signInLink: string;
  status: FormStatus;
}

const PreprocessError = ({ formatMessage, signInLink, status }: Props) => {
  let content: React.ReactNode | string;
  if (status.emailExists) {
    content = (
      <span>
        {formatMessage(authMessages.emailUserAlreadyExists)}{' '}
        {formatMessage(credentialsFormMessages.signInOrRegister, {
          signInLink: ([msg]) => (
            <Link className={styles.link} to={signInLink}>
              {msg}
            </Link>
          ),
          resetPasswordLink: ([msg]) => (
            <Link className={styles.link} to={WEB_ROUTES.forgotPassword}>
              {msg}
            </Link>
          ),
        })}
      </span>
    );
  }
  return <ErrorMessage message={content} />;
};

export default PreprocessError;
