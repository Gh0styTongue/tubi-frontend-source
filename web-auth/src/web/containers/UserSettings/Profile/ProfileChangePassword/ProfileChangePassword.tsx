import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import profileStyles from 'web/containers/UserSettings/Profile/Profile.scss';
import ChangePassword from 'web/features/authentication/containers/ChangePassword/ChangePassword';

import styles from './ProfileChangePassword.scss';
import sharedStyles from '../../UserSettings.scss';

const messages = defineMessages({
  changePw: {
    description: 'change password heading text',
    defaultMessage: 'Change Password',
  },
});

const ProfileChangePassword: React.FC = () => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames(sharedStyles.main, profileStyles.main)}>
      <h2 className={sharedStyles.header}>{formatMessage(messages.changePw)}</h2>
      <div className={styles.contentContainer}>
        <ChangePassword />
      </div>
    </div>
  );
};

export default ProfileChangePassword;
