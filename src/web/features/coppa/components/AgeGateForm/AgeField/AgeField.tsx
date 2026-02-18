import { TextInput } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FormikProps } from 'formik';
import React, { useCallback } from 'react';
import type { IntlShape } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { convertAgeToBirthday } from 'common/utils/ageGate';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from './AgeField.scss';
import type { AllProps } from '../AgeGateForm';
import messages from '../ageGateFormMessages';

const { BIRTH_MONTH, BIRTH_DAY, BIRTH_YEAR, AGE } = REGISTRATION_FORM_FIELD_NAMES;

interface AgeFieldProps {
  intl: IntlShape;
  values: FormValues;
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  asModal?: boolean;
  trackRegisterProcess?: AllProps['trackRegisterProcess'];
  isCompactView?: boolean;
}

const AgeField: React.FC<AgeFieldProps> = ({
  intl: { formatMessage },
  values,
  setFieldValue,
  asModal,
  trackRegisterProcess,
  isCompactView = false,
}) => {
  const ageValueLength = (values.age ?? '').length;

  const onAgeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { day, month, year } = convertAgeToBirthday(parseInt(e.target.value, 10));
      setFieldValue(AGE, e.target.value, false);
      setFieldValue(BIRTH_YEAR, year, false);
      setFieldValue(BIRTH_MONTH, month, false);
      setFieldValue(BIRTH_DAY, day);
    },
    [setFieldValue]
  );

  const maxLength = 3;

  return (
    <div className={styles.ageWrapper}>
      <ComposedField
        className={styles.age}
        component={TextInput}
        name={AGE}
        label={formatMessage(messages.ageLabel)}
        maxLength={maxLength}
        type="text"
        onChange={onAgeChange}
        autoFocus={asModal}
        handleBlur={trackRegisterProcess}
      />
      {isCompactView ? null : (
        <div className={classNames(styles.agePlaceholder, { [styles.active]: Boolean(ageValueLength) })}>
          {'\u00A0'.repeat(Math.min(ageValueLength, maxLength) * 2 + 1)}
          {formatMessage(messages.years)}
        </div>
      )}
    </div>
  );
};

export default AgeField;
