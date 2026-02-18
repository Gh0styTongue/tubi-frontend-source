import { Account24, Settings } from '@tubitv/icons';
import classnames from 'classnames';
import React, { memo, useCallback } from 'react';
import type { FC } from 'react';

import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import type { UserOrKid } from 'common/features/authentication/types/auth';
import { formatAccountName } from 'common/features/authentication/utils/auth';
import { checkIsKidAccount } from 'common/features/authentication/utils/user';

import styles from './AccountMenuItem.scss';

interface AccountMenuItemProps {
  /** The user or kid account to display */
  account: Pick<UserOrKid, 'name' | 'avatarUrl' | 'parentTubiId'>;
  /** Whether this account is currently active */
  isActive?: boolean;
  /** Callback fired when the menu item is clicked or activated */
  onClick: () => void;
  /** Whether to show the settings icon (only shown for active accounts) */
  showSettings?: boolean;
  /** Whether this is a guest account (displays special guest icon) */
  isGuest?: boolean;
}

const AccountMenuItem: FC<AccountMenuItemProps> = ({
  account,
  isActive = false,
  onClick,
  showSettings = false,
  isGuest = false,
}) => {
  const isKidAccount = checkIsKidAccount(account);
  const name = formatAccountName(account.name);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    /* istanbul ignore else */
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      className={classnames(styles.accountMenuItem, {
        [styles.active]: isActive,
      })}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Switch to ${name}${isKidAccount ? ' (Kids account)' : ''}${isGuest ? ' (Guest)' : ''}`}
      data-test-id="account-menu-item"
    >
      {isGuest ? (
        <Account24 className={styles.guestIcon} />
      ) : (
        <Avatar name={name} avatarUrl={account.avatarUrl} size="xs" avatarClass={styles.avatar} />
      )}
      <div className={styles.accountInfo}>
        <span className={styles.name}>{name}</span>
        {isKidAccount && <Tubi className={styles.tubiKidsLogo} isKidsModeEnabled />}
      </div>
      {showSettings && isActive && <Settings className={styles.settingsIcon} aria-label="Settings" />}
    </div>
  );
};

export default memo(AccountMenuItem);
