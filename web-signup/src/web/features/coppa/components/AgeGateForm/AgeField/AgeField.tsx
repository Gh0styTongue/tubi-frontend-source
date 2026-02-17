import { TextInput } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FormikProps } from 'formik';
import React from 'react';
import type { IntlShape } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { convertAgeToBirthday } from 'common/utils/ageGate';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from '../AgeGateForm.scss';
import messages from '../ageGateFormMessages';

const {
  BIRTH_MONTH,
  BIRTH_DAY,
  BIRTH_YEAR,
  AGE,
} = REGISTRATION_FORM_FIELD_NAMES;

interface AgeFieldProps {
  intl: IntlShape;
  values: FormValues;
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  asModal?: boolean;
}

const AgeField: React.FC<AgeFieldProps> = ({
  intl: { formatMessage },
  values,
  setFieldValue,
  asModal,
}) => {
  const onAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { day, month, year } = convertAgeToBirthday(parseInt(e.target.value, 10));
    setFieldValue(AGE, e.target.value, false);
    setFieldValue(BIRTH_YEAR, year, false);
    setFieldValue(BIRTH_MONTH, month, false);
    setFieldValue(BIRTH_DAY, day);
  };
  const ageValueLength = (values.age ?? '').length;
  return (
    <div className={styles.ageWrapper}>
      <ComposedField
        className={styles.age}
        component={TextInput}
        name={AGE}
        label={formatMessage(messages.ageLabel)}
        maxLength={3}
        type="text"
        onChange={onAgeChange}
        autoFocus={asModal}
      />
      <div className={classNames(styles.agePlaceholder, { [styles.active]: Boolean(ageValueLength) })}>
        {Array.from(Array(Math.min(ageValueLength, 3)), () => '\u00A0\u00A0').join('')}
        {formatMessage(messages.years)}
      </div>
    </div>
  );
};

export default AgeField;
