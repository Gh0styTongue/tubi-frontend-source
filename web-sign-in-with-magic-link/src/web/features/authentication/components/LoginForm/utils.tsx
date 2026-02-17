import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import type { FormikErrors, FormikBag } from 'formik';
import React from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { checkEmail, clearLoginActions, login } from 'common/features/authentication/actions/auth';
import type { AuthError } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import type { RouteCode } from 'common/types/route-codes';
import type { UserSettingsAction } from 'common/types/userSettings';
import { trackAccountEvent } from 'common/utils/analytics';
import styles from 'web/features/authentication/components/LoginForm/LoginForm.scss';

import type { FormValues, LoginFormProps } from './LoginForm';
import messages from './loginFormMessages';

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
  if (password !== undefined) {
    return dispatch(login(email, password, tubiHistory.getCurrentLocation()))
      .then((hasAge: boolean | UserSettingsAction) => {
        const redirectAfterLogin = loginRedirect || WEB_ROUTES.home;
        let redirect = redirectAfterLogin;
        if (isCoppaEnabled && !hasAge) {
          redirect = `${WEB_ROUTES.register}?redirect=${redirectAfterLogin}`;
        }
        // if there is a loginCall back call the function here
        if (loginCallback) loginCallback();

        // Redirect to loginRedirect or default to '/home'
        tubiHistory.replace(redirect);
        if (loginRedirect || loginCallback) {
          dispatch(clearLoginActions());
        }
        setSubmitting(false);
        setStatus({ formError: '' });
      })
      .catch((err: AuthError) => {
        setSubmitting(false);
        let formError = err.message;
        if (err.status === 429) {
          formError = intl.formatMessage(messages.tooManyRequests);
        } else if (err.status === 400) {
          trackAccountEvent({
            manip: Manipulation.SIGNIN,
            current: 'EMAIL',
            message: Messages.INVALID_PASSWORD,
            status: ActionStatus.FAIL,
          });
        }
        setStatus({ formError });
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
      const goRegister = () => tubiHistory.push(WEB_ROUTES.register);
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
