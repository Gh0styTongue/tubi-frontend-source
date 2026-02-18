import { Button, ErrorMessage } from '@tubitv/web-ui';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import type { IntlShape } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import type { AgeGateChildrenProps } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import { getRegisterErrorMessage } from 'web/features/authentication/utils/auth';

import AgeField from './AgeField/AgeField';
import type { AllProps } from './AgeGateForm';
import styles from './AgeGateForm.scss';
import messages from './ageGateFormMessages';
import DateOfBirthField from './DateOfBirthField/DateOfBirthField';
import GenderField from './GenderField/GenderField';
import PersonalizationField from './PersonalizationField/PersonalizationField';
import YearOfBirthField from './YearOfBirthField/YearOfBirthField';

type FormType = 'FULL' | 'YEAR_OF_BIRTH' | 'AGE';

const { SUBMIT } = REGISTRATION_FORM_FIELD_NAMES;

type AgeGateFieldsProps = AgeGateChildrenProps & {
  formType?: FormType,
  hasGenderField?: boolean;
  showGenderTip?: boolean;
  submitLabel?: string;
  trackRegisterProcess?: AllProps['trackRegisterProcess'];
  intl: IntlShape,
}

const AgeGateFields = (props: AgeGateFieldsProps) => {
  const {
    formType = 'AGE',
    hasGenderField = false,
    showGenderTip,
    submitLabel,
    intl,
    // formik props
    errors,
    status = {},
    disableSubmit,
    isSubmitting,
    handleSubmit,
  } = props;
  const { formatMessage } = intl;
  const { formError } = status;
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  const shouldShowRegisterError = !isEmpty(formError) && !COPPA_ERROR_STATUS_CODES.includes(formError.status);
  let errorMessage;
  if (shouldShowRegisterError) {
    errorMessage = getRegisterErrorMessage(intl)(formError);
  } else if (errors.needsAgeConfirmation) {
    errorMessage = errors.needsAgeConfirmation;
  }

  const birthdayField = {
    FULL: () => <DateOfBirthField {...props} />,
    YEAR_OF_BIRTH: () => <YearOfBirthField {...props} />,
    AGE: () => <AgeField {...props} />,
  }[formType]();

  return (
    <form onSubmit={handleSubmit} data-test-id="age-gate-form">
      <div className={styles.form}>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {birthdayField}
        {hasGenderField && (
          <div className={styles.genderWrapper}>
            {showGenderTip && (<div className={styles.fieldHeader}>{formatMessage(messages.genderHeaderLabel)}</div>)}
            <GenderField {...props} />
          </div>
        )}
        {showGenderTip && (
          <div className={styles.support}>
            <a href="https://tubitv.com/help-center/About-Tubi/articles/4409975236635" target="_blank">{formatMessage(messages.support)}</a>
          </div>
        )}
        {isGDPREnabled && (
          <PersonalizationField {...props} />
        )}
        <Button
          name={SUBMIT}
          type="submit"
          appearance={disableSubmit && !isSubmitting ? 'tertiary' : 'primary'}
          disabled={disableSubmit}
          className={styles.button}
          loading={isSubmitting}
        >
          {submitLabel || formatMessage(messages.submitLabel)}
        </Button>
      </div>
    </form>
  );
};

export default AgeGateFields;
