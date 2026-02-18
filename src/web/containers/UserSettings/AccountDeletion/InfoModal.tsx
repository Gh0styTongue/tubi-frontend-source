import { AlertFilled24 } from '@tubitv/icons';
import type { FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import type { Kid, AvatarUrl } from 'common/features/authentication/types/auth';
import { formatAccountName } from 'common/features/authentication/utils/auth';

import styles from './AccountDeletion.scss';

export const messages = defineMessages({
  title: {
    description: 'delete all accounts modal title',
    defaultMessage: 'Deleting your account affects linked Kids Accounts',
  },
  description: {
    description: 'delete all accounts modal description',
    defaultMessage: 'As the Parent, deleting your account will also delete all linked Kids Accounts.',
  },
  parentLabel: {
    description: 'Parent label',
    defaultMessage: 'Parent',
  },
  kidLabel: {
    description: 'Kid label',
    defaultMessage: 'Kid',
  },
});

interface InfoModalProps {
  firstName?: string;
  kids: Kid[];
  userAvatarUrl?: AvatarUrl;
}

const AccountItem: FC<{ name?: string, label: string, avatarUrl?: AvatarUrl }> = ({ name, label, avatarUrl }) => {
  const formattedName = formatAccountName(name);
  return (
    <div className={styles.accountItem}>
      <Avatar name={formattedName} size="xs" avatarUrl={avatarUrl} />
      {/* eslint-disable-next-line react/jsx-no-literals */}
      <div className={styles.label}>{`${formattedName} (${label})`}</div>
    </div>
  );
};

const InfoModal: FC<InfoModalProps> = ({ firstName, kids, userAvatarUrl }) => {
  const intl = useIntl();
  return (
    <div className={styles.infoModal}>
      {/* eslint-disable-next-line react/forbid-component-props */}
      <AlertFilled24 className={styles.alertIcon} />
      <h1 className={styles.title}>{intl.formatMessage(messages.title)}</h1>
      <div className={styles.text}>{intl.formatMessage(messages.description)}</div>
      <div className={styles.accountList}>
        <AccountItem name={firstName} label={intl.formatMessage(messages.parentLabel)} avatarUrl={userAvatarUrl} />
        {kids.map(({ name, tubiId, avatarUrl }) => (
          <AccountItem key={tubiId} name={name} label={intl.formatMessage(messages.kidLabel)} avatarUrl={avatarUrl} />
        ))}
      </div>
    </div>
  );
};

export default InfoModal;
