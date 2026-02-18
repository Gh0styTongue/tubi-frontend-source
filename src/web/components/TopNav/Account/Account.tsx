import { ChevronCircleDown } from '@tubitv/icons';
import { useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { memo, useCallback, useContext, useRef, useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import type { User } from 'common/features/authentication/types/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { getLoginRedirect } from 'common/utils/urlConstruction';
import AccountDropdown from 'web/components/TopNav/Account/AccountDropdown/AccountDropdown';
import { TopNavContext } from 'web/components/TopNav/context';

import styles from './Account.scss';

const messages = defineMessages({
  greetingName: {
    description: 'greeting with user\'s name',
    defaultMessage: 'Hi, <customtag>{name}</customtag>',
  },
  defaultName: {
    description: 'default user name, if user has no name saved to profile',
    defaultMessage: 'User',
  },
  register: {
    description: 'register link',
    defaultMessage: 'Register',
  },
  signin: {
    description: 'sign in link',
    defaultMessage: 'Sign In',
  },
});

interface Props {
  inverted?: boolean;
}

const Account = ({ inverted }: Props) => {
  const intl = useIntl();
  const { viewportType } = useAppSelector((state) => state.ui);
  const isDesktop = viewportType === 'desktop';
  const isMobile = !isDesktop;
  const { showMobileAccountMenu, setShowMobileAccountMenu } = useContext(TopNavContext);

  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = !!user;
  const location = useLocation();
  const pathname = location?.pathname || '';
  const query = location?.query || {};
  const displayName = useAppSelector(
    (state) =>
      state.userSettings?.first_name
      || (user as User)?.name
      || intl.formatMessage(messages.defaultName)
  );

  const ref = useRef<HTMLDivElement | null>(null);
  const [hoverRef, isHovered] = useHover({
    delay: 200,
    skip: isMobile,
  });

  const combineRef = useCallback(
    (node: HTMLDivElement | null) => {
      hoverRef(node);
      ref.current = node;
    },
    [hoverRef],
  );
  const toggleDropdown = useCallback((e: MouseEvent) => {
    if (isMobile) {
      if (ref.current?.contains(e.target as Node)) {
        setShowMobileAccountMenu(!showMobileAccountMenu);
      } else {
        setShowMobileAccountMenu(false);
      }
    }
  }, [ref, setShowMobileAccountMenu, showMobileAccountMenu, isMobile]);

  useEffect(() => {
    document.addEventListener('click', toggleDropdown);
    return () => {
      document.removeEventListener('click', toggleDropdown);
    };
  }, [toggleDropdown]);

  useEffect(() => {
    setShowMobileAccountMenu(false);
  }, [location.pathname, setShowMobileAccountMenu]);

  if (!isLoggedIn) {
    return (
      <React.Fragment>
        <Link
          to={WEB_ROUTES.signIn + getLoginRedirect(pathname, query)}
          className={classnames(styles.signIn, { [styles.inverted]: inverted })}
          data-test-id="signIn"
        >
          <FormattedMessage {...messages.signin} />
        </Link>
        <Link
          to={WEB_ROUTES.register + getLoginRedirect(pathname, query)}
          className={classnames(styles.register, { [styles.inverted]: inverted })}
          data-test-id="register"
        >
          <FormattedMessage {...messages.register} />
        </Link>
      </React.Fragment>
    );
  }
  return (
    <div
      className={classnames(styles.account, { [styles.opened]: showMobileAccountMenu, [styles.inverted]: inverted })}
      ref={combineRef}
      data-test-id="greeting"
    >
      <FormattedMessage
        {...messages.greetingName}
        values={{
          name: displayName,
          customtag: ([msg]) => (
            <span data-test-id="userName" className={styles.name}>
              {msg}
            </span>
          ),
        }}
      />
      <ChevronCircleDown className={styles.chevronIcon} />
      <AccountDropdown show={isHovered || showMobileAccountMenu} isMobile={isMobile} />
    </div>
  );
};

export default memo(Account);
