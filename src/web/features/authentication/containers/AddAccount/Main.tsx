import { parseQueryString } from '@adrise/utils/lib/queryString';
import { NavSection } from '@tubitv/analytics/lib/components';
import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { trackComponentInteractionEvent } from 'client/utils/track';
import { WEB_ROUTES } from 'common/constants/routes';
import { loginRedirect } from 'common/features/authentication/actions/auth';
import { fetchUserSettings } from 'common/features/authentication/api/userSettings';
import { userListSelector } from 'common/features/authentication/selectors/userListSelectors';
import { setPendingAdmin } from 'common/features/authentication/store/pendingAdminStore';
import type { User } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import AccountList from 'web/features/authentication/components/AccountList/AccountList';
import GuestActions from 'web/features/authentication/components/GuestActions/GuestActions';

import commonStyles from './common.scss';
import Terms from './components/Terms';
import styles from './main.scss';
import messages from './messages';

type Tab = 'adults' | 'kids';

const trackTabSwitching = (tab: Tab) => {
  trackComponentInteractionEvent({
    component: 'TOP_NAV',
    section: tab === 'adults' ? NavSection.ADULTS : NavSection.KIDS,
    userInteraction: 'TOGGLE_ON',
  });
};

export const AddAccount = ({ location }: WithRouterProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const userList = useAppSelector(userListSelector);
  const redirectPath = useAppSelector((state) => state.auth.loginRedirect) || WEB_ROUTES.home;
  const redirectFromQuery = parseQueryString(location.search).redirect;
  const hasExistingAccount = userList.length > 0;

  const defaultTab = (location.state?.type || 'adults') as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const switchToAdults = useCallback(() => {
    setActiveTab('adults');
    trackTabSwitching('adults');
  }, []);
  const switchToKids = useCallback(() => {
    setActiveTab('kids');
    trackTabSwitching('kids');
  }, []);

  const isKids = activeTab === 'kids';

  useEffect(() => {
    tubiHistory.replace({
      pathname: WEB_ROUTES.addAccount,
      query: location.query,
      state: {
        type: isKids ? 'kids' : 'adults',
        theme: isKids ? 'kidsDark' : 'defaultDark',
      },
    });
    // location.query is intentionally omitted from the dependency array to avoid
    // replacing history on every query change, which could cause unnecessary re-renders or loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKids]);

  useEffect(() => {
    // The /add-account flow navigates to other paths (/add-account/create-parent etc.),
    // so we need to set the loginRedirect state from the query string at first
    if (redirectFromQuery) {
      dispatch(loginRedirect(redirectFromQuery));
    }
  }, [dispatch, redirectFromQuery]);

  // Track if a fetchUserSettings call is in progress to prevent race conditions
  // when user clicks multiple accounts in quick succession
  const isFetchingRef = useRef(false);

  const handleSelectAccount = useCallback((user: User) => {
    // Ignore if a fetch is already in progress
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    // Fetch user settings to get hasPIN value, then store admin info without activating them
    // This prevents issues if user cancels the kid account creation flow
    dispatch(fetchUserSettings(user.token))
      .then((settings) => {
        setPendingAdmin(user, { hasPIN: settings.hasPIN });
        tubiHistory.push({
          pathname: WEB_ROUTES.addKidsSetup,
        });
      })
      .finally(() => {
        // ensure isFetchingRef is set to false after a small delay to prevent race conditions
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 300);
      });
  }, [dispatch]);

  return (
    <div className={commonStyles.container}>
      <ul className={styles.tabs}>
        <li
          className={classNames({
            [styles.__active]: activeTab === 'adults',
          })}
          onClick={switchToAdults}
        >{intl.formatMessage(messages.forAdults)}</li>
        <li
          className={classNames({
            [styles.__active]: activeTab === 'kids',
          })}
          onClick={switchToKids}
        >{intl.formatMessage(messages.forKids)}</li>
      </ul>
      <header>
        <h1>{intl.formatMessage(isKids ? messages.forKidsHeader : messages.forAdultsHeader)}</h1>
        <p>{intl.formatMessage(isKids ? (hasExistingAccount ? messages.forKidsDescWithExistingAccount : messages.forKidsDesc) : messages.forAdultsDesc)}</p>
      </header>
      {isKids && hasExistingAccount ? (
        <>
          <AccountList userList={userList} onSelect={handleSelectAccount} />
          <div className={commonStyles.addAccount}>
            <ATag to={{ pathname: WEB_ROUTES.addAccountCreateParent }}>{intl.formatMessage(messages.addAdultAccount)}</ATag>
          </div>
        </>
      ) : (
        <>
          <Terms />
          <div className={commonStyles.actions}>
            <GuestActions
              dispatch={dispatch}
              redirect={redirectPath}
              showDivider={false}
              registerLink={isKids ? WEB_ROUTES.addAccountCreateParentSignUp : WEB_ROUTES.addAccountAdultSignUp}
              signInLink={isKids ? WEB_ROUTES.addAccountCreateParentLogin : WEB_ROUTES.addAccountAdultLogin}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default withRouter(AddAccount);
