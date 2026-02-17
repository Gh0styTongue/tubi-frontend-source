import { Dropdown } from '@tubitv/web-ui';
import type { FormikProps } from 'formik';
import React, { useEffect, useState } from 'react';
import type { IntlFormatters, IntlShape } from 'react-intl';

import { genderOptionsMessages, REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';

import type { AllProps, InputValue } from '../AgeGateForm';
import messages from '../ageGateFormMessages';

const { GENDER } = REGISTRATION_FORM_FIELD_NAMES;

interface GenderFieldProps {
  intl: IntlShape;
  values: FormValues;
  setFieldError: FormikProps<FormValues>['setFieldError'];
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  setFieldTouched: FormikProps<FormValues>['setFieldTouched'];
  trackRegisterProcess?: AllProps['trackRegisterProcess'];
}

const getGenderOptions = (formatMessage: IntlFormatters['formatMessage']): InputValue[] => {
  return [
    { label: formatMessage(genderOptionsMessages.male), value: 'MALE' },
    { label: formatMessage(genderOptionsMessages.female), value: 'FEMALE' },
    { label: formatMessage(genderOptionsMessages.other), value: 'OTHER' },
  ];
};

const GenderField: React.FC<GenderFieldProps> = ({
  intl: { formatMessage },
  values,
  setFieldValue,
  setFieldTouched,
  trackRegisterProcess,
}) => {
  const [genderOptions, updateGender] = useState<InputValue[]>([]);

  useEffect(() => {
    updateGender(getGenderOptions(formatMessage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGenderSelect = (option: InputValue) => {
    const name = GENDER;
    const { value } = option;
    if (trackRegisterProcess) {
      trackRegisterProcess({ target: { name, value } });
    }
    setFieldValue(name, value);
    setFieldTouched(name);
  };

  return (
    <Dropdown
      name={GENDER}
      label={formatMessage(messages.genderFieldLabel)}
      options={genderOptions}
      value={values.gender}
      onSelect={onGenderSelect}
    />
  );
};

export default GenderField;
