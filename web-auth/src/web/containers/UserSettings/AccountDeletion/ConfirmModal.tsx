import { TextInput } from '@tubitv/web-ui';
import type { ChangeEventHandler, FC } from 'react';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import styles from './AccountDeletion.scss';

const messages = defineMessages({
  title: {
    description: 'confirm delete account modal title',
    defaultMessage: 'One last step',
  },
  enterPass: {
    description: 'confirm delete account modal enter password',
    defaultMessage: 'Enter your password below to delete your account.',
  },
  password: {
    description: 'Password input label',
    defaultMessage: 'Password',
  },
});

const ConfirmModal: FC<{
  passValue: string,
  confirmError?: string,
  handlePassChange: ChangeEventHandler<HTMLInputElement>,
}> = ({ passValue, confirmError, handlePassChange }) => {
  const intl = useIntl();
  return (
    <div className={styles.lastModal}>
      <h1 className={styles.title}><FormattedMessage {...messages.title} /></h1>
      <div className={styles.text}>
        <FormattedMessage {...messages.enterPass} />
      </div>
      <TextInput
        canShowPassword
        containerClass={styles.inputContainer}
        label={intl.formatMessage(messages.password)}
        type="password"
        name="password"
        value={passValue}
        onChange={handlePassChange}
        error={confirmError}
      />
    </div>
  );
};

export default ConfirmModal;
