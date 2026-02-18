import { Button } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { useAuthErrorScreen } from 'common/features/authentication/hooks/useAuthErrorScreen';
import tubiHistory from 'common/history';
import Footer from 'web/components/Footer/Footer';

import styles from './AuthError.scss';

const messages = defineMessages({
  continue: {
    description: 'text for continue button',
    defaultMessage: 'Continue as Guest',
  },
  tip: {
    description: 'text for account re-create tip',
    defaultMessage: 'We\'ll try creating your account in the next 24 hours and if successful, we’ll send you an email to finish setting up your account.',
  },
});

export type AuthErrorProps = WithRouterProps;

export const AuthError: React.FC<AuthErrorProps> = ({ location }) => {
  const { formatMessage } = useIntl();
  const {
    description,
    isDelayedRegistration,
    header,
    loginRedirect,
  } = useAuthErrorScreen({ location });

  const redirect = useCallback(() => {
    if (loginRedirect) {
      return tubiHistory.replace(loginRedirect);
    }
    tubiHistory.goBack();
  }, [loginRedirect]);

  return (
    <div>
      <div className={styles.wrapper}>
        <TopPlaceholder logo invert login register={false} />
        <div className={styles.content}>
          <div className={styles.icon} />
          <h1>{header}</h1>
          <p>{description}</p>
          <div>
            <Button
              type="button"
              appearance="primary"
              onClick={redirect}
            >
              {formatMessage(messages.continue)}
            </Button>
          </div>
          { isDelayedRegistration ? (
            <div className={styles.tip}>{formatMessage(messages.tip)}</div>
          ) : null }
        </div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default withRouter(AuthError);
