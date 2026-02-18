import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';
import type { ValueOf } from 'ts-essentials';

import { WEB_ROUTES } from 'common/constants/routes';
import { activateDevice } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isMultipleAccountsEnabledSelector } from 'common/features/authentication/selectors/multipleAccounts';
import { userListSelector } from 'common/features/authentication/selectors/userListSelectors';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { userKidsSelector } from 'common/selectors/userSettings';
import ActivationCodeForm from 'web/features/authentication/containers/Activation/ActivationCodeForm/ActivationCodeForm';
import ActivationPending from 'web/features/authentication/containers/Activation/ActivationFlow/ActivationPending';

import styles from '../common.scss';
import { NEXT_ACTION } from '../constants';
import messages from '../messages';
import NextActions from './NextActions';
import type { FormValues } from '../types';
import { submitSetupForm } from '../utils';

type LocationState = {
  form: FormValues;
  error: Error;
  action: ValueOf<typeof NEXT_ACTION>;
}

const GuestFlow = ({ code }: { code: string }) => {
  const intl = useIntl();
  const isMultipleAccountsEnabled = useAppSelector(isMultipleAccountsEnabledSelector);
  const userList = useAppSelector(userListSelector);
  const useAddAccountLink = isMultipleAccountsEnabled && userList.length === 0;
  return (
    <ActivationPending
      header={intl.formatMessage(messages.guestHeader)}
      description={intl.formatMessage(messages.guestDesc)}
      redirect={{ pathname: WEB_ROUTES.addKids, search: `?code=${code}` }}
      signInLink={useAddAccountLink ? WEB_ROUTES.addAccountAdultLogin : WEB_ROUTES.signIn}
      registerLink={useAddAccountLink ? WEB_ROUTES.addAccountAdultSignUp : WEB_ROUTES.register}
    />
  );
};

const AddKids = ({ location }: WithRouterProps<any, { code: string }>) => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const kids = useAppSelector(userKidsSelector);
  const hasKids = kids && kids.length > 0;

  const handleSubmit = useCallback(/* istanbul ignore next */(code: string, formikBag: Parameters<typeof submitSetupForm>[1]) => {
    // if location.state.action exists, it's the case that user is redirected back after submitting form with activation code error
    // for this case, let the user correct the code and submit again
    const state = location.state as LocationState;
    let pendingWork: Promise<unknown> | undefined;
    let referer: string | undefined;
    if (state?.action === NEXT_ACTION.COMPLETE) {
      pendingWork = dispatch(activateDevice(code));
    } else if (state?.action === NEXT_ACTION.CONTINUE) {
      const formValues = {
        ...state.form,
        activationCode: code,
      };
      pendingWork = submitSetupForm(formValues, formikBag);
      referer = WEB_ROUTES.addKidsSetup;
    }
    if (pendingWork) {
      const { setStatus, setFieldError } = formikBag;
      pendingWork.then(() => {
        tubiHistory.push({
          pathname: WEB_ROUTES.addKidsSuccess,
          state: {
            referer,
          },
        });
      }).catch((error) => {
        setStatus({ success: false });
        setFieldError('activationCode', error.message);
      });
      return;
    }

    tubiHistory.push({
      pathname: (isLoggedIn && !hasKids) ? WEB_ROUTES.addKidsSetup : WEB_ROUTES.addKids,
      query: {
        code,
      },
    });
  }, [location.state, dispatch, isLoggedIn, hasKids]);

  if (location.query?.code) {
    if (isLoggedIn) {
      return hasKids ? <NextActions kids={kids} code={location.query.code} /> : null;
    }
    return <GuestFlow code={location.query.code} />;
  }
  return (
    <div className={styles.main}>
      <ActivationCodeForm
        prePopulatedActivationCode={location.state?.form?.activationCode}
        dispatch={dispatch}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

const WrappedAddKids = hoistNonReactStatics(withRouter(AddKids), AddKids);

export default WrappedAddKids;
