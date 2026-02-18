import { ATag } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import { setActiveUser } from 'common/features/authentication/actions/multipleAccounts';
import { userSelector, loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import type { User } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector, userKidsSelector } from 'common/selectors/userSettings';
import AccountList from 'web/features/authentication/components/AccountList/AccountList';

import commonStyles from './common.scss';
import messages from './messages';

const Next = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const location = tubiHistory.getCurrentLocation();
  const redirectPath = useAppSelector((state) => loginRedirectSelector(state, { queryString: location.search }));
  const username = useAppSelector(firstNameSelector);
  const user = useAppSelector(userSelector);
  const kidsList = useAppSelector(userKidsSelector) || [];
  const userList = [user, ...kidsList].filter((user): user is User => Boolean(user));

  const handleSelectAccount = useCallback((user: User) => {
    dispatch(setActiveUser({ user, redirectPath, shouldBypassGate: true, shouldUseDelay: false }));
  }, [dispatch, redirectPath]);

  return (
    <div className={commonStyles.container}>
      <header>
        <h1>{formatMessage(messages.selectAccountHeader)}</h1>
        <p>{formatMessage(messages.selectAccountDesc, { username })}</p>
      </header>
      <AccountList userList={userList} onSelect={handleSelectAccount} />
      <div className={commonStyles.addAccount}>
        <ATag to={{ pathname: WEB_ROUTES.addKidsSetup }}>{formatMessage(messages.addKidsAccount)}</ATag>
      </div>
    </div>
  );
};

export default Next;
