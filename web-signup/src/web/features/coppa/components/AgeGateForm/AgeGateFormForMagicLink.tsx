import { DialogType } from '@tubitv/analytics/lib/dialog';
import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect } from 'react';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router';

import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import ComposedField from 'web/components/ComposedField/ComposedField';
import { getRegisterErrorMessage } from 'web/features/authentication/utils/auth';

import AgeField from './AgeField/AgeField';
import type { AllProps } from './AgeGateForm';
import styles from './AgeGateForm.scss';
import messages from './ageGateFormMessages';
import GenderField from './GenderField/GenderField';

const { SUBMIT, FIRST_NAME } = REGISTRATION_FORM_FIELD_NAMES;

export const AgeGateFormForMagicLink: React.FunctionComponent<AllProps> = (props): React.ReactElement => {
  const {
    className,
    errors,
    intl,
    handleSubmit,
    status = {},
    disableSubmit,
    isSubmitting,
  } = props;
  const { formatMessage } = intl;
  const { formError } = status;
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

  const mainClassNames = classNames(styles.main, className);

  return (
    <form onSubmit={handleSubmit} data-test-id="age-gate-form">
      <div className={mainClassNames}>
        <div className={styles.headers}>
          <h1 className={classNames(styles.header, styles.forMagicLink)}>{formatMessage(messages.headerForMagicLink)}</h1>
          <div className={classNames(styles.subheader, styles.forMagicLink)}>{formatMessage(messages.subheaderForMagicLink)}</div>
        </div>
        <div className={styles.form}>
          {errorMessage && <ErrorMessage message={errorMessage} />}
          <div className={styles.firstNameWrapper}>
            <ComposedField
              component={TextInput}
              name={FIRST_NAME}
              label={formatMessage(messages.firstNameFieldLabel)}
              maxLength={60}
              autoComplete="given-name"
            />
          </div>
          <AgeField {...props} />
          <div className={classNames(styles.genderWrapper, styles.forMagicLink)}>
            <GenderField {...props} />
          </div>
          <div className={styles.support}>
            <a href="https://tubitv.com/help-center/About-Tubi/articles/4409975236635" target="_blank">{formatMessage(messages.support)}</a>
          </div>
          <Button
            name={SUBMIT}
            type="submit"
            appearance={disableSubmit && !isSubmitting ? 'tertiary' : 'primary'}
            disabled={disableSubmit}
            className={styles.button}
            loading={isSubmitting}
          >
            {formatMessage(messages.startWatching)}
          </Button>
          <div className={styles.statement}>
            <p>
              {formatMessage(messages.termsAgreementForMagicLink, {
                termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
                privacyLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.privacy}>{msg}</Link>,
              })}
            </p>
          </div>
        </div>
      </div>
    </form>);
};

export default injectIntl(AgeGateFormForMagicLink);
