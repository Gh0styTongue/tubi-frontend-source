import { DialogType } from '@tubitv/analytics/lib/dialog';
import { Button, ErrorMessage } from '@tubitv/web-ui';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import type { AgeGateChildrenProps } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import useAppSelector from 'common/hooks/useAppSelector';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { getRegisterErrorMessage } from 'web/features/authentication/utils/auth';

import AgeField from './AgeField/AgeField';
import styles from './AgeGateForm.scss';
import messages from './ageGateFormMessages';
import DateOfBirthField from './DateOfBirthField/DateOfBirthField';
import GenderField from './GenderField/GenderField';
import PersonalizationField from './PersonalizationField/PersonalizationField';
import YearOfBirthField from './YearOfBirthField/YearOfBirthField';

interface Target {
  name: string;
  value: string;
}
interface FormEvent {
  target: Target
}

type FormType = 'FULL' | 'YEAR_OF_BIRTH' | 'AGE';

interface Props {
  className?: string;
  intl: IntlShape;
  asModal?: boolean;
  hasGenderField?: boolean;
  username?: string;
  trackRegisterProcess?: ((e: FormEvent) => void) | null;
  isRegistering?: boolean;
  formType?: FormType;
}

export type AllProps = Props & AgeGateChildrenProps;

export interface InputValue {
  label: string;
  value: string;
}

const { SUBMIT } = REGISTRATION_FORM_FIELD_NAMES;

export const AgeGateForm: React.FunctionComponent<AllProps> = (props): React.ReactElement => {
  const {
    className,
    errors,
    asModal = false,
    hasGenderField = false,
    username = '',
    intl,
    handleSubmit,
    status = {},
    formType = 'AGE',
    disableSubmit,
    isSubmitting,
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

  useEffect(() => {
    trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.BIRTHDAY));
  }, []);

  const mainClassNames = classNames(styles.main, className,
    { [styles.asModal]: asModal });

  const header = username
    ? formatMessage(asModal ? messages.headerForReturningUser : messages.headerForNewUser, { username })
    : formatMessage(messages.headerForGuestUser);
  const subheader = formType === 'YEAR_OF_BIRTH'
    ? formatMessage(messages.subheaderForYOB)
    : (username ? formatMessage(messages.subheader) : null);

  const birthdayField = {
    FULL: () => <DateOfBirthField {...props} />,
    YEAR_OF_BIRTH: () => <YearOfBirthField {...props} />,
    AGE: () => <AgeField {...props} />,
  }[formType]();

  const termsUrl = (url: React.ReactNode[]) => <a href={`https://${url}`} target="_blank">{url}</a>;
  const supportEmail = (label: React.ReactNode[]) => <a href="https://www.tubi.tv/support" target="_blank">{label}</a>;

  return (
    <form onSubmit={handleSubmit} data-test-id="age-gate-form">
      <div className={mainClassNames}>
        <div className={styles.headers}>
          <h1 className={styles.header}>{header}</h1>
          {asModal && !isEmpty(subheader) && <div className={styles.subheader}>{subheader}</div>}
        </div>
        <div className={styles.form}>
          {errorMessage && <ErrorMessage message={errorMessage} />}
          {birthdayField}
          {hasGenderField && (
            <div className={styles.genderWrapper}>
              <div className={styles.fieldHeader}>{formatMessage(messages.genderHeaderLabel)}</div>
              <GenderField {...props} />
            </div>
          )}
          {!asModal && (
            <div className={styles.support}>
              <a href="https://tubitv.com/help-center/About-Tubi/articles/4409975236635" target="_blank">{formatMessage(messages.support)}</a>
            </div>
          )}
          {(!asModal && isGDPREnabled) && (
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
            {formatMessage(messages.submitLabel)}
          </Button>
          {!asModal && (
            <div className={styles.statement}>
              <p>
                {formatMessage(messages.termsAgreement, {
                  termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
                  privacyLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.privacy}>{msg}</Link>,
                })}
              </p>
            </div>
          )}
        </div>
        {asModal && (
          <div className={styles.support}>
            {formatMessage(messages.support2, { termsUrl, supportEmail })}
          </div>
        )}
      </div>
    </form>);
};

export default injectIntl(AgeGateForm);
