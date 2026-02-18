import useLatestForEffect from '@adrise/utils/lib/useLatestForEffect';
import { Dropdown } from '@tubitv/web-ui';
import type { FormikProps } from 'formik';
import React, { useCallback, useEffect, useState } from 'react';
import type { IntlFormatters, IntlShape } from 'react-intl';

import { genderOptionsMessages, REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';

import type { AllProps, InputValue } from '../AgeGateForm';
import messages from '../ageGateFormMessages';

const { GENDER } = REGISTRATION_FORM_FIELD_NAMES;

interface GenderFieldProps {
  intl: IntlShape;
  values: FormValues;
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  setFieldTouched: FormikProps<FormValues>['setFieldTouched'];
  trackRegisterProcess?: AllProps['trackRegisterProcess'];
  isCompactView?: boolean;
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
  isCompactView = false,
}) => {
  const [genderOptions, updateGender] = useState<InputValue[]>([]);

  // Store values in refs to ensure the effect callback gets the latest values
  // while the effect only runs on mount (and cleanup only runs on unmount)
  const formatMessageRef = useLatestForEffect(formatMessage);

  useEffect(() => {
    updateGender(getGenderOptions(formatMessageRef.current));
  }, [formatMessageRef]);

  const labelMessage = isCompactView ? messages.genderHeaderLabel : messages.genderFieldLabel;
  const onGenderSelect = useCallback((option: InputValue) => {
    const name = GENDER;
    const { value } = option;
    if (trackRegisterProcess) {
      trackRegisterProcess({ target: { name, value } });
    }
    setFieldValue(name, value);
    setFieldTouched(name);
  }, [trackRegisterProcess, setFieldValue, setFieldTouched]);

  return (
    <Dropdown
      name={GENDER}
      label={formatMessage(labelMessage)}
      options={genderOptions}
      value={values.gender}
      onSelect={onGenderSelect}
    />
  );
};

export default GenderField;
