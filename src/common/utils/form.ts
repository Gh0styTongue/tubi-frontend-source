import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { REGEX_NAME_INVALID_CHARS } from 'common/constants/validate-rules';
import logger from 'common/helpers/logging';

const messages = defineMessages({
  required: {
    description: 'required field for input error',
    defaultMessage: 'Required Field',
  },
  spaces: {
    description: 'password form field error',
    defaultMessage: 'Password cannot contain blank space(s)',
  },
  length: {
    description: 'password form field error',
    defaultMessage: 'Length must be between 6 and 30',
  },
  match: {
    description: 'password form field error',
    defaultMessage: 'Passwords do not match',
  },
  invalidName: {
    description: 'name form field error for invalid characters',
    defaultMessage: 'The following characters are not accepted: < > & " \' ` , ! @ $ % ( ) = + \'{\' \'}\' [ ]. Please try again.',
  },
});

type FieldKeys = readonly string[];

type Options<T> = {
  intl: IntlShape;
  fieldKeys?: T;
};

type FormValues<T extends FieldKeys> = {
  [P in T[number]]: string;
} & Record<string, string>;

type FormErrors<T extends FieldKeys> = {
  [P in T[number]]?: string;
};

/**
 * custom function used primarily by formik.js forms to check for any validation errors in your form
 * @param values - object containing your fields for validation
 * returns an object with errors
 */
export const validatePasswords = <T extends FieldKeys = readonly ['password', 'password2']>(
  values: FormValues<T>,
  { intl, fieldKeys }: Options<T>
): FormErrors<T> => {
  const errors: FormErrors<T> = {};
  const currentFieldKeys = fieldKeys || ['password', 'password2'];
  currentFieldKeys.forEach((key) => {
    if (!values[key]) {
      errors[key as keyof typeof errors] = intl.formatMessage(messages.required);
    }
  });
  const [password, password2] = currentFieldKeys;
  if (values[password]) {
    const pwdLength = values[password].length;
    if (values[password].indexOf(' ') >= 0) {
      errors[password as keyof typeof errors] = intl.formatMessage(messages.spaces);
    }
    if (pwdLength < 6 || pwdLength > 30) {
      errors[password as keyof typeof errors] = intl.formatMessage(messages.length);
    }
    if (password2 && values[password] !== values[password2]) {
      errors[password2 as keyof typeof errors] = intl.formatMessage(messages.match);
    }
  }
  return errors;
};

export const isNameInvalid = (name: string) => REGEX_NAME_INVALID_CHARS.test(name);

export const validateFirstName = ({ firstName, intl }: {
  firstName?: string;
  intl: IntlShape;
}) => {
  const errors: { firstName?: string } = {};
  if (firstName && isNameInvalid(firstName)) {
    errors[REGISTRATION_FORM_FIELD_NAMES.FIRST_NAME] = intl.formatMessage(messages.invalidName);
    logger.info(errors, 'Invalid name submitted');
  }
  return errors;
};
