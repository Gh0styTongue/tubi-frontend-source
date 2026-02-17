import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { Button, Dropdown, TextInput } from '@tubitv/web-ui';
import type { FormikProps } from 'formik';
import { withFormik } from 'formik';
import React from 'react';
import Cookie from 'react-cookie';
import type { IntlFormatters, IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import OrDivider from 'common/components/uilib/OrDivider/OrDivider';
import {
  COOKIE_BELOW_MIN_AGE_COPPA,
  genderOptionsMessages,
  REGISTRATION_FORM_FIELD_NAMES,
} from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import type { AgeGateData, CredentialsData } from 'common/features/authentication/types/auth';
import { EmailType } from 'common/features/authentication/types/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { checkIfKeysExist } from 'common/utils/collection';
import { getDateOrder } from 'common/utils/i18n';
import type { LanguageLocaleType } from 'i18n/constants';
import ComposedField from 'web/components/ComposedField/ComposedField';

import PreprocessError from './PreprocessError';
import styles from './RegistrationForm.scss';
import messages from './registrationFormMessages';
import {
  datePartsPropsMap,
  handleBlur,
  handleEmailBlur,
  handleSubmit as handleFormSubmit,
  trackRegisterProcess,
  validate,
} from './utils';

const { FIRST_NAME, EMAIL, PASSWORD, GENDER, SUBMIT } = REGISTRATION_FORM_FIELD_NAMES;

export const formatBirthdayValue = (value = '') => {
  return value.replace(/[^0-9]/, '');
};

const getBirthdayComponents = (
  userLanguageLocale: LanguageLocaleType,
  formatMessage: IntlFormatters['formatMessage']
) => {
  return getDateOrder(userLanguageLocale).map((part) => {
    if (!part) return null;
    const { name, label, hint, maxLength } = datePartsPropsMap[part];
    return (
      <ComposedField
        data-test-id="registration-form-refresh-birthday-text-input"
        containerClass={styles.birthdayInputContainer}
        className={styles.birthdayInput}
        key={part}
        component={TextInput}
        name={name}
        format={formatBirthdayValue}
        label={formatMessage(label)}
        placeholder={hint}
        maxLength={maxLength}
        handleBlur={part === 'year' ? handleBlur : undefined}
      />
    );
  });
};

interface InputValue {
  label: string;
  value: string;
}

const getGenderOptions = (formatMessage: IntlFormatters['formatMessage']): InputValue[] => {
  return [
    { label: formatMessage(genderOptionsMessages.male), value: 'MALE' },
    { label: formatMessage(genderOptionsMessages.female), value: 'FEMALE' },
    { label: formatMessage(genderOptionsMessages.other), value: 'OTHER' },
  ];
};

export interface Props {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  isMobile: boolean;
  isSubmitting?: boolean;
  loginCallback?: (() => void) | null;
  loginRedirect?: string | null;
  userLanguageLocale: LanguageLocaleType | string;
  webRefreshEnabled?: boolean;
}

export type FormValues = AgeGateData & CredentialsData;

export type AllProps = Props & FormikProps<FormValues>;

export const RegistrationForm: React.FC<AllProps> = ({
  errors,
  handleSubmit,
  intl: { formatMessage },
  isMobile,
  isSubmitting,
  loginRedirect,
  userLanguageLocale,
  setFieldError,
  setFieldValue,
  setStatus,
  status = {},
  values,
}) => {
  const dispatch = useAppDispatch();
  const signInLink = loginRedirect ? addQueryStringToUrl(WEB_ROUTES.signIn, { redirect: loginRedirect }) : WEB_ROUTES.signIn;

  // if user is underage, cannot register
  const areFieldsEmpty = !checkIfKeysExist(values);
  const disableSubmit =
    isSubmitting || !!Cookie.load(COOKIE_BELOW_MIN_AGE_COPPA) || status.emailExists || areFieldsEmpty;

  const onGenderSelect = ({ value }: InputValue) => {
    const name = GENDER;
    trackRegisterProcess(name, value);
    setFieldValue(name, value);
  };

  return (
    <div className={styles.main} data-test-id="registration-form-refresh">
      <div className={styles.headers}>
        <h1 className={styles.header}>{formatMessage(messages.welcome)}</h1>
        <div className={styles.subheader}>{formatMessage(messages.free)}</div>
      </div>
      <SSOButtonGroup googleClass={styles.button} />
      <OrDivider className={styles.orDivider} inverted />
      <div className={styles.formHeader}>{formatMessage(messages.emailRegHeading)}</div>
      <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
        <PreprocessError formatMessage={formatMessage} signInLink={signInLink} status={status} />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={FIRST_NAME}
          label={formatMessage(messages.firstNameLabel)}
          maxLength={60}
          autoComplete="given-name"
          autoFocus={!isMobile}
          handleBlur={handleBlur}
        />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={EMAIL}
          type="email"
          label={formatMessage(messages.emailLabel)}
          hint={formatMessage(messages.emailHint)}
          autoComplete="email"
          handleBlur={(e) => {
            handleEmailBlur({ dispatch, event: e, formatMessage, setFieldError, setStatus });
          }}
        />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={PASSWORD}
          type="password"
          label={formatMessage(messages.passwordLabel)}
          hint={formatMessage(messages.passwordHint)}
          canShowPassword
        />
        <div className={styles.birthday}>
          <label className={styles.birthdayLabel}>{formatMessage(messages.birthdayLabel)}</label>
          {getBirthdayComponents(userLanguageLocale as LanguageLocaleType, formatMessage)}
        </div>
        <div className={styles.gender}>
          <Dropdown
            className={styles.genderDropdown}
            name={GENDER}
            label={formatMessage(messages.genderLabel)}
            options={getGenderOptions(formatMessage)}
            value={values.gender}
            error={errors.gender}
            onSelect={onGenderSelect}
          />
        </div>
        <div className={styles.submitWrapper}>
          <Button
            name={SUBMIT}
            type="submit"
            appearance={disableSubmit ? 'tertiary' : 'primary'}
            disabled={disableSubmit}
            className={styles.submit}
            width="theme"
          >
            {formatMessage(messages.registerButtonLabel)}
          </Button>
        </div>
        <div className={styles.statement}>
          <p>
            {formatMessage(messages.termsAgreement, {
              termsLink: ([msg]: React.ReactNode[]) => (
                <Link className={styles.link} to={WEB_ROUTES.terms}>
                  {msg}
                </Link>
              ),
              privacyLink: ([msg]: React.ReactNode[]) => (
                <Link className={styles.link} to={WEB_ROUTES.privacy}>
                  {msg}
                </Link>
              ),
            })}
          </p>
          <p>
            {formatMessage(messages.ownedAccountMessage, {
              signInLink: ([msg]: React.ReactNode[]) => (
                <Link className={styles.link} to={signInLink}>
                  {msg}
                </Link>
              ),
            })}
          </p>
        </div>
      </form>
    </div>
  );
};

export const withFormikConfig = {
  mapPropsToValues: () => ({
    firstName: '',
    email: '',
    emailType: EmailType.MANUAL,
    password: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    gender: '',
  }),
  validateOnBlur: false,
  validateOnChange: false,
  validate,
  handleSubmit: handleFormSubmit,
};

const registrationFormWithFormik = withFormik(withFormikConfig)(RegistrationForm);

export default injectIntl(registrationFormWithFormik);
