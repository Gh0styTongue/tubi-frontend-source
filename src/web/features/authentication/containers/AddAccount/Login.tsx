import { Account24 } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import OrDivider from 'common/components/uilib/OrDivider/OrDivider';
import { WEB_ROUTES } from 'common/constants/routes';
import CircleIcon from 'web/features/authentication/components/CircleIcon/CircleIcon';
import LoginCredentialsForm from 'web/features/authentication/components/LoginForm/LoginCredentialsForm';

import commonStyles from './common.scss';
import Terms from './components/Terms';
import styles from './Login.scss';
import messages from './messages';

const Login = () => {
  const { formatMessage } = useIntl();
  return (
    <div className={commonStyles.container}>
      <header>
        <div className={commonStyles.circleIcon}>
          <CircleIcon iconComponent={Account24} />
        </div>
        <h1>{formatMessage(messages.welcomeBack)}</h1>
      </header>
      <Terms />
      <main>
        <div className={commonStyles.actions}>
          <SSOButtonGroup />
        </div>
        <div className={styles.orDivider}>
          <OrDivider inverted />
        </div>
        <LoginCredentialsForm />
        <div className={styles.forgotPassword}>
          {formatMessage(messages.forgotPassword, {
            resetLink: ([msg]: React.ReactNode[]) => <Link to={WEB_ROUTES.forgotPassword}>{msg}</Link>,
          })}
        </div>
      </main>
    </div>
  );
};

export default Login;
