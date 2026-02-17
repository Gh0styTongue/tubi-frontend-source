import classNames from 'classnames';
import type { Location } from 'history';
import type { PropsWithChildren } from 'react';
import React, { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { shouldShowParentalRatingsSelector } from 'common/features/coppa/selectors/coppa';
import consentMessages from 'common/features/gdpr/messages';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import Footer from 'web/components/Footer/Footer';

import styles from './UserSettings.scss';

const messages = defineMessages({
  profile: {
    description: 'account settings tab title',
    defaultMessage: 'Profile',
  },
  parental: {
    description: 'account settings tab title',
    defaultMessage: 'Parental Controls',
  },
  notifications: {
    description: 'account settings tab title',
    defaultMessage: 'Notifications',
  },
  history: {
    description: 'account settings tab title',
    defaultMessage: 'Continue Watching & My List',
  },
  subtitles: {
    description: 'account settings tab title',
    defaultMessage: 'Subtitles & Appearance',
  },
});

interface UserSettingsProps {
  location: Location;
}

const ACCOUNT_ROUTES = [
  {
    element: <FormattedMessage {...messages.profile} />,
    key: 'profile',
    path: WEB_ROUTES.account,
  },
  {
    element: <FormattedMessage {...messages.parental} />,
    key: 'parental controls',
    path: WEB_ROUTES.parentalControl,
  },
  {
    element: <FormattedMessage {...messages.notifications} />,
    key: 'notifications',
    path: WEB_ROUTES.accountNotification,
  },
  {
    element: <FormattedMessage {...messages.history} />,
    key: 'history & my list',
    unavailableForMajorEventFailsafe: true,
    path: WEB_ROUTES.accountHistory,
  },
  {
    element: <FormattedMessage {...messages.subtitles} />,
    key: 'subtitles & appearance',
    path: WEB_ROUTES.customCaptions,
    openInNewTab: true,
  },
  {
    element: <FormattedMessage {...consentMessages.privacyCenter} />,
    key: 'privacy center',
    availableForGuest: true,
    path: WEB_ROUTES.accountPrivacyCenter,
  },
];

/*
 * This component is parent of all the User Settings components, and the accordion
 * Each child component is connected and handles its own state
 * Parent (through router) helps govern what is displayed with this.props.children
 */
const UserSettings = ({ children, location: { pathname } }: PropsWithChildren<UserSettingsProps>) => {
  const { scrolledToTop } = useAppSelector((state) => state.ui);
  const isPrivacyEnabled = useAppSelector(isGDPREnabledSelector);
  const shouldShowParentalRatings = useAppSelector(shouldShowParentalRatingsSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);

  let navItems = ACCOUNT_ROUTES;
  if (isMajorEventFailsafe) {
    navItems = ACCOUNT_ROUTES.filter(({ unavailableForMajorEventFailsafe }) => !unavailableForMajorEventFailsafe);
  }
  if (!isLoggedIn) {
    navItems = ACCOUNT_ROUTES.filter(({ availableForGuest }) => !!availableForGuest);
  }
  navItems = navItems.filter(({ path }) => {
    if (path === WEB_ROUTES.accountPrivacyCenter) {
      return isPrivacyEnabled;
    }
    if (path === WEB_ROUTES.parentalControl) {
      return shouldShowParentalRatings;
    }
    return true;
  });

  const activeIdx = useMemo(() => {
    return navItems.findIndex(({ path }) => {
      return path === pathname;
    });
  }, [pathname, navItems]);

  const navBar = navItems.length > 1 ? (
    <ul className={classNames(styles.navBar, { [styles.withBackground]: !scrolledToTop })}>
      {navItems.map(({ element, key, path, openInNewTab }, idx) => {
        const isActive = idx === activeIdx;
        return (
          <li className={styles.navBarItem} key={key}>
            <Link
              className={classNames(styles.navBarLink, { [styles.active]: isActive })}
              to={path}
              target={openInNewTab ? '_blank' : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {element}
            </Link>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div data-test-id="user-settings-refresh">
      <div className={styles.content}>
        {navBar}
        {children}
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default UserSettings;
