import { TextInput } from '@tubitv/web-ui';
import type { FormikProps, FormikBag, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import type { Location } from 'history';
import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { useMemo, useRef } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';

import { FREEZED_EMPTY_FUNCTION, REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { register, handleSuccessfulLogin } from 'common/features/authentication/actions/auth';
import { EmailType } from 'common/features/authentication/types/auth';
import type { CredentialsData } from 'common/features/authentication/types/auth';
import type { FormValues as AgeGateFormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { validate as validateAgeGateInfo } from 'common/features/coppa/components/AgeGateProvider/utils';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { uiSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import ComposedField from 'web/components/ComposedField/ComposedField';
import { handleAddAdultsAccountSuccess } from 'web/features/authentication/actions/multipleAccounts';
import SubmitButton from 'web/features/authentication/components/SubmitButton/SubmitButton';
import authMessages from 'web/features/authentication/constants/auth-message';
import { isAddAccountFlow, isCreateParentFlow } from 'web/features/authentication/utils/auth';
import { trackRegisterProcess } from 'web/features/authentication/utils/track';
import AgeGateRow from 'web/features/coppa/components/AgeGateForm/AgeGateRow';

import PreprocessError from './PreprocessError';
import styles from './SignUpForm.scss';
import {
  validate as validateBasicInfo,
  handleSubmit as precheckBasicInfo,
} from './utils';

const messages = defineMessages({
  header: {
    description: 'sign up form header',
    defaultMessage: 'Register with Email',
  },
});

const {
  FIRST_NAME,
  EMAIL,
  PASSWORD,
} = REGISTRATION_FORM_FIELD_NAMES;

type IntlProps = {
  intl: IntlShape;
};
type ConnectProps = {
  dispatch: TubiThunkDispatch;
};
type RefProps = {
  hasShownConfirmationRef: React.MutableRefObject<boolean>;
};
type FormValues = CredentialsData & AgeGateFormValues;
type Props = IntlProps & ConnectProps & RefProps & FormikProps<FormValues>;

export const getSignInLink = (location: Location) => {
  if (isCreateParentFlow(location)) {
    return WEB_ROUTES.addAccountCreateParentLogin;
  }
  if (isAddAccountFlow(location)) {
    return WEB_ROUTES.addAccountAdultLogin;
  }
  return WEB_ROUTES.signIn;
};

const SignUpForm = (props: Props) => {
  const {
    intl,
    values,
    setFieldValue,
    setFieldTouched,
    touched,
    errors,
    status = {},
    handleSubmit,
  } = props;
  const { formatMessage } = intl;
  const { isMobile } = useAppSelector(uiSelector);
  const location = tubiHistory.getCurrentLocation();
  const signInLink = useMemo(() => getSignInLink(location), [location]);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <header>
        <h1>{formatMessage(messages.header)}</h1>
      </header>
      <div className={styles.fields}>
        <PreprocessError
          formatMessage={formatMessage}
          status={status}
          signInLink={signInLink}
        />
        <ComposedField
          component={TextInput}
          name={FIRST_NAME}
          label={formatMessage(authMessages.firstNameLabel)}
          maxLength={60}
          autoComplete="given-name"
          autoFocus={!isMobile}
          handleBlur={trackRegisterProcess}
        />
        <ComposedField
          component={TextInput}
          name={EMAIL}
          type="email"
          label={formatMessage(authMessages.emailLabel)}
          hint={formatMessage(authMessages.emailHint)}
          autoComplete="email"
          handleBlur={trackRegisterProcess}
        />
        <ComposedField
          component={TextInput}
          name={PASSWORD}
          type="password"
          label={formatMessage(authMessages.passwordLabel)}
          hint={formatMessage(authMessages.passwordHint)}
          canShowPassword
          handleBlur={trackRegisterProcess}
        />
        <AgeGateRow
          values={values}
          touched={touched}
          errors={errors}
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
        />
      </div>
      <SubmitButton {...props} />
    </form>
  );
};

export const validate = (data: FormValues, props: IntlProps & RefProps) => {
  return {
    ...validateBasicInfo(data, props),
    ...validateAgeGateInfo(data, {
      formType: 'AGE',
      hasGenderField: true,
    }, {
      intl: props.intl,
      hasShownConfirmationRef: props.hasShownConfirmationRef,
    }),
  };
};

type FormikBagWithProps = FormikBag<IntlProps & ConnectProps & RefProps, FormValues>;

export const handleSubmit = async (data: FormValues, formikBag: FormikBagWithProps) => {
  const { setSubmitting, props } = formikBag;

  try {
    await precheckBasicInfo(data, {
      ...formikBag,
      props: {
        ...formikBag.props,
        onSubmit: FREEZED_EMPTY_FUNCTION,
      },
    });

    const { dispatch } = props;
    const location = tubiHistory.getCurrentLocation();
    const payload = {
      ...data,
      authType: 'EMAIL' as const,
    };
    setSubmitting(true);

    const user = await dispatch(register(location, payload));

    if (isAddAccountFlow(location)) {
      await dispatch(handleAddAdultsAccountSuccess(user, 'register'));
    } else {
      dispatch(handleSuccessfulLogin(location.query?.redirect as string | undefined));
    }
  } finally {
    setSubmitting(false);
  }
};

const withFormikConfig: WithFormikConfig<IntlProps & ConnectProps & RefProps, FormValues> = {
  mapPropsToValues: /* istanbul ignore next */() => ({
    firstName: '',
    email: '',
    password: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    emailType: EmailType.MANUAL,
  }),
  handleSubmit,
  validate,
  validateOnChange: false,
  validateOnBlur: true,
};

const withConfirmationRef = <P extends object>(InnerComponent: React.ComponentType<P>) => {
  const Wrapper = (props: Omit<P, 'hasShownConfirmationRef'>) => {
    const hasShownConfirmationRef = useRef(false);
    return <InnerComponent {...props as P} hasShownConfirmationRef={hasShownConfirmationRef} />;
  };
  return hoistNonReactStatics(
    Object.assign(Wrapper, { WrappedComponent: InnerComponent }),
    InnerComponent,
  );
};

export default injectIntl(connect()(withConfirmationRef(withFormik(withFormikConfig)(SignUpForm))));
