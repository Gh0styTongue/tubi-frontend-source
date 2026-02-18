/**
 * Age Gate form provider component for COPPA compliance.
 * Wraps Formik to manage birthday/age input validation.
 * Supports multiple form types: full date, year of birth only, or age input.
 */
import type { FormikProps, FormikActions } from 'formik';
import { Formik } from 'formik';
import type { ReactNode } from 'react';
import React, { useRef } from 'react';
import { useIntl } from 'react-intl';

import type { EnhancedAgeGateData } from 'common/features/authentication/types/auth';
import { checkIfKeysExist, hasEmptyStringValue } from 'common/utils/collection';

import { validate, getInitialValues } from './utils';

/** Supported age gate form types */
export type FormType = 'FULL' | 'YEAR_OF_BIRTH' | 'AGE';
export type AgeGateFormikActions = FormikActions<FormValues>;

export interface AgeGateChildrenProps extends FormikProps<FormValues> {
  disableSubmit: boolean;
}

export interface Props {
  hasGenderField?: boolean;
  hasFirstNameField?: boolean;
  onSubmit: (data: EnhancedAgeGateData, actions: AgeGateFormikActions) => void;
  isRegistering?: boolean;
  formType?: FormType;
  children: (props: AgeGateChildrenProps) => ReactNode;
}

export interface FormValues {
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  firstName?: string;
  gender?: string;
  age?: string;
  needsAgeConfirmation?: string;
  personalizedEmails?: boolean;
}

/**
 * Provides Formik form handling for age gate inputs.
 * Validates birthday/age and manages form submission state.
 */
const AgeGateProvider: React.FunctionComponent<Props> = (props): React.ReactElement => {
  const {
    children,
    formType,
  } = props;

  const intl = useIntl();
  const hasShownConfirmationRef = useRef(false);

  const initialValues = getInitialValues(props);

  const handleValidate = (values: FormValues) => {
    return validate(values, props, {
      hasShownConfirmationRef,
      intl,
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validateOnChange={!!__OTTPLATFORM__ && formType !== 'AGE'}
      validateOnBlur={!!__WEBPLATFORM__}
      validate={handleValidate}
      onSubmit={props.onSubmit}
    >
      {(formikProps) => {
        const { errors, values, isSubmitting } = formikProps;
        const areErrorsPresent = checkIfKeysExist(errors);
        const areFieldsEmpty = hasEmptyStringValue(values);
        const areFieldsWellFormatted = values.birthYear.length === 4;

        // if submitting or there are validation errors, do not allow submit
        const disableSubmit = isSubmitting || areErrorsPresent || areFieldsEmpty || !areFieldsWellFormatted;

        return children({ ...formikProps, disableSubmit });
      }}
    </Formik>
  );
};

export default AgeGateProvider;
