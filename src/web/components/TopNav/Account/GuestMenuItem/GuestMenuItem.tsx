import { Account24 } from '@tubitv/icons';
import React, { memo, useCallback } from 'react';
import type { FC } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import styles from './GuestMenuItem.scss';

interface GuestMenuItemProps {
  /** Callback fired when the guest menu item is clicked or activated */
  onClick: () => void;
}

const messages = defineMessages({
  guest: {
    id: 'web.topnav.account.guest',
    description: 'guest mode option in account menu',
    defaultMessage: 'Guest',
  },
});

const GuestMenuItem: FC<GuestMenuItemProps> = ({ onClick }) => {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    /* istanbul ignore else */
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      className={styles.guestItem}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Continue as guest"
      data-test-id="guest-menu-item"
    >
      <Account24 className={styles.guestIcon} />
      <span className={styles.text}>
        <FormattedMessage {...messages.guest} />
      </span>
    </div>
  );
};

export default memo(GuestMenuItem);
