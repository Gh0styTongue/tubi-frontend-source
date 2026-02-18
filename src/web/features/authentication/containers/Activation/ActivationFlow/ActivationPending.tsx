import classNames from 'classnames';
import type { Location } from 'history';
import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import GuestActions from 'web/features/authentication/components/GuestActions/GuestActions';
import authMessages from 'web/features/authentication/constants/auth-message';

import commonStyles from '../Activation.scss';
import styles from './ActivationPending.scss';

const messages = defineMessages({
  legal: {
    description: 'legal text',
    defaultMessage: 'By clicking the "Continue with Google" or "Register with Email" buttons below, you agree to <termsLink>Tubi\'s Terms of Use</termsLink> and <privacyLink>Privacy Policy.</privacyLink>',
  },
});

type Props = {
  header?: string;
  description?: string;
  redirect: Pick<Location, 'pathname' | 'search'>;
}

const ActivationPending = ({ header, description, redirect }: Props) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const isFromAddKids = redirect.pathname === WEB_ROUTES.addKids;
  return (
    <div className={commonStyles.contentWrapper}>
      <div className={classNames(styles.illustration, { [styles.rabbitHole]: isFromAddKids })} />
      <div className={commonStyles.main}>
        <header className={styles.header}>
          <h1>{header || formatMessage(authMessages.activateHeader)}</h1>
          <p>{description || formatMessage(authMessages.free)}</p>
        </header>
        <p className={styles.legalText}>
          {formatMessage(messages.legal, {
            termsLink: ([msg]: React.ReactNode[]) => <Link to={WEB_ROUTES.terms}>{msg}</Link>,
            privacyLink: ([msg]: React.ReactNode[]) => <Link to={WEB_ROUTES.privacy}>{msg}</Link>,
          })}
        </p>
        <GuestActions
          dispatch={dispatch}
          redirect={redirect}
          showDivider={false}
        />
      </div>
    </div>
  );
};

export default ActivationPending;
