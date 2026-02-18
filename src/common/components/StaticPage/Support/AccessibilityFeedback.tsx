/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import Input from '@adrise/web-ui/lib/Input/Input';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import FormData from 'form-data';
import type { FormikBag, FormikErrors, FormikProps } from 'formik';
import { withFormik } from 'formik';
import type { Location } from 'history';
import React from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { submitSupport } from 'common/actions/support';
import {
  ACCESSIBILITY_TAG,
  ALLOWED_ACCESSIBILITY_FIELDS,
} from 'common/constants/accessibility';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  MOBILE_METADATA_HEADERS,
} from 'common/constants/support';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import type { User } from 'common/features/authentication/types/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from '../StaticPage.scss';

const messages = defineMessages({
  firstName: {
    description: 'input form field label',
    defaultMessage: 'Your first name',
  },
  lastName: {
    description: 'input form field label',
    defaultMessage: 'Your last name',
  },
  email: {
    description: 'input form field label',
    defaultMessage: 'Your email address',
  },
  feedback: {
    description: 'input form field label',
    defaultMessage: 'Provide any accessibility feedback here.',
  },
  success: {
    description:
      'success message after submitting the customer support form',
    defaultMessage: 'Message has been submitted. Thank you.',
  },
  home: {
    description: 'link text to go to the home page',
    defaultMessage: 'Home',
  },
  submit: {
    description: 'Submit form button text',
    defaultMessage: 'Submit',
  },
  requiredField: {
    description: 'form input field required message',
    defaultMessage: 'Required Field',
  },
  invalidEmail: {
    description: 'email address invalid error message',
    defaultMessage: 'Invalid email address',
  },
});

interface RouteProps {
  location: Location;
}

export interface FormValues {
  firstName?: string;
  lastName?: string;
  email?: string;
  feedback?: string;
  message?: string;
}

const SupportSuccess = () => {
  const intl = useIntl();
  return (
    <div className={styles.success}>
      <h1>{intl.formatMessage(messages.success)}</h1>
      <Link to={WEB_ROUTES.home}>
        <Button>{intl.formatMessage(messages.home)}</Button>
      </Link>
    </div>
  );
};

interface StateProps {
  email?: string;
}

interface OwnProps extends RouteProps {
  handleSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  status?: {
    success?: boolean;
    formError?: string;
  };
  values?: FormValues;
  errors?: FormikErrors<FormValues>;
  setFieldValue?: (field: string, value: string, shouldValidate?: boolean) => void;
  setFieldError?: (name: string, msg: string) => void;
}

export interface AccessibilityFeedbackProps extends OwnProps, StateProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

export const AccessibilityFeedback: React.FunctionComponent<FormikProps<FormValues> & AccessibilityFeedbackProps> = ({
  handleSubmit,
  status,
  isSubmitting = false,
}) => {
  const intl = useIntl();
  const className = classNames(styles.formContainer, styles.supportForm);
  const { formError, success } = status ?? {};

  if (success) {
    return <SupportSuccess />;
  }

  const itemCls = classNames(styles.flexItem);

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {formError ? <p className={styles.errorText}>{formError}</p> : null}
      <div className={itemCls}>
        <ComposedField
          component={Input}
          name="firstName"
          label={intl.formatMessage(messages.firstName)}
          className={styles.textInput}
        />
      </div>
      <div className={itemCls}>
        <ComposedField
          component={Input}
          name="lastName"
          label={intl.formatMessage(messages.lastName)}
          className={styles.textInput}
        />
      </div>
      <div className={itemCls}>
        <ComposedField
          component={Input}
          name="email"
          label={intl.formatMessage(messages.email)}
          autoComplete="email"
          className={styles.textInput}
        />
      </div>
      <div className={itemCls}>
        <ComposedField
          component={Input}
          name="feedback"
          tag="textarea"
          label={intl.formatMessage(messages.feedback)}
          fixedLabel
          className={styles.messageInput}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button appearance="tertiary" type="submit" disabled={isSubmitting}>
          {intl.formatMessage(messages.submit)}
        </Button>
      </div>
    </form>
  );
};

export const validate = (values: FormValues | null, { intl }: AccessibilityFeedbackProps) => {
  const errors: AccessibilityFeedbackProps['errors'] = {};
  if (!values) return errors;

  if (!values?.feedback) {
    errors.feedback = intl.formatMessage(messages.requiredField);
  }

  if (
    values?.email
    && !REGEX_EMAIL_VALIDATION.test(values.email)
  ) {
    errors.email = intl.formatMessage(messages.invalidEmail);
  }

  return errors;
};

const getFormData = (supportBody: FormValues = {}): FormData => {
  const formData = new FormData();
  Object.keys(supportBody)
    .forEach(key => {
      formData.append(key, supportBody[key as keyof typeof supportBody]);
    });
  formData.append('topic', ACCESSIBILITY_TAG);
  return formData;
};

export const handleSubmit = (data: FormValues | null, formikBag: FormikBag<AccessibilityFeedbackProps, FormValues>) => {
  const { setSubmitting, setStatus, props } = formikBag;

  const supportKeys = Object.keys(data ?? {});
  const hasInvalidField = supportKeys.some((key) => !ALLOWED_ACCESSIBILITY_FIELDS.includes(key));
  if (hasInvalidField) {
    setSubmitting(false);
    setStatus({ success: false, formError: 'Invalid key submitted' });
    return;
  }

  const formData = getFormData(data ?? {});
  props
    .dispatch(submitSupport(formData))
    .then(() => {
      setSubmitting(false);
      setStatus({ success: true, formError: '' });
    })
    .catch(({ message: formError }: Partial<FormValues>) => {
      setSubmitting(false);
      setStatus({ success: false, formError });
    });
};

const supportWithFormik = withFormik({
  mapPropsToValues: (props: AccessibilityFeedbackProps) =>
    ALLOWED_ACCESSIBILITY_FIELDS.reduce(
      (agg, key) => ({ ...agg, [key]: props[key as keyof typeof props] || '' }),
      {},
    ),
  validateOnChange: false,
  validateOnBlur: false,
  validate,
  handleSubmit,
})(AccessibilityFeedback);

export function mapStateToProps(state: StoreState): StateProps & FormValues {
  const { auth, support } = state;
  const { mobileMetadataHeaders } = support;
  let returnedProps: (StateProps & FormValues) = {};
  if (auth.user) {
    returnedProps = {
      ...returnedProps,
      email: (auth.user as User).email,
    };
  } else {
    returnedProps = {
      ...returnedProps,
      email: mobileMetadataHeaders[MOBILE_METADATA_HEADERS.email],
    };
  }
  return returnedProps;
}
const AccessibilityFeedbackForm = connect(mapStateToProps)(injectIntl(supportWithFormik));
/**
 * StaticPage route expects functional component, so wrap the class here
 */
export default ({ location }: { location: Location }) => <AccessibilityFeedbackForm location={location} />;
