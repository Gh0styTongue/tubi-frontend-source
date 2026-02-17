import { Alert, DeviceTv } from '@tubitv/icons';
import { Button, TextInput } from '@tubitv/web-ui';
import type { FormikBag, FormikProps, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import React, { useEffect } from 'react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import { activateDevice } from 'common/features/authentication/actions/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { checkIfKeysExist } from 'common/utils/collection';
import ComposedField from 'web/components/ComposedField/ComposedField';

import messages from './activationCodeFormMessages';
import styles from '../Activation.scss';
import ContentWrapper from '../ContentWrapper/ContentWrapper';
import Success from '../Success/Success';
import {
  ACTIVATION_CODE_LENGTH,
  codeCharAreValid,
  formatCode,
} from '../utils';

interface FormValues {
  activationCode: string;
}

interface ActivationCodeFormProps {
  dispatch: TubiThunkDispatch;
  prePopulatedActivationCode?: string | string[];
  onSubmit?: (code: string) => void,
  waitForAutoActivate?: boolean;
  showSuccessDirectly?: boolean;
}

const ActivationCodeForm: React.FC<FormikProps<FormValues> & ActivationCodeFormProps> = ({
  isSubmitting,
  handleSubmit,
  prePopulatedActivationCode,
  status = {},
  submitForm,
  values,
  waitForAutoActivate,
  showSuccessDirectly,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;

  useEffect(() => {
    if (prePopulatedActivationCode) {
      submitForm();
    }
    /*
     * add waitForAutoActivate to dependencies to trigger submitForm when `autoActivate` changes
     * `autoActivate` changes when a new user signs in
     * 1. User has no age, AgeGate shows up: { autoActivate: false }
     * 2. User enter valid age: { autoActivate: true }
     * See mapStateToProps in Activation.tsx
     **/
  }, [prePopulatedActivationCode, submitForm, waitForAutoActivate]);

  const areFieldsEmpty = !checkIfKeysExist(values);
  const disableSubmit = isSubmitting || areFieldsEmpty;

  const { success } = status;
  if (waitForAutoActivate && success === undefined) return null;
  if (success) return <Success newDesign={showSuccessDirectly} />;

  let iconComponent = DeviceTv;
  let header = formatMessage(messages.activateDeviceTitle);
  let subheader = formatMessage(messages.enterCodeInstructions);
  if (success === false) {
    iconComponent = Alert;
    header = formatMessage(messages.invalidCodeTitle);
    subheader = formatMessage(messages.reEnterCodeInstructions);
  }
  return (
    <ContentWrapper
      header={header}
      iconComponent={iconComponent}
      subheader={subheader}
    >
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <ComposedField
            className={styles.input}
            containerClass={styles.inputContainer}
            format={formatCode}
            name="activationCode"
            validate={validate(intl)}
            component={TextInput}
            autoFocus
            type="text"
            label={formatMessage(messages.activateCodeLabel)}
            autoComplete="off"
            maxLength={6}
          />
          <Button
            className={styles.submitButton}
            type="submit"
            appearance={disableSubmit ? 'tertiary' : 'primary'}
            disabled={disableSubmit}
            width="theme"
          >
            {formatMessage(messages.activate)}
          </Button>
        </form>
      </div>
    </ContentWrapper>
  );
};

const validate = (intl: IntlShape) => (value: string) => {
  let error = '';
  if (value.length !== ACTIVATION_CODE_LENGTH) {
    error = intl.formatMessage(messages.invalidCode);
  } else if (!codeCharAreValid(value)) {
    error = intl.formatMessage(messages.invalidChars);
  }
  return error;
};

const handleSubmit = (
  { activationCode }: FormValues,
  formikBag: FormikBag<ActivationCodeFormProps, FormValues>
) => {
  const { setSubmitting, setFieldError, setStatus, props } = formikBag;
  const { dispatch, onSubmit } = props;
  if (onSubmit) {
    onSubmit(activationCode);
  } else {
    dispatch(activateDevice(activationCode))
      .then(() => {
        setSubmitting(false);
        setStatus({ success: true });
      })
      .catch((error: Error) => {
        setSubmitting(false);
        setStatus({ success: false });
        setFieldError('activationCode', error.message);
      });
  }
};

const withFormikConfig: WithFormikConfig<ActivationCodeFormProps, FormValues> = {
  mapPropsToValues: props => ({ activationCode: props.prePopulatedActivationCode as string || '' }),
  mapPropsToStatus: props => ({ success: props.showSuccessDirectly || undefined }),
  validateOnChange: false,
  validateOnBlur: false,
  handleSubmit,
};

export default withFormik(withFormikConfig)(ActivationCodeForm);
