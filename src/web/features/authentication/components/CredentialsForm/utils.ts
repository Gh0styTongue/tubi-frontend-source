import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import { ProgressType } from '@tubitv/analytics/lib/registerEvent';
import type { FormikErrors, FormikValues } from 'formik';
import type { IntlFormatters, IntlShape } from 'react-intl';

import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { checkEmail } from 'common/features/authentication/actions/auth';
import type { CredentialsData } from 'common/features/authentication/types/auth';
import {
  isAuthServerError,
  redirectToAuthErrorPage,
} from 'common/features/authentication/utils/error';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';
import { trackAccountEvent, trackRegisterEvent } from 'common/utils/analytics';
import { validateFirstName, validatePasswords } from 'common/utils/form';
import authMessages from 'web/features/authentication/constants/auth-message';

import type {
  FormikBagWithProps,
  FormValues,
} from './CredentialsForm';
import messages from './credentialsFormMessages';

// onBlur of the field (key), we execute a trackEvent of RegistrationEvent with progress value
const {
  CLICKED_REGISTER,
} = ProgressType;

const AUTH_SERVER_ERROR = 'AUTH_SERVER_ERROR';

export const validateEmail = (
  value: string,
  dispatch: TubiThunkDispatch,
  setStatus: FormikBagWithProps['setStatus'],
  formatMessage: IntlFormatters['formatMessage'],
) => {
  if (value.length > 0) {
    let error: string | undefined;
    return dispatch(checkEmail(value)).then((code: RouteCode) => {
      let trackMessage: RouteCode | '' = '';
      let emailExists = false;
      if (code === 'INVALID_FORMAT') {
        error = formatMessage(authMessages.signupEmailInvalid);
        trackMessage = 'INVALID_FORMAT';
      } else if (code === 'TAKEN') {
        emailExists = true;
        error = formatMessage(authMessages.emailUserAlreadyExists);
        trackMessage = 'EMAIL_USER_EXISTS';
      }
      if (trackMessage) {
        trackAccountEvent({
          manip: Manipulation.SIGNUP,
          current: 'EMAIL',
          message: trackMessage,
          status: ActionStatus.FAIL,
        });
      }
      setStatus({ emailExists });
      return error;
    }).catch((error: any) => {
      trackAccountEvent({
        manip: Manipulation.SIGNUP,
        current: 'EMAIL',
        message: Messages.AUTH_FAIL,
        status: ActionStatus.FAIL,
      });
      if (isAuthServerError(error)) {
        redirectToAuthErrorPage(error, { type: 'signUp' });
        return AUTH_SERVER_ERROR;
      }
      if (error.code) {
        if (error.code === 429) {
          return formatMessage(authMessages.tooManyRequest);
        }
        return formatMessage(authMessages.unknownError);
      }
    });
  }
};

export const validate = (data: FormValues, props: { intl: IntlShape }) => {
  const { intl } = props;
  const { formatMessage } = intl;
  const errors: FormikErrors<FormikValues> = {};

  const fieldsRequired = ['firstName', 'email', 'password'] as const;
  fieldsRequired.forEach((key) => {
    if (!data[key]) {
      errors[key] = formatMessage(messages.required);
    }
  });

  const { firstName } = data;
  const nameError = validateFirstName({ firstName, intl });

  const passwordError = data.password
    ? validatePasswords(data, {
      intl,
      fieldKeys: ['password'] as const,
    })
    : {};

  if (data.email && !REGEX_EMAIL_VALIDATION.test(data.email)) {
    errors.email = formatMessage(messages.invalidEmail);
  }
  return {
    ...errors,
    ...nameError,
    ...passwordError,
  };
};

export const handleSubmit = async (data: CredentialsData, formikBag: FormikBagWithProps) => {
  const { email } = data;
  const { props, setFieldError, setStatus, setSubmitting } = formikBag;
  const { dispatch, intl: { formatMessage }, onSubmit } = props;

  trackRegisterEvent({ progress: CLICKED_REGISTER });

  const emailError = await validateEmail(email, dispatch, setStatus, formatMessage);
  if (emailError === AUTH_SERVER_ERROR) {
    throw emailError;
  }
  if (emailError) {
    setFieldError('email', emailError);
    setSubmitting(false);
    throw emailError;
  }

  onSubmit(formikBag, data);
};
