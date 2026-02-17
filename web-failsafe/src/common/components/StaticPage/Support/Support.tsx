import { Input, Button } from '@tubitv/web-ui';
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
} from 'common/constants/support';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { platformMap } from 'common/constants/zendesk';
import type { User } from 'common/features/authentication/types/auth';
import { isSpanishLanguageSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { TicketField } from 'common/types/support';
import { sendGA4Event } from 'common/utils/ga';
import ComposedField from 'web/components/ComposedField/ComposedField';
import ComposedSelect from 'web/components/ComposedSelect/ComposedSelect';

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
});

interface QueryParams {
  contentId?: string;
  deviceId?: string;
  platform?: string;
  source?: string;
  title?: string;
}

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
  const nameCls = classNames(styles.flexItem);
  const emailCls = classNames(styles.flexItem);
  const platformCls = classNames(styles.flexItem);
  const titleClass = classNames(styles.flexItem);
  const topicCls = classNames(styles.flexItem);
  const subtopicCls = classNames(styles.flexItem);
  const messageCls = classNames(styles.flexItem);

  const subtopic = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.topic || '']];
  const detail = ticketFieldIdMap[SUB_FIELD_ID_MAP[values.subtopic || '']];

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
    return getFieldOptions(detail, intl.formatMessage, dynamicContentMap);
  }, [detail, intl, dynamicContentMap]);

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

  if (success) {
    return <SupportSuccess />;
  }

  const shouldShowTitleField = values.subtopic && SUBTOPICS_NEED_TITLE_FIELD.includes(values.subtopic);

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {formError ? <p className={styles.errorText}>{formError}</p> : null}
      <div className={nameCls}>
        <ComposedField
          component={Input}
          name="name"
          label={intl.formatMessage(messages.name)}
          autoComplete="name"
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
          className={styles.textInput}
        />
      </div>
      <div className={platformCls}>
        <ComposedSelect
          fixedLabel
          name="platform"
          label={intl.formatMessage(messages.platform)}
          native={isMobile}
          options={platformOptions}
          value={values?.platform}
          error={errors?.platform}
          handleSelectChange={setFieldValue}
          setFieldError={setFieldError}
          className={styles.selectInput}
        />
      </div>
      <div className={topicCls}>
        <ComposedSelect
          fixedLabel
          name="topic"
          label={intl.formatMessage(messages.topic)}
          native={isMobile}
          options={topicOptions}
          value={values?.topic}
          error={errors?.topic}
          setFieldError={setFieldError}
          handleSelectChange={setFieldValue}
          className={styles.selectInput}
        />
      </div>
      {subtopic ? (
        <div className={subtopicCls}>
          <ComposedSelect
            fixedLabel
            name="subtopic"
            label={intl.formatMessage(messages.subtopic)}
            native={isMobile}
            options={subtopicOptions}
            value={values?.subtopic}
            error={errors?.subtopic}
            setFieldError={setFieldError}
            handleSelectChange={setFieldValue}
            className={styles.selectInput}
          />
        </div>
      ) : null}
      {detail ? (
        <div className={classNames(styles.flexItem)}>
          <ComposedSelect
            fixedLabel
            name="detail"
            label={intl.formatMessage(messages.detail)}
            native={isMobile}
            options={detailOptions}
            value={values?.detail}
            error={errors?.detail}
            setFieldError={setFieldError}
            handleSelectChange={setFieldValue}
            className={styles.selectInput}
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
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button appearance="tertiary" type="submit" disabled={isSubmitting}>
          {intl.formatMessage(messages.submit)}
        </Button>
      </div>
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
  Object.keys(otherFields ?? {})
    .forEach(key => {
      formData.append(key, otherFields[key]);
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
    ALLOWED_SUPPORT_FIELDS.reduce(
      (agg, key) => ({ ...agg, [key]: props[key] || '' }),
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
    const query: QueryParams = { contentId: '', title: '' };
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
