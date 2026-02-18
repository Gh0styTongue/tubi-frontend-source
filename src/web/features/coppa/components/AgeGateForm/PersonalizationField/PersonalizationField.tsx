import type { FormikProps } from 'formik';
import React from 'react';
import type { SVGProps } from 'react';
import { useIntl } from 'react-intl';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import type { FormValues } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';

import styles from './PersonalizationField.scss';
import messages from '../ageGateFormMessages';

const { PERSONALIZED_EMAILS } = REGISTRATION_FORM_FIELD_NAMES;

const Checkmark = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 10"
    fill="none"
    {...props}
  >
    <path
      d="M5.0285 9.15013L11.1126 2.6864C11.518 2.25688 11.518 1.55974 11.1126 1.12912C10.7072 0.698497 10.0519 0.698497 9.64655 1.12912L4.29546 6.8142L2.35347 4.7525C1.94807 4.32188 1.29176 4.32188 0.887394 4.7525C0.481993 5.18313 0.481993 5.87917 0.887394 6.30979L3.56242 9.15013C3.7646 9.36489 4.10418 9.47282 4.29546 9.47282C4.50858 9.47282 4.82632 9.36489 5.0285 9.15013Z"
    />
  </svg>
);

export interface PersonalizationFieldProps {
  values: FormValues;
  setFieldValue: FormikProps<FormValues>['setFieldValue'];
}

const PersonalizationField: React.FC<PersonalizationFieldProps> = ({ values, setFieldValue }) => {
  const intl = useIntl();

  const checked = values.personalizedEmails;

  const handleSelectChange = /* istanbul ignore next */() => {
    setFieldValue(PERSONALIZED_EMAILS, !values.personalizedEmails);
  };

  return (
    <div className={styles.wrapper} data-test-id="personalization-field">
      <label htmlFor={PERSONALIZED_EMAILS}>
        <div className={styles.icon}>
          {checked ? <Checkmark /> : null}
        </div>
        <input
          id={PERSONALIZED_EMAILS}
          type="checkbox"
          checked={checked}
          onChange={handleSelectChange}
        />
        <span>{intl.formatMessage(messages.personalizationAgreement)}</span>
      </label>
    </div>
  );
};

export default PersonalizationField;
