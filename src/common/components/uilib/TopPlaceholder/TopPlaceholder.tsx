import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { isMultipleAccountsEnabledSelector } from 'common/features/authentication/selectors/multipleAccounts';
import useAppSelector from 'common/hooks/useAppSelector';

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
  fixed?: boolean;
}

const getRightSideLinks = (login: boolean, register: boolean, redirect: string, isMultipleAccountsEnabled: boolean) => {
  // for multiple accounts, we show the add account link instead of the sign in or register links
  // signIn will redirect to the add account page, check helpers/routing.ts for more details
  if (isMultipleAccountsEnabled && (login || register)) {
    const to = redirect ? addQueryStringToUrl(WEB_ROUTES.signIn, { redirect }) : WEB_ROUTES.signIn;
    return (
      <Link to={to} className={styles.rightLink}>
        <FormattedMessage {...messages.signIn} />
      </Link>
    );
  }
  const links = [];
  if (register) {
    const to = redirect ? addQueryStringToUrl(WEB_ROUTES.register, { redirect }) : WEB_ROUTES.register;
    links.push(
      <Link key="register" to={to} className={styles.rightLink}>
        <FormattedMessage {...messages.register} />
      </Link>
    );
  }
  if (login) {
    const to = redirect ? addQueryStringToUrl(WEB_ROUTES.signIn, { redirect }) : WEB_ROUTES.signIn;
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
  fixed = true,
}) => {
  const isMultipleAccountsEnabled = useAppSelector(isMultipleAccountsEnabledSelector);
  return (
    <div className={classNames(styles.topPlaceholder, {
      [styles.transparentBackground]: invert,
      [styles.fixed]: fixed,
    })}
    >
      {
        logo ? (
          <Link to={WEB_ROUTES.home} className={styles.logo}>
            <Tubi className={styles.logoIcon} />
          </Link>
        ) : null
      }
      <div className={styles.rightLinks}>{getRightSideLinks(login, register, redirect, isMultipleAccountsEnabled)}</div>
    </div>
  );
};

export default TopPlaceholder;
