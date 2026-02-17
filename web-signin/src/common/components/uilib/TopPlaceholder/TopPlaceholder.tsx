import classNames from 'classnames';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import styles from './TopPlaceholder.scss';
import { WEB_ROUTES } from '../../../constants/routes';
import Tubi from '../SvgLibrary/Tubi';

export const messages = defineMessages({
  register: {
    description: 'text for reg cta',
    defaultMessage: 'Register',
  },
  signIn: {
    description: 'text for sign in cta',
    defaultMessage: 'Sign In',
  },
});

interface TopPlaceholderProps {
  invert?: boolean;
  login?: boolean;
  logo?: boolean;
  redirect?: string;
  register?: boolean;
}

const getRightSideLinks = (login: boolean, register: boolean, redirect: string) => {
  const links = [];
  if (register) {
    links.push(
      <Link key="register" to={WEB_ROUTES.register} className={styles.rightLink}>
        <FormattedMessage {...messages.register} />
      </Link>
    );
  }
  if (login) {
    let to = WEB_ROUTES.signIn;
    if (redirect) {
      to += `?redirect=${encodeURIComponent(redirect)}`;
    }
    links.push(
      <Link key="login" to={to} className={styles.rightLink}>
        <FormattedMessage {...messages.signIn} />
      </Link>
    );
  }

  return links;
};

const TopPlaceholder: React.FC<TopPlaceholderProps> = ({
  invert = false,
  login = false,
  logo = false,
  redirect = '',
  register = false,
}) => {
  return (
    <div className={classNames(styles.topPlaceholder, {
      [styles.transparentBackground]: invert,
    })}
    >
      {
        logo ? (
          <Link to={WEB_ROUTES.home} className={styles.logo}>
            <Tubi className={styles.logoIcon} />
          </Link>
        ) : null
      }
      <div className={styles.rightLinks}>{getRightSideLinks(login, register, redirect)}</div>
    </div>
  );
};

export default TopPlaceholder;
