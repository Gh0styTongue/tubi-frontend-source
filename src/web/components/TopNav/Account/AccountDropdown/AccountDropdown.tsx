import { Exit } from '@tubitv/icons';
import { useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { memo, useCallback } from 'react';
import Cookie from 'react-cookie';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { setLocalData } from 'client/utils/localDataStorage';
import { LD_DISABLE_ONE_TAP_AUTO_SELECT } from 'common/constants/constants';
import { COOKIE_IS_KIDS_MODE_ENABLED } from 'common/constants/cookies';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { logout } from 'common/features/authentication/actions/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { trackLogging } from 'common/utils/track';

import styles from './AccountDropdown.scss';

export const messages = defineMessages({
  accountSettings: {
    description: 'account settings menu link',
    defaultMessage: 'Account Settings',
  },
  helpCenter: {
    description: 'help center menu link',
    defaultMessage: 'Help Center',
  },
  activateDevice: {
    description: 'activate your device menu link',
    defaultMessage: 'Activate Your Device',
  },
  signOut: {
    description: 'sign out menu link',
    defaultMessage: 'Sign Out',
  },
});

interface AccountDropdownProps {
  show: boolean;
  isMobile: boolean;
}

const AccountDropdown: FC<AccountDropdownProps> = ({ show, isMobile }) => {
  // Don't hold it open on hover on mobile because we only receive the mouseenter event on tap, not the mouseleave.
  // The mouseleave event is only fired when the user taps outside the dropdown. This means the dropdown would stay
  // open even after clicking one of the links, which is not what we want.
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [ref, isHovered] = useHover({ delay: 200, skip: isMobile });

  const shouldShow = show || isHovered;
  const className = classnames(styles.accountDropdown, {
    [styles.show]: shouldShow,
  });

  const handleLogout = useCallback(() => {
    Cookie.remove(COOKIE_IS_KIDS_MODE_ENABLED);
    // https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out#sign-out
    // for google one tap, disable auto select to prevent login loop
    window.google?.accounts?.id.disableAutoSelect();
    // To prevent user from signing in again automatically after sign out,
    // set a flag to disable OneTap auto_select (Web/Components/OneTap) for 1 minute
    setLocalData(LD_DISABLE_ONE_TAP_AUTO_SELECT, 'true', 60);

    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'logoutClicked',
      message: {
        userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
        pageUrl: typeof window !== 'undefined' && window.location?.pathname,
      },
    });

    dispatch(logout(location, { isByUser: true, redirectPathAfterLogout: WEB_ROUTES.home }));
  }, [dispatch, location]);

  return (
    <div className={className} ref={ref}>
      <div className={styles.menuItemContainer}>
        <Link to={WEB_ROUTES.account} className={styles.menuItem} data-test-id="accountSettingsLink">
          <FormattedMessage {...messages.accountSettings} />
        </Link>
        <a className={styles.menuItem} href={WEB_ROUTES.helpCenter}>
          <FormattedMessage {...messages.helpCenter} />
        </a>
        <Link to={WEB_ROUTES.activate} className={styles.menuItem}>
          <FormattedMessage {...messages.activateDevice} />
        </Link>
      </div>
      <div className={styles.signOut}>
        <div className={styles.signOutButton} onClick={handleLogout}>
          <Exit />
          <FormattedMessage {...messages.signOut} />
        </div>
      </div>
    </div>
  );
};

export default memo(AccountDropdown);
