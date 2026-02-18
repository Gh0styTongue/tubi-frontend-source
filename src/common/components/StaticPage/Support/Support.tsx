import { Input, Button, Dropdown } from '@tubitv/web-ui';
import classNames from 'classnames';
import FormData from 'form-data';
import type { FormikBag, FormikErrors, FormikProps } from 'formik';
import { withFormik } from 'formik';
import type { Location } from 'history';
import React, { useEffect, useMemo, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { submitSupport } from 'common/actions/support';
import FileInput from 'common/components/FileInput/FileInput';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  ALLOWED_SUPPORT_FIELDS,
  ANDROID_MOBILE_PLATFORM_VALUE,
  ANDROID_TV_PLATFORM_VALUE,
  ANDROID_AUTO_PLATFORM_VALUE,
  ES_LOCALE_ID,
  IOS_PLATFORM_VALUE,
  MAX_SCREENSHOTS_LENGTH,
  MAX_TOTAL_SCREENSHOT_FILE_SIZE,
  MOBILE_METADATA_HEADERS,
  PLATFORM_FIELD_ID,
  SCREENSHOTS_FIELD,
  SUBTOPICS_NEED_TITLE_FIELD,
  SUB_FIELD_ID_MAP,
  TOPIC_FIELD_ID,
  SUBTOPICS_NEED_VERSION_FIELD,
  COPYRIGHT_INFRINGEMENT_DETAIL_FIELD_VALUE,
} from 'common/constants/support';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { platformMap } from 'common/constants/zendesk';
import type { User } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { countryCodeSelector, isSpanishLanguageSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { TicketField } from 'common/types/support';
import { sendGA4Event } from 'common/utils/ga';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import ComposedField from 'web/components/ComposedField/ComposedField';
import { useSierraChat } from 'web/containers/HelpCenter/SierraChatClient/sierraChatHooks';
import { sierraChatEnabledSelector } from 'web/containers/HelpCenter/SierraChatClient/sierraChatSelector';
import { handleChatBotClick, SIERRA_CHAT_BUTTON_ID } from 'web/containers/HelpCenter/SierraChatClient/SierraChatUtils';

import { getFieldOptions } from './formOptions';
import styles from '../StaticPage.scss';

const messages = defineMessages({
  success: {
    description:
      'success message after submitting the customer support form',
    defaultMessage: 'Message has been submitted. Thank you.',
  },
  home: {
    description: 'link text to go to the home page',
    defaultMessage: 'Home',
  },
  name: {
    description: 'input form field label',
    defaultMessage: 'Name',
  },
  email: {
    description: 'input form field label',
    defaultMessage: 'Email',
  },
  movie: {
    description: 'input form field label',
    defaultMessage: 'The name of the movie / show / channel I\'m watching is...',
  },
  appVersion: {
    description: 'app version input form field label',
    defaultMessage: 'App version',
  },
  softwareVersion: {
    description: 'software version input form field label',
    defaultMessage: 'Software version',
  },
  platform: {
    description: 'input form field label',
    defaultMessage: 'I\'m watching Tubi on...',
  },
  topic: {
    description: 'input form field label',
    defaultMessage: 'I want to...',
  },
  subtopic: {
    description: 'input form field label',
    defaultMessage: 'Regarding...',
  },
  detail: {
    description: 'input form field label',
    defaultMessage: 'Specifically...',
  },
  screenshots: {
    description: 'input form field label',
    defaultMessage: 'Submit screenshots',
  },
  message: {
    description: 'input form field label',
    defaultMessage: 'How can we help?',
  },
  messageDescription: {
    description: 'input form field description',
    defaultMessage: 'Please enter the details of your request. A member of our support staff will respond as soon as possible.',
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
  chatWithUs: {
    description: 'chat with us link text',
    defaultMessage: 'Chat With Us',
  },
  supportFormTitle: {
    description: 'support form title',
    defaultMessage: 'Support Request Form',
  },
  supportFormDescription: {
    description: 'support form description',
    defaultMessage: 'Please fill out this form to submit a support request.',
  },
  formErrors: {
    description: 'Form errors announcement',
    defaultMessage: 'Form has errors: {errors}',
  },
  screenshot: {
    description: 'screenshot error message',
    defaultMessage: 'Screenshot',
  },
  fieldError: {
    description: 'Individual field error',
    defaultMessage: '{field}: {error}',
  },
  kidsMode: {
    description: 'kids mode label',
    defaultMessage: 'Kids Accounts/Kids Mode',
  },
});

interface RouteProps {
  location: Location;
}

export interface FormValues {
  name?: string;
  email?: string;
  title?: string;
  platform?: string;
  topic?: string;
  subtopic?: string;
  appVersion?: string;
  softwareVersion?: string;
  detail?: string;
  message?: string;
  screenshots?: FileList;
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

export interface SupportProps extends OwnProps, StateProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

export const Support: React.FunctionComponent<FormikProps<FormValues> & SupportProps> = ({
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
  const nameCls = classNames(styles.flexItem);
  const emailCls = classNames(styles.flexItem);
  const platformCls = classNames(styles.flexItem);
  const titleClass = classNames(styles.flexItem);
  const topicCls = classNames(styles.flexItem);
  const subtopicCls = classNames(styles.flexItem);
  const messageCls = classNames(styles.flexItem);

  const subtopic = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.topic || '']];
  const detail = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.subtopic || '']];

  const twoDigitCountryCode = useAppSelector(countryCodeSelector);
  const isKidsModeAvailableInCountry = isFeatureAvailableInCountry(
    'kidsMode',
    twoDigitCountryCode
  );
  const isKidsAccountsAvailableInCountry = isFeatureAvailableInCountry(
    'kidsAccounts',
    twoDigitCountryCode
  );

  const platformOptions = useMemo(() => {
    return getFieldOptions(ticketFieldIdMap[PLATFORM_FIELD_ID], intl.formatMessage, dynamicContentMap);
  }, [ticketFieldIdMap, intl, dynamicContentMap]);
  const topicOptions = useMemo(() => {
    return getFieldOptions(ticketFieldIdMap[TOPIC_FIELD_ID], intl.formatMessage, dynamicContentMap);
  }, [ticketFieldIdMap, intl, dynamicContentMap]);
  const subtopicOptions = useMemo(() => {
    return getFieldOptions(subtopic, intl.formatMessage, dynamicContentMap);
  }, [subtopic, intl, dynamicContentMap]);
  const detailOptions = useMemo(() => {
    const options = getFieldOptions(detail, intl.formatMessage, dynamicContentMap);
    const isKidsOption = (opt: { value: string; label: string }) => {
      const valueLc = opt.value.toLowerCase();
      const labelLc = (opt.label || '').trim().toLowerCase();
      return (
        valueLc === 'detail-kids_mode'
        || (valueLc.includes('kids') && valueLc.includes('mode'))
        || labelLc.includes('kids mode')
      );
    };
    if (!isKidsModeAvailableInCountry) {
      return options.filter(opt => !isKidsOption(opt));
    }
    if (isKidsAccountsAvailableInCountry) {
      return options.map(opt => (isKidsOption(opt)
        ? { ...opt, label: intl.formatMessage(messages.kidsMode) }
        : opt));
    }
    return options;
  }, [detail, intl, dynamicContentMap, isKidsModeAvailableInCountry, isKidsAccountsAvailableInCountry]);

  const isCxChatbotEnabled = useAppSelector(sierraChatEnabledSelector);

  useSierraChat(isCxChatbotEnabled);

  useEffect(() => {
    setFieldValue('subtopic', '');
  }, [setFieldValue, subtopic?.id]);

  useEffect(() => {
    setFieldValue('detail', '');
  }, [setFieldValue, detail?.id]);

  useEffect(() => {
    if (sourcePlatform) {
      sendGA4Event('tubi_app_nav', {
        currentPlatform: __WEBPLATFORM__,
        sourceContent: source,
        sourcePlatform,
      });
    }
  }, [source, sourcePlatform]);

  const [announceErrors, setAnnounceErrors] = useState(false);
  const errorsRef = useLatest(errors);

  useEffect(() => {
    if (!announceErrors && Object.keys(errorsRef.current).length > 0) {
      setTimeout(() => {
        setAnnounceErrors(true);
      }, 1000);
    }
  }, [announceErrors, errorsRef]);

  if (success) {
    return <SupportSuccess />;
  }

  const shouldShowTitleField = values.subtopic && SUBTOPICS_NEED_TITLE_FIELD.includes(values.subtopic);
  const shouldShowVersionField = values.subtopic && SUBTOPICS_NEED_VERSION_FIELD.includes(values.subtopic);

  const handleFormSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    // Clear any previous error announcements
    setAnnounceErrors(false);

    // Submit the form
    handleSubmit(event);
  };

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      name: intl.formatMessage(messages.name),
      email: intl.formatMessage(messages.email),
      platform: intl.formatMessage(messages.platform),
      topic: intl.formatMessage(messages.topic),
      subtopic: intl.formatMessage(messages.subtopic),
      detail: intl.formatMessage(messages.detail),
      message: intl.formatMessage(messages.message),
      screenshot: intl.formatMessage(messages.screenshot),
    };
    return fieldNames[field] || field;
  };

  const createDropdownOnSelect = (fieldName: string) => (option: { value: string }) => {
    setFieldValue(fieldName, option.value);
    if (errors?.[fieldName as keyof typeof errors]) {
      setFieldError(fieldName, '');
    }
  };

  const onDetailSelect = (option: { value: string }) => {
    if (option.value === COPYRIGHT_INFRINGEMENT_DETAIL_FIELD_VALUE) {
      tubiHistory.push(`${WEB_ROUTES.IPRDLanding}/tubi`);
      return;
    }
    createDropdownOnSelect('detail')(option);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={className}
      noValidate
      aria-labelledby="support-form-title"
      aria-describedby="support-form-description"
    >
      <h2 id="support-form-title" className={styles['sr-only']}>{intl.formatMessage(messages.supportFormTitle)}</h2>
      <p id="support-form-description" className={styles['sr-only']}>{intl.formatMessage(messages.supportFormDescription)}</p>
      {formError ? <p className={styles.errorText}>{formError}</p> : null}
      <div className={nameCls}>
        <ComposedField
          component={Input}
          name="name"
          label={intl.formatMessage(messages.name)}
          autoComplete="given-name"
          aria-autocomplete="none"
          aria-haspopup="false"
          className={styles.textInput}
        />
      </div>
      <div className={emailCls}>
        <ComposedField
          component={Input}
          name="email"
          type="email"
          label={intl.formatMessage(messages.email)}
          autoComplete="email"
          aria-autocomplete="none"
          aria-haspopup="false"
          className={styles.textInput}
          required
        />
      </div>
      <div className={platformCls}>
        <Dropdown
          name="platform"
          label={intl.formatMessage(messages.platform)}
          options={platformOptions.map(opt => ({ value: opt.value, label: opt.label || opt.value }))}
          defaultOption={platformOptions
            .map(opt => ({ value: opt.value, label: opt.label || opt.value }))
            .find(option => option.value === values?.platform)}
          onSelect={createDropdownOnSelect('platform')}
          error={errors?.platform}
          aria-describedby={errors?.platform ? 'platform-error' : undefined}
          className={styles.selectInput}
          lightMode
        />
      </div>
      <div className={topicCls}>
        <Dropdown
          name="topic"
          label={intl.formatMessage(messages.topic)}
          options={topicOptions.map(opt => ({ value: opt.value, label: opt.label || opt.value }))}
          defaultOption={topicOptions
            .map(opt => ({ value: opt.value, label: opt.label || opt.value }))
            .find(option => option.value === values?.topic)}
          onSelect={createDropdownOnSelect('topic')}
          error={errors?.topic}
          aria-describedby={errors?.topic ? 'topic-error' : undefined}
          className={styles.selectInput}
          lightMode
        />
      </div>
      {subtopic ? (
        <div className={subtopicCls}>
          <Dropdown
            name="subtopic"
            label={intl.formatMessage(messages.subtopic)}
            options={subtopicOptions.map(opt => ({ value: opt.value, label: opt.label || opt.value }))}
            defaultOption={subtopicOptions
              .map(opt => ({ value: opt.value, label: opt.label || opt.value }))
              .find(option => option.value === values?.subtopic)}
            onSelect={createDropdownOnSelect('subtopic')}
            error={errors?.subtopic}
            aria-describedby={errors?.subtopic ? 'subtopic-error' : undefined}
            className={styles.selectInput}
            lightMode
          />
        </div>
      ) : null}
      {shouldShowVersionField ? [
        <div className={styles.flexItem}>
          <ComposedField
            component={Input}
            name="appVersion"
            label={intl.formatMessage(messages.appVersion)}
            className={styles.textInput}
            aria-haspopup="false"
          />
        </div>,
        <div className={styles.flexItem}>
          <ComposedField
            component={Input}
            name="softwareVersion"
            label={intl.formatMessage(messages.softwareVersion)}
            className={styles.textInput}
            aria-haspopup="false"
          />
        </div>,
      ] : null}
      {detail ? (
        <div className={classNames(styles.flexItem)}>
          <Dropdown
            name="detail"
            label={intl.formatMessage(messages.detail)}
            options={detailOptions.map(opt => ({ value: opt.value, label: opt.label || opt.value }))}
            defaultOption={detailOptions
              .map(opt => ({ value: opt.value, label: opt.label || opt.value }))
              .find(option => option.value === values?.detail)}
            onSelect={onDetailSelect}
            error={errors?.detail}
            aria-describedby={errors?.detail ? 'detail-error' : undefined}
            className={styles.selectInput}
            lightMode
          />
        </div>
      ) : null}
      {shouldShowTitleField ? (
        <div className={titleClass}>
          <ComposedField
            component={Input}
            name="title"
            label={intl.formatMessage(messages.movie)}
            className={styles.textInput}
            aria-haspopup="false"
          />
        </div>
      ) : null}
      <div className={classNames(styles.flexItem)}>
        {/* file type is not supported by formik, so we cannot use ComposedField and need to set the value manually */}
        <FileInput
          accept="image/png, image/jpeg"
          multiple
          label={intl.formatMessage(messages.screenshots)}
          error={errors.screenshots}
          onChange={(fileList: FileList | null) => {
            setFieldValue('screenshots', fileList);
          }}
          aria-describedby={errors.screenshots ? 'screenshots-error' : undefined}
          aria-invalid={!!errors.screenshots}
        />
      </div>
      <div className={messageCls}>
        <ComposedField
          component={Input}
          name="message"
          tag="textarea"
          label={intl.formatMessage(messages.message)}
          hint={intl.formatMessage(messages.messageDescription)}
          fixedLabel
          className={styles.messageInput}
          aria-haspopup="false"
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button appearance="tertiary" type="submit" disabled={isSubmitting}>
          {intl.formatMessage(messages.submit)}
        </Button>
      </div>
      {isCxChatbotEnabled && (
        <div className={classNames(styles.buttonContainer, styles.chatButton)}>
          <Button
            appearance="tertiary"
            onClick={handleChatBotClick}
            id={SIERRA_CHAT_BUTTON_ID}
            className={styles.sierraChatButton}
          >
            {intl.formatMessage(messages.chatWithUs)}
          </Button>
        </div>
      )}
      {announceErrors ? (
        <div aria-live="assertive" aria-atomic="true" role="alert" className={styles['sr-only']}>
          {intl.formatMessage(messages.formErrors, {
            errors: Object.entries(errors)
              .filter(([_, error]) => error)
              .map(([field, error]) => `${getFieldDisplayName(field)}: ${error}`)
              .join('. '),
          })}
        </div>
      ) : null}
    </form>
  );
};

export const validate = (values: FormValues | null, { intl, ticketFieldIdMap }: SupportProps) => {
  const errors: SupportProps['errors'] = {};
  if (!values) return errors;

  if (!values.email) {
    errors.email = intl.formatMessage(messages.requiredField);
  }
  if (
    values?.email
    && !REGEX_EMAIL_VALIDATION.test(values.email)
  ) {
    errors.email = intl.formatMessage(messages.invalidEmail);
  }
  if (!values.platform) {
    errors.platform = intl.formatMessage(messages.requiredField);
  }
  if (!values.topic) {
    errors.topic = intl.formatMessage(messages.requiredField);
  }
  const hasSubfieldOptions = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.topic || '']]?.custom_field_options;
  if (hasSubfieldOptions && !values.subtopic) {
    errors.subtopic = intl.formatMessage(messages.requiredField);
  }
  const hasDetailOptions = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.subtopic || '']]?.custom_field_options;
  if (hasDetailOptions && !values.detail) {
    errors.detail = intl.formatMessage(messages.requiredField);
  }
  const shouldShowTitleField = values.subtopic && SUBTOPICS_NEED_TITLE_FIELD.includes(values.subtopic);
  if (shouldShowTitleField && !values.title) {
    errors.title = intl.formatMessage(messages.requiredField);
  }
  const shouldShowVersionField = values.subtopic && SUBTOPICS_NEED_VERSION_FIELD.includes(values.subtopic);
  if (shouldShowVersionField) {
    if (!values.appVersion) {
      errors.appVersion = intl.formatMessage(messages.requiredField);
    }
    if (!values.softwareVersion) {
      errors.softwareVersion = intl.formatMessage(messages.requiredField);
    }
  }
  if (values.screenshots && values.screenshots.length > MAX_SCREENSHOTS_LENGTH) {
    errors.screenshots = intl.formatMessage(messages.maxFileLength);
  }
  if (values.screenshots
    && Array.from(values.screenshots).reduce((size, file) => size + file.size, 0) > MAX_TOTAL_SCREENSHOT_FILE_SIZE
  ) {
    errors.screenshots = intl.formatMessage(messages.maxFileSize);
  }
  if (!values.message) {
    errors.message = intl.formatMessage(messages.requiredField);
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

export const handleSubmit = (data: FormValues | null, formikBag: FormikBag<SupportProps, FormValues>) => {
  const { setSubmitting, setStatus, props } = formikBag;

  const supportKeys = Object.keys(data ?? {});
  const hasInvalidField = supportKeys.some((key) => !ALLOWED_SUPPORT_FIELDS.includes(key));
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
  mapPropsToValues: (props: SupportProps) =>
    ALLOWED_SUPPORT_FIELDS.reduce<FormValues>(
      (agg, key) => ({ ...agg, [key]: props[key as keyof SupportProps] || '' }),
      {},
    ),
  validateOnChange: false,
  validateOnBlur: false,
  validate,
  handleSubmit,
})(Support);

export function getPlatformByHeader(header?: string) {
  if (!header) return undefined;
  const platformLowerCase = header.toLocaleLowerCase();
  if (platformLowerCase.includes('android')) {
    if (platformLowerCase.includes('tv')) {
      return ANDROID_TV_PLATFORM_VALUE;
    }
    if (platformLowerCase.includes('auto')) {
      return ANDROID_AUTO_PLATFORM_VALUE;
    }
    return ANDROID_MOBILE_PLATFORM_VALUE;
  }
  if (platformLowerCase.includes('iphone')) {
    return IOS_PLATFORM_VALUE;
  }
}

export function mapStateToProps(state: StoreState, ownProps: OwnProps): StateProps & FormValues {
  const { auth, ui, support } = state;
  const { ticketFieldIdMap, dynamicContentLocaleMap, mobileMetadataHeaders } = support;
  const { isMobile } = ui;
  const platformHeader = mobileMetadataHeaders[MOBILE_METADATA_HEADERS.platform];
  const platformOptions = ticketFieldIdMap[PLATFORM_FIELD_ID]?.custom_field_options;
  let platform = getPlatformByHeader(platformHeader);
  // reset platform if it does not exist in the options
  if (platform && !platformOptions?.map(({ value }) => value).includes(platform)) {
    platform = undefined;
  }
  const dynamicContentMap = isSpanishLanguageSelector(state) ? dynamicContentLocaleMap[ES_LOCALE_ID] : undefined;
  let returnedProps: (StateProps & FormValues) = {
    isMobile,
    ticketFieldIdMap,
    dynamicContentMap,
    platform,
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
  if (ownProps && ownProps.location && ownProps.location.search) {
    const query: Record<string, string> = { contentId: '', title: '' };
    const vars = ownProps.location.search.substring(1).split('&');
    for (const thisVar of vars) {
      const pair = thisVar.split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    // e.g. { contentId: '305457', title: 'Imagine That' }
    if (query.title && query.contentId) {
      returnedProps.title = `${query.title} - ${query.contentId}`;
    }
    if (query.platform) {
      returnedProps.sourcePlatform = query.platform;
      // if available, use the platform value from query parameter to auto-fill the zendesk platform field
      const zendeskPlatform = platformMap[query.platform]?.zendeskPlatformValue;
      if (zendeskPlatform && platformOptions?.map(({ value }) => value).includes(zendeskPlatform)) {
        returnedProps.platform = zendeskPlatform;
      }
    }
    // if deviceId is present in the query params, adding it to props here will send this deviceId with the support form
    returnedProps.deviceId = query.deviceId;
    returnedProps.source = query.source;
  }
  return returnedProps;
}
const SupportForm = connect(mapStateToProps)(injectIntl(supportWithFormik));

/**
 * StaticPage route expects functional component, so wrap the class here
 */
export default ({ location }: { location: Location }) => <SupportForm location={location} />;
