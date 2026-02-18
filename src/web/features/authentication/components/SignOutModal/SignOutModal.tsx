import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import { Button } from '@tubitv/web-ui';
import React, { useCallback, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DIALOG } from 'common/constants/event-types';
import useAppSelector from 'common/hooks/useAppSelector';
import { userKidsSelector } from 'common/selectors/userSettings';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import BaseModal from 'web/components/BaseModal/BaseModal';
import UserItem from 'web/features/authentication/components/UserItem/UserItem';

import styles from './SignOutModal.scss';

const messages = defineMessages({
  title: {
    description: 'Sign out modal title when user has linked kids accounts',
    defaultMessage: 'Signing out will log out all kids accounts',
  },
  signOut: {
    description: 'Sign out button text',
    defaultMessage: 'Sign Out',
  },
  cancel: {
    description: 'Cancel button text',
    defaultMessage: 'Cancel',
  },
});

export interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

const SignOutModal = ({ isOpen, onClose, onSignOut }: SignOutModalProps) => {
  const { formatMessage } = useIntl();
  const kids = useAppSelector(userKidsSelector);
  const currentPathname = getCurrentPathname();

  useEffect(() => {
    if (isOpen) {
      trackEvent(DIALOG, buildDialogEvent(currentPathname, DialogType.SIGN_OUT, 'sign_out', DialogAction.SHOW));
    }
  }, [isOpen, currentPathname]);

  const handleSignOut = useCallback(() => {
    trackEvent(DIALOG, buildDialogEvent(currentPathname, DialogType.SIGN_OUT, 'sign_out', DialogAction.ACCEPT_DELIBERATE));
    onSignOut();
  }, [currentPathname, onSignOut]);

  const handleClose = useCallback(() => {
    trackEvent(DIALOG, buildDialogEvent(currentPathname, DialogType.SIGN_OUT, 'sign_out', DialogAction.DISMISS_DELIBERATE));
    onClose();
  }, [currentPathname, onClose]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      modalContainerClassName={styles.signOutModal}
      dataNoSnippet
    >
      <h1 className={styles.title}>{formatMessage(messages.title)}</h1>

      {kids && kids.length > 0 && (
        <ul className={styles.kidsList}>
          {kids.map((kid) => (
            <li key={kid.userId}>
              <UserItem user={kid} avatarSize="xs" layout="vertical" />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.buttonsContainer}>
        <Button
          appearance="primary"
          onClick={handleSignOut}
          className={styles.signOutButton}
        >
          {formatMessage(messages.signOut)}
        </Button>
        <Button
          appearance="secondary"
          onClick={handleClose}
          className={styles.cancelButton}
        >
          {formatMessage(messages.cancel)}
        </Button>
      </div>
    </BaseModal>
  );
};

export default SignOutModal;
