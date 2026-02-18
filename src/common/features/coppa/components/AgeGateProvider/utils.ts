/**
 * Utility functions for age gate form validation and initialization.
 */
import { DialogType } from '@tubitv/analytics/lib/dialog';
import type { FormikErrors } from 'formik';
import type React from 'react';
import type { IntlShape } from 'react-intl';

import * as eventTypes from 'common/constants/event-types';
import { getAge, getYOBAge, isAgeValid, isValidDay, isValidMonth, isValidYear } from 'common/utils/ageGate';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import type { FormValues, Props } from './AgeGateProvider';
import { messages } from './messages';

type PropsForValidate = Pick<Props, 'hasGenderField' | 'hasFirstNameField' | 'formType'>;
interface ValidateExtras {
  hasShownConfirmationRef: React.MutableRefObject<boolean>;
  intl: IntlShape;
}

/**
 * Validates age gate form values based on form type.
 * Handles full date, year of birth, and age input validation.
 * Shows confirmation dialog for potentially invalid ages (<=4 or >=100).
 */
export const validate = (values: FormValues, props: PropsForValidate, extras: ValidateExtras) => {
  const { hasGenderField, hasFirstNameField, formType = 'AGE' } = props;
  const { hasShownConfirmationRef, intl: { formatMessage } } = extras;
  const errors: FormikErrors<FormValues> = {};
  const keys: (keyof FormValues)[] = ['birthMonth', 'birthDay', 'birthYear'];
  if (hasGenderField) {
    keys.push('gender');
  }
  if (hasFirstNameField) {
    keys.push('firstName');
  }
  keys.forEach((key: keyof FormValues) => {
    if (!values[key]) {
      errors[key] = formatMessage(messages.required);
    }
  });

  const { birthYear, birthDay, birthMonth } = values;

  // YOB: validate when birth year length is equal or longer than 4.
  // When length is less than 4, don't validate as user is typing.
  if (formType === 'YEAR_OF_BIRTH' && birthYear.length < 4) {
    return errors;
  }

  switch (formType) {
    case 'YEAR_OF_BIRTH': {
      if (!isValidYear(parseInt(birthYear, 10))) {
        errors.birthYear = formatMessage(messages.invalidBirthYear);
        return errors;
      }
      break;
    }
    case 'AGE': {
      // Number will cast empty string to 0 which is a valid value now. So I changed it to parseInt to make empty string keep invalid.
      /* istanbul ignore next: values.age always has value when formType is AGE */
      if (!isAgeValid(parseInt(values.age ?? '', 10))) {
        errors.age = formatMessage(messages.invalidAge);
        return errors;
      }
      break;
    }
    default:
      if (birthMonth && !isValidMonth(parseInt(birthMonth, 10))) {
        errors.birthMonth = formatMessage(messages.wrongInfo);
      }

      // Invalid date
      if (birthDay && birthDay.length === 2 && !isValidDay(parseInt(birthDay, 10), parseInt(birthMonth, 10), parseInt(birthYear, 10))) {
        errors.birthDay = formatMessage(messages.wrongInfo);
      }

      // Invalid year
      if (birthYear && !isValidDay(parseInt(birthDay, 10), parseInt(birthMonth, 10), parseInt(birthYear, 10))) {
        errors.birthYear = formatMessage(messages.wrongInfo);
      }
      break;
  }

  if (birthYear && birthMonth && birthDay) {
    const age = (formType === 'YEAR_OF_BIRTH' ? getYOBAge : getAge)(new Date(Date.UTC(
      parseInt(birthYear, 10), // year
      parseInt(birthMonth, 10) - 1, // monthIndex
      parseInt(birthDay, 10), // day
    )), { precision: 0 });
    const shouldShowAgeConfirmation = age <= 4 || age >= 100;
    if (!hasShownConfirmationRef.current && shouldShowAgeConfirmation) {
      trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.BIRTHDAY, 'age_less_than_4'));
      hasShownConfirmationRef.current = true;
      errors.needsAgeConfirmation = formatMessage(messages.potentiallyInvalidAge);
    }
  }

  return errors;
};

/**
 * Returns initial form values based on form type and field configuration.
 * For year of birth forms, defaults to Dec 31 to avoid partial date issues.
 */
export const getInitialValues = (props: Props) => {
  const { formType = 'AGE', hasGenderField, hasFirstNameField } = props;
  const isYob = formType === 'YEAR_OF_BIRTH';
  const initialValues: FormValues = {
    birthMonth: isYob ? '12' : '',
    birthDay: isYob ? '31' : '',
    birthYear: '',
  };
  if (formType === 'AGE') {
    initialValues.age = '';
  }
  if (hasGenderField) {
    initialValues.gender = '';
  }
  if (hasFirstNameField) {
    initialValues.firstName = '';
  }
  return initialValues;
};
