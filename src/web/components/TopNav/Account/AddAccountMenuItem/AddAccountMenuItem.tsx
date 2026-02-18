import { PlusStroke } from '@tubitv/icons';
import React, { memo, useCallback } from 'react';
import type { FC } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import styles from './AddAccountMenuItem.scss';

interface AddAccountMenuItemProps {
  /** Callback fired when the menu item is clicked or activated */
  onClick: () => void;
  /** Whether to show the subtitle text "For adults and kids" */
  showSubtitle: boolean;
  /** Whether to show the FREE badge */
  showFreeBadge: boolean;
}

const messages = defineMessages({
  addAccount: {
    id: 'web.topnav.account.addAccount',
    description: 'add account menu option',
    defaultMessage: 'Add Account',
  },
  addAccountSubtitle: {
    id: 'web.topnav.account.addAccountSubtitle',
    description: 'subtitle for add account option explaining it supports adults and kids',
    defaultMessage: 'For adults and kids',
  },
  free: {
    id: 'web.topnav.account.free',
    description: 'FREE badge for add account option',
    defaultMessage: 'FREE',
  },
});

const AddAccountMenuItem: FC<AddAccountMenuItemProps> = ({
  onClick,
  showSubtitle,
  showFreeBadge,
}) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    /* istanbul ignore else */
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      className={styles.addAccountItem}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Add new account"
      data-test-id="add-account-menu-item"
    >
      <PlusStroke className={styles.plusIcon} />
      <div className={styles.textContainer}>
        <span className={styles.title}>
          <FormattedMessage {...messages.addAccount} />
        </span>
        {showSubtitle && (
          <span className={styles.subtitle}>
            <FormattedMessage {...messages.addAccountSubtitle} />
          </span>
        )}
      </div>
      {showFreeBadge && (
        <div className={styles.freeBadge}>
          <FormattedMessage {...messages.free} />
        </div>
      )}
    </div>
  );
};

export default memo(AddAccountMenuItem);
