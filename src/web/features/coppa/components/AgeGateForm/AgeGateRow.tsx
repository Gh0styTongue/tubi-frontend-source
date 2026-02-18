import type { FormikProps } from 'formik';
import React from 'react';
import { useIntl } from 'react-intl';

import type { FormValues as AgeGateFormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { trackRegisterProcess } from 'web/features/authentication/utils/track';
import AgeField from 'web/features/coppa/components/AgeGateForm/AgeField/AgeField';
import GenderField from 'web/features/coppa/components/AgeGateForm/GenderField/GenderField';

import styles from './AgeGateRow.scss';

type Props = Pick<FormikProps<AgeGateFormValues>, 'values' | 'touched' | 'errors' | 'setFieldValue' | 'setFieldTouched'>;

const AgeGateRow = ({
  values,
  touched,
  errors,
  setFieldValue,
  setFieldTouched,
}: Props) => {
  const intl = useIntl();

  const ageFieldError = errors.age || errors.needsAgeConfirmation;

  return (
    <div>
      <div className={styles.ageGateRow}>
        <AgeField
          intl={intl}
          values={values}
          setFieldValue={setFieldValue}
          trackRegisterProcess={trackRegisterProcess}
          isCompactView
        />
        <GenderField
          intl={intl}
          values={values}
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
          trackRegisterProcess={trackRegisterProcess}
          isCompactView
        />
      </div>
      {touched.age && ageFieldError ? (
        <div className={styles.ageGateError}>{ageFieldError}</div>
      ) : null}
    </div>
  );
};

export default AgeGateRow;
