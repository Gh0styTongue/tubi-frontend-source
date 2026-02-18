import { Button } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { formatAccountName } from 'common/features/authentication/utils/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector } from 'common/selectors/userSettings';
import BaseModal from 'web/components/BaseModal/BaseModal';

import styles from './UnmuteModal.scss';

const messages = defineMessages({
  title: {
    description: 'unmute modal title',
    defaultMessage: 'Welcome, {firstName}',
  },
  description: {
    description: 'unmute modal description',
    defaultMessage: 'Your playback is resumed.',
  },
  unmuteButton: {
    description: 'unmute button text',
    defaultMessage: 'Got it',
  },
});

interface UnmuteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnmuteModal: React.FC<UnmuteModalProps> = ({ isOpen, onClose }) => {
  const intl = useIntl();
  const firstName = useAppSelector(firstNameSelector);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      modalContainerClassName={styles.unmuteModalContainer}
      modalContentClassName={styles.unmuteModalContent}
    >
      <h2 className={styles.unmuteModalTitle}>
        {intl.formatMessage(messages.title, { firstName: formatAccountName(firstName) })}
      </h2>
      <p className={styles.unmuteModalDescription}>
        {intl.formatMessage(messages.description)}
      </p>
      <Button onClick={onClose} className={styles.unmuteModalButton}>
        {intl.formatMessage(messages.unmuteButton)}
      </Button>
    </BaseModal>
  );
};

export default UnmuteModal;
