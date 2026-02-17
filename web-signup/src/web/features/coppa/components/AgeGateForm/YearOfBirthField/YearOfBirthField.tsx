import { TextInput } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FormikProps } from 'formik';
import React, { useState } from 'react';
import type { IntlShape } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from '../AgeGateForm.scss';
import messages from '../ageGateFormMessages';

const { BIRTH_YEAR } = REGISTRATION_FORM_FIELD_NAMES;

export interface YearOfBirthFieldProps {
  intl: IntlShape;
  values: FormValues;
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
  asModal?: boolean;
}

const YearOfBirthField: React.FC<YearOfBirthFieldProps> = ({
  intl: { formatMessage },
  values,
  setFieldValue,
  asModal,
}) => {
  const onYobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(BIRTH_YEAR, e.target.value);
  };
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const onBlur = () => setShowPlaceholder(false);
  const onFocus = () => setShowPlaceholder(true);

  return (
    <div className={styles.yobWrapper}>
      <ComposedField
        className={styles.yob}
        component={TextInput}
        name={BIRTH_YEAR}
        label={formatMessage(messages.birthYearLabel2)}
        maxLength={4}
        type="number"
        onChange={onYobChange}
        autoFocus={asModal}
        handleBlur={onBlur}
        handleFocus={onFocus}
      />
      <div className={classNames(styles.yobPlaceholder, { [styles.active]: showPlaceholder })}>
        {Array.from(Array(Math.max(4 - (values.birthYear ?? '').length, 0)), () => 'Y').join('')}
      </div>
    </div>
  );
};

export default YearOfBirthField;
