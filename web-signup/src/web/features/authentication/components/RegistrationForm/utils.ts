import { secs } from '@adrise/utils/lib/time';
import { ActionStatus, Manipulation } from '@tubitv/analytics/lib/authEvent';
import { ProgressType } from '@tubitv/analytics/lib/registerEvent';
import type { FormikBag, FormikErrors, FormikValues } from 'formik';
import type { IntlShape } from 'react-intl';

import { checkIfEmailExists } from 'client/utils/auth';
import { setCookie } from 'client/utils/localDataStorage';
import { COOKIE_BELOW_MIN_AGE_COPPA, ONE_WEEK, REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { clearLoginActions, register } from 'common/features/authentication/actions/auth';
import type { AuthError } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';
import { trackAccountEvent, trackRegisterEvent } from 'common/utils/analytics';
import { validateFirstName, validatePasswords } from 'common/utils/form';
import messages from 'web/features/authentication/components/RegistrationForm/registrationFormMessages';
import authMessages from 'web/features/authentication/constants/auth-message';
import { getRegisterErrorMessage } from 'web/features/authentication/utils/auth';

import type { FormValues, Props } from './RegistrationForm';

const { FIRST_NAME, EMAIL, PASSWORD2, BIRTH_MONTH, BIRTH_DAY, BIRTH_YEAR, GENDER, SUBMIT } =
  REGISTRATION_FORM_FIELD_NAMES;

// onBlur of the field (key), we execute a trackEvent of RegistrationEvent with progress value
const { COMPLETED_PASSWORD, COMPLETED_BIRTHDAY, COMPLETED_EMAIL, COMPLETED_GENDER, COMPLETED_NAME, CLICKED_REGISTER } =
  ProgressType;

const registrationProgressMap = {
  [PASSWORD2]: COMPLETED_PASSWORD,
  [BIRTH_YEAR]: COMPLETED_BIRTHDAY,
  [EMAIL]: COMPLETED_EMAIL,
  [GENDER]: COMPLETED_GENDER,
  [FIRST_NAME]: COMPLETED_NAME,
  [SUBMIT]: CLICKED_REGISTER,
};

const yearProp = {
  name: BIRTH_YEAR,
  label: messages.birthdayYearLabel,
  hint: 'YYYY',
  maxLength: 4,
};

export const datePartsPropsMap = {
  day: {
    name: BIRTH_DAY,
    label: messages.birthdayDayLabel,
    hint: 'DD',
    maxLength: 2,
  },
  month: {
    name: BIRTH_MONTH,
    label: messages.birthdayMonthLabel,
    hint: 'MM',
    maxLength: 2,
  },
  year: yearProp,
  relatedYear: yearProp,
};

/**
 * send track event for tracking registration progress. Completion of certain fields warrant event firing
 * @param event - dom event
 */
export const trackRegisterProcess = (name: string, value: string) => {
  if (value && value.length > 0) {
    trackRegisterEvent({ progress: registrationProgressMap[name] });
  }
};

interface Target {
  name: string;
  value: string;
}

interface FormEvent {
  target: Target;
}

export const handleBlur = (event: FormEvent) => {
  const { name, value } = event.target;
  trackRegisterProcess(name, value);
};

export type FormikBagWithProps = FormikBag<Props, FormValues>;

interface EmailBlurEventProps {
  dispatch: TubiThunkDispatch;
  event: FormEvent;
  formatMessage: IntlShape['formatMessage'];
  setFieldError: FormikBagWithProps['setFieldError'];
  setStatus: FormikBagWithProps['setStatus'];
}

export const handleEmailBlur = async ({ dispatch, event, formatMessage, setFieldError, setStatus }: EmailBlurEventProps) => {
  const { name, value } = event.target;
  if (value.length > 0) {
    let emailExists = false;
    try {
      emailExists = await checkIfEmailExists(value, dispatch);
    } catch (error) {
      // do nothing, email does not exist
    }
    if (emailExists) {
      setFieldError(name, formatMessage(authMessages.emailUserAlreadyExists));
      const message: RouteCode = 'EMAIL_USER_EXISTS';
      trackAccountEvent({
        manip: Manipulation.SIGNUP,
        current: 'EMAIL',
        message,
        status: ActionStatus.FAIL,
      });
    }
    setStatus({ emailExists });
  }
  trackRegisterProcess(name, value);
};

export const validate = (values: FormValues, { intl }: Props) => {
  const { formatMessage } = intl;
  // we track their attempt to register here because validate happens on click/press Enter of Register
  trackRegisterEvent({ progress: registrationProgressMap[SUBMIT] });
  const errors: FormikErrors<FormikValues> = {};
  (['firstName', 'email', 'birthDay', 'birthMonth', 'birthYear'] as const).forEach((key) => {
    if (!values[key]) {
      errors[key] = formatMessage(messages.required);
    }
  });

  const { firstName } = values;
  const nameError = validateFirstName({ firstName, intl });

  const passwordError = validatePasswords(values, {
    intl,
    fieldKeys: ['password'] as const,
  });

  if (values.email && !REGEX_EMAIL_VALIDATION.test(values.email)) {
    errors.email = formatMessage(messages.invalidEmail);
  }

  const { birthMonth = '', birthDay = '', birthYear = '' } = values;
  const bdayFieldAccessed = birthMonth || birthDay || birthYear;

  if (bdayFieldAccessed) {
    const birthMonthInt = parseInt(birthMonth, 10);
    const birthDayInt = parseInt(birthDay, 10);
    const birthYearInt = parseInt(birthYear, 10);

    if (!birthMonthInt || birthMonthInt <= 0 || birthMonthInt > 12) {
      errors.birthMonth = formatMessage(messages.invalidMonth);
    }
    if (!birthDayInt || birthDayInt <= 0 || birthDayInt > 31) {
      errors.birthDay = formatMessage(messages.invalidDay);
    }
    if (!birthYearInt || birthYear.length < 4 || birthYearInt > new Date().getFullYear()) {
      errors.birthYear = formatMessage(messages.invalidYear);
    }

    const allFieldsAccessed = birthMonth && birthDay && birthYear;
    if (allFieldsAccessed && !errors.birthYear) {
      const birthday = `${birthMonth}/${birthDay}/${birthYear}`;
      try {
        const dt = new Date(birthday);
        dt.toISOString(); // this will throw if invalid
        const now = new Date();
        if (now.valueOf() - dt.valueOf() < 0) {
          errors.birthYear = formatMessage(messages.futureBirthday);
        }
      } catch (e) {
        // it seems that we'll never be here
        /* istanbul ignore next */
        errors.birthYear = formatMessage(messages.invalidBirthday);
      }
    }
  }

  return {
    ...errors,
    ...nameError,
    ...passwordError,
  };
};

export const handleSubmit = (data: FormValues, formikBag: FormikBagWithProps) => {
  const {
    setSubmitting,
    setStatus,
    props: { dispatch, loginCallback, loginRedirect, intl },
  } = formikBag;
  return dispatch(register(tubiHistory.getCurrentLocation(), data))
    .then(() => {
      setSubmitting(false);
      setStatus({ formError: null });
      // if there is a loginCall back call the function here
      if (loginCallback) loginCallback();
      // redirect to loginRedirect or default to '/home'
      tubiHistory.replace(loginRedirect || WEB_ROUTES.home);
      if (loginRedirect || loginCallback) {
        dispatch(clearLoginActions());
      }
    })
    .catch((error: AuthError) => {
      setSubmitting(false);
      // if user is under thirteen, we need to set cookie to prevent them from registering for COPPA regulations
      const routeCode = error.routeCode || error.code || '';
      /* istanbul ignore else */
      if (routeCode === 'BELOW_MIN_AGE') {
        setCookie(COOKIE_BELOW_MIN_AGE_COPPA, '1', ONE_WEEK / secs(1));
      } else if (routeCode === 'EMAIL_USER_EXISTS') {
        setStatus({ emailExists: true });
      }
      setStatus({
        formError: {
          routeCode,
          message: getRegisterErrorMessage(intl)(error),
        },
      });
    });
};
