/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import Input from '@adrise/web-ui/lib/Input/Input';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import FormData from 'form-data';
import type { FormikBag, FormikErrors, FormikProps } from 'formik';
import { withFormik } from 'formik';
import type { Location } from 'history';
import React, { useEffect, useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { submitSupport } from 'common/actions/support';
import FileInput from 'common/components/FileInput/FileInput';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  ALLOWED_STUBIOS_DMCA_FIELDS,
  STUBIOS_DMCA_COPYRIGHT_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID,
  STUBIOS_DMCA_BELIEF_OF_UNAUTHORIZED_STATEMENT_FIELD_ID,
  STUBIOS_DMCA_COPYRIGHTED_TYPE_FIELD_ID,
  STUBIOS_DMCA_COPYRIGHT_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID,
  STUBIOS_DMCA_INFORMATION_DISCLOSURE_CONSENT_STATEMENT_FIELD_ID,
  STUBIOS_DMCA_ISSUE_TYPE_FIELD_ID,
  STUBIOS_DMCA_REPORTER_INFORMATION_FIELD_ID,
  STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELD_ID,
  REQUIRED_STUBIOS_DMCA_OWNER_CONTACT_INFORMATION_FIELDS,
  REQUIRED_STUBIOS_DMCA_MAIN_FIELDS,
  REQUIRED_STUBIOS_DMCA_AUTHORIZED_REPRESENTATIVE_CONTACT_INFORMATION_FIELDS,
  REQUIRED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS,
  REQUIRED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS,
  REQUIRED_STUBIOS_DMCA_ISSUE_DETAILS_FIELDS,
  StubiosDMCATrademarkRegistrationValue,
  REQUIRED_STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELDS,
  REQUIRED_STUBIOS_DMCA_TRADEMARK_USE_FIELDS,
  StubiosDMCATrademarkReporterValue,
  StubiosDMCACopyrightReporterValue,
  REQUIRED_STUBIOS_DMCA_COPYRIGHT_STATEMENT_FIELDS,
  REQUIRED_STUBIOS_DMCA_TRADEMARK_STATEMENT_FIELDS,
  STUBIOS_DMCA_TRADEMARK_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID,
  STUBIOS_DMCA_TRADEMARK_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID,
  StubiosDMCAPlatformValue,
} from 'common/constants/stubios';
import {
  ES_LOCALE_ID,
  MAX_SCREENSHOTS_LENGTH,
  MAX_TOTAL_SCREENSHOT_FILE_SIZE,
  MOBILE_METADATA_HEADERS,
  SCREENSHOTS_FIELD,
} from 'common/constants/support';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import type { User } from 'common/features/authentication/types/auth';
import { isSpanishLanguageSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { TicketField } from 'common/types/support';
import { sendGA4Event } from 'common/utils/ga';
import { isCopyrightInfringement, isTrademarkInfringement, isInfringementOnTubi, isInfringementOnStubios } from 'common/utils/IPRD';
import ComposedCheck from 'web/components/ComposedCheck/ComposedCheck';
import ComposedField from 'web/components/ComposedField/ComposedField';
import ComposedSelect from 'web/components/ComposedSelect/ComposedSelect';

import { getFieldOptions } from './formOptions';
import styles from '../StaticPage.scss';

const messages = defineMessages({
  issueType: {
    description: 'input form field label',
    defaultMessage: 'What issue are you reporting?',
  },
  reporterInformation: {
    description: 'input form field label',
    defaultMessage: 'Who is reporting the issue?',
  },
  contactInformationDescription: {
    description: 'description for the contact information section',
    defaultMessage: 'Please provide the information below to report content that you believe violates or infringes your {issueType}. We may share your full complaint, including your contact information, with the person you are reporting.',
  },
  contactInformationDescriptionOnTubi: {
    description: 'description for the contact information section on Tubi',
    defaultMessage: 'Please provide the information below to report content that you believe violates or infringes your {issueType}. We may share your full complaint, including your contact information, with the party who provided the content.',
  },
  contactInformation: {
    description: 'section name',
    defaultMessage: 'Contact Information:',
  },
  ownersFullName: {
    description: 'input form field label',
    defaultMessage: '{issueType} owner\'s full name',
  },
  relationshipToOwner: {
    description: 'input form field label',
    defaultMessage: 'Relationship to {issueType} Owner',
  },
  name: {
    description: 'input form field label',
    defaultMessage: 'Your full name',
  },
  company: {
    description: 'input form field label',
    defaultMessage: 'Company',
  },
  jobTitle: {
    description: 'input form field label',
    defaultMessage: 'Job Title',
  },
  email: {
    description: 'input form field label',
    defaultMessage: 'Your email address',
  },
  streetAddress: {
    description: 'input form field label',
    defaultMessage: 'Street Address',
  },
  city: {
    description: 'input form field label',
    defaultMessage: 'City',
  },
  stateProvince: {
    description: 'input form field label',
    defaultMessage: 'State/Province',
  },
  postalCode: {
    description: 'input form field label',
    defaultMessage: 'Postal Code',
  },
  country: {
    description: 'input form field label',
    defaultMessage: 'Country',
  },
  phoneNumber: {
    description: 'input form field label',
    defaultMessage: 'Phone number',
  },
  copyrightOwnership: {
    description: 'section name',
    defaultMessage: 'Copyright Ownership:',
  },
  copyrightType: {
    description: 'input form field label',
    defaultMessage: 'Type of copyrighted work',
  },
  trademarkInformation: {
    description: 'section name',
    defaultMessage: 'Trademark Information:',
  },
  trademarkedWord: {
    description: 'input form field label',
    defaultMessage: 'Trademarked word or description of symbol',
  },
  trademarkHaveRegistration: {
    description: 'input form field label',
    defaultMessage: 'Do you have a trademark registration?',
  },
  trademarkRegistrationNumber: {
    description: 'input form field label',
    defaultMessage: 'Registration Number',
  },
  trademarkCountry: {
    description: 'input form field label',
    defaultMessage: 'Country of trademark office',
  },
  trademarkRegistrationURL: {
    description: 'input form field label',
    defaultMessage: 'URL of trademark registration',
  },
  trademarkUseDescription: {
    description: 'input form field label',
    defaultMessage: 'Description of trademark use',
  },
  screenshots: {
    description: 'input form field label',
    defaultMessage: 'Evidence of trademark use',
  },
  trademarkUseURL: {
    description: 'input form field label',
    defaultMessage: 'URL of trademark use',
  },
  copyrightedWorkDescription: {
    description: 'input form field label',
    defaultMessage: 'Description of work',
  },
  copyrightOriginalLink: {
    description: 'input form field label',
    defaultMessage: 'Link(s) to original work',
  },
  contentToReport: {
    description: 'section name',
    defaultMessage: 'Content to Report:',
  },
  stubiosContentLink: {
    description: 'input form field label',
    defaultMessage: 'Enter URL(s) of the content you wish to report',
  },
  reportedIssueDetails: {
    description: 'input form field label',
    defaultMessage: 'Provide details of the issue. (Please note, you may be liable for any damages, including legal fees, if you knowingly misrepresent the reported material)',
  },
  swornStatements: {
    description: 'section name',
    defaultMessage: 'Sworn Statements:',
  },
  signature: {
    description: 'section name',
    defaultMessage: 'Signature (Full Legal Name):',
  },
  signatureDescription: {
    description: 'input form field label',
    defaultMessage: 'I agree to the foregoing.',
  },
  nonOfAboveHint: {
    description: 'form hint',
    defaultMessage: 'Tubi can only process requests that are submitted by the owner of rights in a {issueType} or an authorized representative of a rights owner.',
  },
  success: {
    description:
      'success message after submitting the customer support form',
    defaultMessage: 'Message has been submitted. Thank you.',
  },
  home: {
    description: 'link text to go to the home page',
    defaultMessage: 'Home',
  },
  submit: {
    description: 'Submit form button text',
    defaultMessage: 'Submit',
  },
  requiredField: {
    description: 'form input field required message',
    defaultMessage: 'Required Field',
  },
  invalidEmail: {
    description: 'email address invalid error message',
    defaultMessage: 'Invalid email address',
  },
  maxFileSize: {
    description: 'screenshots invalid error message',
    defaultMessage: 'Max file size: 15MB',
  },
  maxFileLength: {
    description: 'screenshots invalid error message',
    defaultMessage: 'Max file length: 5',
  },
});

interface RouteProps {
  location: Location;
}

export interface FormValues {
  issueType?: string;
  reporterInformation?: string;
  copyrightType?: string;
  country?: string;
  trademarkHaveRegistration?: string;
  screenshots?: FileList;
  acknowledgementStatement?: string;
  beliefOfUnauthorizedUseStatement?: string;
  accuracyCertificationStatement?: string;
  informationDisclosureConsentStatement?: string;
  message?: string;
  email?: string;
  name?: string;
  platform?: string;
}

const SupportSuccess = () => {
  const intl = useIntl();
  return (
    <div className={styles.success}>
      <h1>{intl.formatMessage(messages.success)}</h1>
      <Link to={WEB_ROUTES.home}>
        <Button>{intl.formatMessage(messages.home)}</Button>
      </Link>
    </div>
  );
};

interface StateProps {
  isMobile?: boolean;
  ticketFieldIdMap: Record<number, TicketField>;
  dynamicContentMap: Record<string, string> | undefined;
  deviceId?: string;
  source?: string;
  sourcePlatform?: string;
}

interface OwnProps extends RouteProps {
  handleSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  status?: {
    success?: boolean;
    formError?: string;
  };
  values?: FormValues;
  errors?: FormikErrors<FormValues>;
  setFieldValue?: (field: string, value: string, shouldValidate?: boolean) => void;
  setFieldError?: (name: string, msg: string) => void;
}

export interface IPRDProps extends OwnProps, StateProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

export const IPRD: React.FunctionComponent<FormikProps<FormValues> & IPRDProps> = ({
  isMobile,
  ticketFieldIdMap,
  dynamicContentMap,
  handleSubmit,
  status,
  values,
  errors,
  setFieldError,
  setFieldValue,
  isSubmitting = false,
  source,
  sourcePlatform,
}) => {
  const intl = useIntl();
  const className = classNames(styles.formContainer, styles.supportForm);
  const { formError, success } = status ?? {};

  const issueOptions = useMemo(() => {
    const allOptions = getFieldOptions(ticketFieldIdMap[STUBIOS_DMCA_ISSUE_TYPE_FIELD_ID], intl.formatMessage, dynamicContentMap);

    if (values.platform === StubiosDMCAPlatformValue.stubios) {
      return allOptions.filter(option =>
        !option.value || // Keep default "Select One" option (empty value)
        isInfringementOnStubios(option.value)
      );
    }
    if (values.platform === StubiosDMCAPlatformValue.tubi) {
      return allOptions.filter(option =>
        !option.value || // Keep default "Select One" option (empty value)
        isInfringementOnTubi(option.value)
      );
    }

    return allOptions;
  }, [ticketFieldIdMap, intl, dynamicContentMap, values.platform]);
  const ownerOptions = useMemo(() => {
    const options = getFieldOptions(ticketFieldIdMap[STUBIOS_DMCA_REPORTER_INFORMATION_FIELD_ID], intl.formatMessage, dynamicContentMap);
    if (isTrademarkInfringement(values.issueType)) {
      return options.filter(item => !item.value || Object.values(StubiosDMCATrademarkReporterValue).includes(item.value as StubiosDMCATrademarkReporterValue));
    }
    return options.filter(item => !item.value || Object.values(StubiosDMCACopyrightReporterValue).includes(item.value as StubiosDMCACopyrightReporterValue));
  }, [ticketFieldIdMap, intl.formatMessage, dynamicContentMap, values.issueType]);
  const copyrightedTypeOptions = useMemo(() => {
    return getFieldOptions(ticketFieldIdMap[STUBIOS_DMCA_COPYRIGHTED_TYPE_FIELD_ID], intl.formatMessage, dynamicContentMap, false);
  }, [ticketFieldIdMap, intl, dynamicContentMap]);
  const trademarkRegistrationOptions = useMemo(() => {
    return getFieldOptions(ticketFieldIdMap[STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELD_ID], intl.formatMessage, dynamicContentMap, false);
  }, [ticketFieldIdMap, intl, dynamicContentMap]);
  const acknowledgementStatement = useMemo(() => {
    const fieldId = isTrademarkInfringement(values.issueType)
      ? STUBIOS_DMCA_TRADEMARK_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID
      : STUBIOS_DMCA_COPYRIGHT_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID;
    return [{
      value: 'Yes, I agree Acknowledgement statement',
      label: ticketFieldIdMap[fieldId]?.description,
    }];
  }, [ticketFieldIdMap, values.issueType]);
  const beliefOfUnauthorizedUseStatement = useMemo(() => {
    return [{
      value: `Yes, I agree ${ticketFieldIdMap[STUBIOS_DMCA_BELIEF_OF_UNAUTHORIZED_STATEMENT_FIELD_ID]?.title} statement`,
      label: ticketFieldIdMap[STUBIOS_DMCA_BELIEF_OF_UNAUTHORIZED_STATEMENT_FIELD_ID]?.description,
    }];
  }, [ticketFieldIdMap]);
  const accuracyCertificationStatement = useMemo(() => {
    const fieldId = isTrademarkInfringement(values.issueType)
      ? STUBIOS_DMCA_TRADEMARK_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID
      : STUBIOS_DMCA_COPYRIGHT_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID;
    return [{
      value: 'Yes, I agree Accuracy Certification statement',
      label: ticketFieldIdMap[fieldId]?.description,
    }];
  }, [ticketFieldIdMap, values.issueType]);
  const informationDisclosureConsentStatement = useMemo(() => {
    return [{
      value: `Yes, I agree ${ticketFieldIdMap[STUBIOS_DMCA_INFORMATION_DISCLOSURE_CONSENT_STATEMENT_FIELD_ID]?.title} statement`,
      label: ticketFieldIdMap[STUBIOS_DMCA_INFORMATION_DISCLOSURE_CONSENT_STATEMENT_FIELD_ID]?.description,
    }];
  }, [ticketFieldIdMap]);

  useEffect(() => {
    if (sourcePlatform) {
      sendGA4Event('tubi_app_nav', {
        currentPlatform: __WEBPLATFORM__,
        sourceContent: source,
        sourcePlatform,
      });
    }
  }, [source, sourcePlatform]);

  useEffect(() => {
    if (values.reporterInformation
      && values.reporterInformation !== StubiosDMCACopyrightReporterValue.none
      && ((isCopyrightInfringement(values.issueType) && Object.values(StubiosDMCATrademarkReporterValue).includes(values.reporterInformation as StubiosDMCATrademarkReporterValue))
      || (isTrademarkInfringement(values.issueType) && Object.values(StubiosDMCACopyrightReporterValue).includes(values.reporterInformation as StubiosDMCACopyrightReporterValue)))
    ) {
      setFieldValue('reporterInformation', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFieldValue, values.issueType]);

  if (success) {
    return <SupportSuccess />;
  }

  const itemCls = classNames(styles.flexItem);
  const needDetailsInformation = values.issueType && values.reporterInformation ? values.reporterInformation !== StubiosDMCACopyrightReporterValue.none : false;
  const needNoneOfAboveHint = values.issueType && values.reporterInformation ? values.reporterInformation === StubiosDMCACopyrightReporterValue.none : false;
  const issueType = isCopyrightInfringement(values.issueType) ? 'Copyright' : 'Trademark';

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {formError ? <p className={styles.errorText}>{formError}</p> : null}
      <div className={itemCls}>
        <ComposedSelect
          fixedLabel
          name="issueType"
          label={intl.formatMessage(messages.issueType)}
          native={isMobile}
          options={issueOptions}
          value={values?.issueType}
          error={errors?.issueType}
          handleSelectChange={setFieldValue}
          setFieldError={setFieldError}
          className={styles.selectInput}
        />
      </div>
      <div className={itemCls}>
        <ComposedSelect
          fixedLabel
          name="reporterInformation"
          label={intl.formatMessage(messages.reporterInformation)}
          native={isMobile}
          options={ownerOptions}
          value={values?.reporterInformation}
          error={errors?.reporterInformation}
          handleSelectChange={setFieldValue}
          setFieldError={setFieldError}
          className={styles.selectInput}
        />
      </div>
      {
        needDetailsInformation
          ? <div>
            <div className={itemCls}>
              <h3 className={itemCls}>
                {intl.formatMessage(values.platform === StubiosDMCAPlatformValue.tubi
                  ? messages.contactInformationDescriptionOnTubi
                  : messages.contactInformationDescription,
                { issueType: issueType.toLowerCase() })}
              </h3>
              <h3 className={itemCls}>
                {intl.formatMessage(messages.contactInformation)}
              </h3>
              <ComposedField
                component={Input}
                name="ownersFullName"
                label={intl.formatMessage(messages.ownersFullName, { issueType })}
                className={styles.textInput}
              />
            </div>
            {
              values.reporterInformation === StubiosDMCACopyrightReporterValue.copyrightAuthorizedRepresentative
              || values.reporterInformation === StubiosDMCATrademarkReporterValue.trademarkAuthorizedRepresentative
                ? <div className={itemCls}>
                  <ComposedField
                    component={Input}
                    name="relationshipToOwner"
                    label={intl.formatMessage(messages.relationshipToOwner, { issueType })}
                    className={styles.textInput}
                  />
                </div>
                : null
            }
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="name"
                label={intl.formatMessage(messages.name)}
                autoComplete="name"
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="company"
                label={intl.formatMessage(messages.company)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="jobTitle"
                label={intl.formatMessage(messages.jobTitle)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="email"
                label={intl.formatMessage(messages.email)}
                autoComplete="email"
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="streetAddress"
                label={intl.formatMessage(messages.streetAddress)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="city"
                label={intl.formatMessage(messages.city)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="stateProvince"
                label={intl.formatMessage(messages.stateProvince)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="postalCode"
                label={intl.formatMessage(messages.postalCode)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="country"
                label={intl.formatMessage(messages.country)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="phoneNumber"
                label={intl.formatMessage(messages.phoneNumber)}
                className={styles.textInput}
              />
            </div>
            {
              issueType === 'Copyright'
                ? <div>
                  <div className={itemCls}>
                    <h3 className={itemCls}>
                      {intl.formatMessage(messages.copyrightOwnership)}
                    </h3>
                    <h1 className={styles.formLabel}>{intl.formatMessage(messages.copyrightType)}</h1>
                    <ComposedCheck
                      name="copyrightType"
                      type="radio"
                      value={values?.copyrightType}
                      error={errors?.copyrightType}
                      options={copyrightedTypeOptions}
                      handleSelectChange={setFieldValue}
                      setFieldError={setFieldError}
                    />
                  </div>
                  <div className={itemCls}>
                    <ComposedField
                      component={Input}
                      name="copyrightedWorkDescription"
                      label={intl.formatMessage(messages.copyrightedWorkDescription)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={itemCls}>
                    <ComposedField
                      component={Input}
                      name="copyrightOriginalLink"
                      label={intl.formatMessage(messages.copyrightOriginalLink)}
                      className={styles.textInput}
                    />
                  </div>
                </div>
                : <div>
                  <div className={itemCls}>
                    <h3 className={itemCls}>
                      {intl.formatMessage(messages.trademarkInformation)}
                    </h3>
                    <ComposedField
                      component={Input}
                      name="trademarkedWord"
                      label={intl.formatMessage(messages.trademarkedWord)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={itemCls}>
                    <h1 className={styles.formLabel}>{intl.formatMessage(messages.trademarkHaveRegistration)}</h1>
                    <ComposedCheck
                      name="trademarkHaveRegistration"
                      type="radio"
                      value={values?.trademarkHaveRegistration}
                      error={errors?.trademarkHaveRegistration}
                      options={trademarkRegistrationOptions}
                      handleSelectChange={setFieldValue}
                      setFieldError={setFieldError}
                    />
                  </div>
                  {
                    values?.trademarkHaveRegistration === StubiosDMCATrademarkRegistrationValue.yes
                      ? <div>
                        <div className={itemCls}>
                          <ComposedField
                            component={Input}
                            name="trademarkRegistrationNumber"
                            label={intl.formatMessage(messages.trademarkRegistrationNumber)}
                            className={styles.textInput}
                          />
                        </div>
                        <div className={itemCls}>
                          <ComposedField
                            component={Input}
                            name="trademarkCountry"
                            label={intl.formatMessage(messages.trademarkCountry)}
                            className={styles.textInput}
                          />
                        </div>
                        <div className={itemCls}>
                          <ComposedField
                            component={Input}
                            name="trademarkRegistrationURL"
                            label={intl.formatMessage(messages.trademarkRegistrationURL)}
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                      : null
                  }
                  {
                    values?.trademarkHaveRegistration === 'no'
                      ? <div>
                        <div className={itemCls}>
                          <ComposedField
                            component={Input}
                            name="trademarkUseDescription"
                            label={intl.formatMessage(messages.trademarkUseDescription)}
                            className={styles.textInput}
                          />
                        </div>
                        <div className={itemCls}>
                          <FileInput
                            accept="image/png, image/jpeg"
                            multiple
                            label={intl.formatMessage(messages.screenshots)}
                            error={errors.screenshots}
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange={(fileList: FileList | null) => {
                              setFieldValue('screenshots', fileList);
                            }}
                          />
                        </div>
                        <div className={itemCls}>
                          <ComposedField
                            component={Input}
                            name="trademarkUseURL"
                            label={intl.formatMessage(messages.trademarkUseURL)}
                            className={styles.textInput}
                          />
                        </div>
                      </div>
                      : null
                  }
                </div>
            }
            <div className={itemCls}>
              <h3 className={itemCls}>
                {intl.formatMessage(messages.contentToReport)}
              </h3>
              <ComposedField
                component={Input}
                name="stubiosContentLink"
                label={intl.formatMessage(messages.stubiosContentLink)}
                className={styles.textInput}
              />
            </div>
            <div className={itemCls}>
              <ComposedField
                component={Input}
                name="reportedIssueDetails"
                tag="textarea"
                label={intl.formatMessage(messages.reportedIssueDetails)}
                fixedLabel
                className={classNames(styles.messageInput, styles.multipleLinesFixedLabel)}
              />
            </div>
            <div className={itemCls}>
              <h3 className={itemCls}>
                {intl.formatMessage(messages.swornStatements)}
              </h3>
              <ComposedCheck
                name="acknowledgementStatement"
                value={values?.acknowledgementStatement}
                error={errors?.acknowledgementStatement}
                options={acknowledgementStatement}
                handleSelectChange={setFieldValue}
                setFieldError={setFieldError}
              />
            </div>
            {
              isCopyrightInfringement(values.issueType)
                ? <div className={itemCls}>
                  <ComposedCheck
                    name="beliefOfUnauthorizedUseStatement"
                    value={values?.beliefOfUnauthorizedUseStatement}
                    error={errors?.beliefOfUnauthorizedUseStatement}
                    options={beliefOfUnauthorizedUseStatement}
                    handleSelectChange={setFieldValue}
                    setFieldError={setFieldError}
                  />
                </div> : null
            }
            <div className={itemCls}>
              <ComposedCheck
                name="accuracyCertificationStatement"
                value={values?.accuracyCertificationStatement}
                error={errors?.accuracyCertificationStatement}
                options={accuracyCertificationStatement}
                handleSelectChange={setFieldValue}
                setFieldError={setFieldError}
              />
            </div>
            <div className={itemCls}>
              <ComposedCheck
                name="informationDisclosureConsentStatement"
                value={values?.informationDisclosureConsentStatement}
                error={errors?.informationDisclosureConsentStatement}
                options={informationDisclosureConsentStatement}
                handleSelectChange={setFieldValue}
                setFieldError={setFieldError}
              />
            </div>
            <div className={itemCls}>
              <h3 className={itemCls}>
                {intl.formatMessage(messages.signature)}
              </h3>
              <ComposedField
                component={Input}
                name="signature"
                label={intl.formatMessage(messages.signatureDescription)}
                fixedLabel
                className={styles.textInput}
              />
            </div>
          </div>
          : null
      }
      {
        needNoneOfAboveHint
          ? <div className={itemCls}>
            <h3 className={itemCls}>
              {intl.formatMessage(messages.nonOfAboveHint, { issueType: issueType.toLowerCase() })}
            </h3>
          </div>
          : null
      }
      <div className={styles.buttonContainer}>
        <Button appearance="tertiary" type="submit" disabled={isSubmitting || needNoneOfAboveHint}>
          {intl.formatMessage(messages.submit)}
        </Button>
      </div>
    </form>
  );
};

const checkRequiredFields = (fields: string[], values: FormValues, errors: FormikErrors<FormValues>, errorMessage: string) => {
  fields.forEach(field => {
    if (!values[field as keyof FormValues]) {
      errors[field as keyof FormValues] = errorMessage;
    }
  });
};
export const validate = (values: FormValues | null, { intl }: IPRDProps) => {
  const errors: IPRDProps['errors'] = {};
  if (!values) return errors;

  checkRequiredFields(REQUIRED_STUBIOS_DMCA_MAIN_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
  if (values.screenshots && values.screenshots.length > MAX_SCREENSHOTS_LENGTH) {
    errors.screenshots = intl.formatMessage(messages.maxFileLength);
  }
  if (values.screenshots
    && Array.from(values.screenshots).reduce((size, file) => size + file.size, 0) > MAX_TOTAL_SCREENSHOT_FILE_SIZE
  ) {
    errors.screenshots = intl.formatMessage(messages.maxFileSize);
  }
  if (
    values?.email
    && !REGEX_EMAIL_VALIDATION.test(values.email)
  ) {
    errors.email = intl.formatMessage(messages.invalidEmail);
  }

  if (values.issueType && values.reporterInformation && values.reporterInformation !== StubiosDMCACopyrightReporterValue.none) {
    switch (values.reporterInformation) {
      case StubiosDMCACopyrightReporterValue.copyrightOwner:
      case StubiosDMCATrademarkReporterValue.trademarkOwner:
        checkRequiredFields(REQUIRED_STUBIOS_DMCA_OWNER_CONTACT_INFORMATION_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
        break;
      case StubiosDMCACopyrightReporterValue.copyrightAuthorizedRepresentative:
      case StubiosDMCATrademarkReporterValue.trademarkAuthorizedRepresentative:
        checkRequiredFields(REQUIRED_STUBIOS_DMCA_AUTHORIZED_REPRESENTATIVE_CONTACT_INFORMATION_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
        break;
      default:
        break;
    }
    if (isCopyrightInfringement(values.issueType)) {
      checkRequiredFields(REQUIRED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
      checkRequiredFields(REQUIRED_STUBIOS_DMCA_COPYRIGHT_STATEMENT_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
    } else if (isTrademarkInfringement(values.issueType)) {
      checkRequiredFields(REQUIRED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
      if (values.trademarkHaveRegistration === StubiosDMCATrademarkRegistrationValue.yes) {
        checkRequiredFields(REQUIRED_STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
      } else if (values.trademarkHaveRegistration === StubiosDMCATrademarkRegistrationValue.no) {
        checkRequiredFields(REQUIRED_STUBIOS_DMCA_TRADEMARK_USE_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
      }
      checkRequiredFields(REQUIRED_STUBIOS_DMCA_TRADEMARK_STATEMENT_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
    }
    checkRequiredFields(REQUIRED_STUBIOS_DMCA_ISSUE_DETAILS_FIELDS, values, errors, intl.formatMessage(messages.requiredField));
  }
  return errors;
};

const getFormData = (supportBody: FormValues = {}): FormData => {
  const { screenshots, ...otherFields } = supportBody;
  const formData = new FormData();
  if (screenshots) {
    for (let i = 0; i < screenshots.length; i++) {
      formData.append(SCREENSHOTS_FIELD, screenshots.item(i) as Blob);
    }
  }
  Object.keys(otherFields)
    .forEach(key => {
      formData.append(key, otherFields[key as keyof typeof otherFields]);
    });
  return formData;
};

export const handleSubmit = (data: FormValues | null, formikBag: FormikBag<IPRDProps, FormValues>) => {
  const { setSubmitting, setStatus, props } = formikBag;

  const supportKeys = Object.keys(data ?? {});
  const hasInvalidField = supportKeys.some((key) => !ALLOWED_STUBIOS_DMCA_FIELDS.includes(key));
  if (hasInvalidField) {
    setSubmitting(false);
    setStatus({ success: false, formError: 'Invalid key submitted' });
    return;
  }

  const formData = getFormData(data ?? {});
  props
    .dispatch(submitSupport(formData))
    .then(() => {
      setSubmitting(false);
      setStatus({ success: true, formError: '' });
    })
    .catch(({ message: formError }: Partial<FormValues>) => {
      setSubmitting(false);
      setStatus({ success: false, formError });
    });
};
const supportWithFormik = withFormik({
  mapPropsToValues: (props: IPRDProps) =>
    ALLOWED_STUBIOS_DMCA_FIELDS.reduce<FormValues>(
      (agg, key) => ({ ...agg, [key]: props[key as keyof IPRDProps] || '' }),
      {},
    ),
  validateOnChange: false,
  validateOnBlur: false,
  validate,
  handleSubmit,
})(IPRD);

export function mapStateToProps(state: StoreState, ownProps?: { params?: { platform?: string } }): StateProps & FormValues {
  const { auth, ui, support } = state;
  const { ticketFieldIdMap, dynamicContentLocaleMap, mobileMetadataHeaders } = support;
  const { isMobile } = ui;
  const dynamicContentMap = isSpanishLanguageSelector(state) ? dynamicContentLocaleMap[ES_LOCALE_ID] : undefined;
  let returnedProps: (StateProps & FormValues) = {
    isMobile,
    ticketFieldIdMap,
    dynamicContentMap,
  };
  if (auth.user) {
    returnedProps = {
      ...returnedProps,
      email: (auth.user as User).email,
      name: (auth.user as User).name,
    };
  } else {
    returnedProps = {
      ...returnedProps,
      email: mobileMetadataHeaders[MOBILE_METADATA_HEADERS.email],
      name: mobileMetadataHeaders[MOBILE_METADATA_HEADERS.username],
    };
  }

  // Extract platform from URL params
  if (ownProps?.params?.platform) {
    returnedProps.platform = ownProps.params.platform;
  }

  return returnedProps;
}
const IPRDForm = connect(mapStateToProps)(injectIntl(supportWithFormik));
/**
 * StaticPage route expects functional component, so wrap the class here
 */
export default ({ location, params }: { location: Location; params?: { platform?: string } }) => <IPRDForm location={location} params={params} />;
