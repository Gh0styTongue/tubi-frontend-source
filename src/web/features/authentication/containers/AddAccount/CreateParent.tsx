import React from 'react';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import GuestActions from 'web/features/authentication/components/GuestActions/GuestActions';

import styles from './common.scss';
import Terms from './components/Terms';
import messages from './messages';

const Adult = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const location = tubiHistory.getCurrentLocation();
  const loginRedirect = useAppSelector((state) => loginRedirectSelector(state, { queryString: location.search }));

  return (
    <div className={styles.container}>
      <header>
        <h1>{intl.formatMessage(messages.addAdultAccountTitle)}</h1>
      </header>
      <Terms />
      <div className={styles.actions}>
        <GuestActions
          dispatch={dispatch}
          redirect={loginRedirect}
          showDivider={false}
          registerLink={WEB_ROUTES.addAccountCreateParentSignUp}
          signInLink={WEB_ROUTES.addAccountCreateParentLogin}
        />
      </div>
    </div>
  );
};

export default Adult;

