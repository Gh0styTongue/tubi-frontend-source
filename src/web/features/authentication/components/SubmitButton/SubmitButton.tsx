import { Button } from '@tubitv/web-ui';
import type { FormikProps } from 'formik';
import React from 'react';
import { useIntl } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { checkIfKeysExist, hasEmptyStringValue } from 'common/utils/collection';
import authMessages from 'web/features/authentication/constants/auth-message';

type Props = FormikProps<{}>;

const { SUBMIT } = REGISTRATION_FORM_FIELD_NAMES;

const SubmitButton = ({ errors, values, isSubmitting }: Props) => {
  const { formatMessage } = useIntl();

  const areErrorsPresent = checkIfKeysExist(errors);
  const hasEmptyValue = hasEmptyStringValue(values);
  const disableSubmit = isSubmitting || areErrorsPresent || hasEmptyValue;

  return (
    <Button
      name={SUBMIT}
      type="submit"
      appearance={disableSubmit && !isSubmitting ? 'tertiary' : 'primary'}
      disabled={disableSubmit}
      loading={isSubmitting}
    >
      {formatMessage(authMessages.submit)}
    </Button>
  );
};

export default SubmitButton;
