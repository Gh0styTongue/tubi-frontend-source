import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import type { FormikErrors, FormikBag } from 'formik';
import React, { useCallback } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { checkEmail, clearLoginActions, login } from 'common/features/authentication/actions/auth';
import type { AuthError, User } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import type { RouteCode } from 'common/types/route-codes';
import { trackAccountEvent } from 'common/utils/analytics';
import { handleAddAdultsAccountSuccess } from 'web/features/authentication/actions/multipleAccounts';
import styles from 'web/features/authentication/components/LoginForm/LoginForm.scss';
import { isAddAccountFlow } from 'web/features/authentication/utils/auth';

import messages from './loginFormMessages';
import type { FormValues, LoginComponentProps as LoginFormProps } from './types';

export const validate = (values: Partial<FormValues>, { intl }: Pick<LoginFormProps, 'intl'>) => {
  const errors: FormikErrors<FormValues> = {};
  const { formatMessage } = intl;
  if (!values.email) {
    errors.email = formatMessage(messages.requiredError);
  }
  if (values.password !== undefined && !values.password) {
    errors.password = formatMessage(messages.requiredError);
  }
  if (values.email && !REGEX_EMAIL_VALIDATION.test(values.email)) {
    errors.email = formatMessage(messages.invalidEmailError);
  }

  return errors;
};

type FormikBagWithProps = FormikBag<LoginFormProps, FormValues>;

export const handleSubmit = ({ email, password }: FormValues, formikBag: FormikBagWithProps) => {
  const { setStatus, setSubmitting, props } = formikBag;
  const { dispatch, loginCallback, loginRedirect, isCoppaEnabled, intl, magicLinkOption } = props;
  const location = tubiHistory.getCurrentLocation();
  if (password !== undefined) {
    return dispatch(login(email, password, location))
      .then((user: User) => {
        if (isAddAccountFlow(location)) {
          return dispatch(handleAddAdultsAccountSuccess(user));
        }

        const redirectAfterLogin = loginRedirect || WEB_ROUTES.home;
        let redirect = redirectAfterLogin;
        if (isCoppaEnabled && !user.hasAge) {
          redirect = `${WEB_ROUTES.register}?redirect=${redirectAfterLogin}`;
        }
        // if there is a loginCall back call the function here
        if (loginCallback) loginCallback();

        // Redirect to loginRedirect or default to '/home'
        tubiHistory.replace(redirect);
        if (loginRedirect || loginCallback) {
          dispatch(clearLoginActions());
        }

        setStatus({ formError: '' });
      })
      .catch((err: AuthError) => {
        let formError = err.message;
        if (err.status === 429) {
          formError = intl.formatMessage(messages.tooManyRequests);
        }
        if (err.status !== 400) {
          // track all account errors except 400 (invalid email/password) because this is a user error, not a system error
          trackAccountEvent({
            manip: Manipulation.SIGNIN,
            current: 'EMAIL',
            message: Messages.AUTH_FAIL,
            status: ActionStatus.FAIL,
          });
        }
        setStatus({ formError });
      }).finally(() => {
        setSubmitting(false);
      });
  }

  return dispatch(checkEmail(email)).then((code: RouteCode) => {
    if (code === 'TAKEN') {
      if (magicLinkOption === 'password_first') {
        const enterPasswordRoute = addQueryStringToUrl(WEB_ROUTES.enterPassword, {
          email,
          redirect: loginRedirect || WEB_ROUTES.home,
        });
        tubiHistory.push(enterPasswordRoute);
      } else {
        const magicLinkRoute = addQueryStringToUrl(WEB_ROUTES.signInWithMagicLink, {
          email,
          redirect: loginRedirect || WEB_ROUTES.home,
        });
        tubiHistory.push(magicLinkRoute);
      }
    } else if (code === 'AVAILABLE') {
      const goRegister = useCallback(() => tubiHistory.push(WEB_ROUTES.register), []);
      setSubmitting(false);
      setStatus({
        formError: intl.formatMessage(messages.newEmailAlert, {
          linebreak: () => <br />,
          registerLink: ([msg]) => <span className={styles.errorLink} onClick={goRegister}>{msg}</span>,
        }),
      });
    } else {
      setSubmitting(false);
      setStatus({ formError: intl.formatMessage(messages.invalidEmailError) });
    }
  }).catch((err: AuthError) => {
    setSubmitting(false);
    if (err.status === 429) {
      setStatus({ formError: intl.formatMessage(messages.tooManyRequests) });
    }
  });
};
