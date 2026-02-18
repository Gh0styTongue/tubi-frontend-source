import { ChevronRight, LockClosed24 } from '@tubitv/icons';
import { TextInput, ATag, Button, ErrorMessage } from '@tubitv/web-ui';
import type { FormikProps, FormikErrors, FormikBag, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import omit from 'lodash/omit';
import React, { useCallback, useEffect } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { webKeys } from 'common/constants/key-map';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector, hasPINSelector } from 'common/selectors/userSettings';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { checkIfKeysExist, hasEmptyStringValue } from 'common/utils/collection';
import ComposedField from 'web/components/ComposedField/ComposedField';
import authMessages from 'web/features/authentication/constants/auth-message';

import { ERROR } from './constants';
import messages, { contentSettingMessages, errorMessages } from '../messages';
import styles from './SetupForm.scss';
import type { FormValues } from '../types';
import { submitSetupForm, preloadRatingImages } from './utils';

type IntlProps = {
  intl: IntlShape;
}

type ConnectProps = {
  dispatch: TubiThunkDispatch;
};

type PropsWithoutFormik = WithRouterProps & IntlProps & ConnectProps;

export type Props = PropsWithoutFormik & FormikProps<FormValues>;

export const FORM_FIELD_NAMES = {
  ACTIVATION_CODE: 'activationCode',
  ADMIN_ACCOUNT: 'adminAccount',
  KIDS_FIRST_NAME: 'kidsFirstName',
  CONTENT_SETTING: 'contentSetting',
  KIDS_PIN: 'kidsPIN',
} as const;

export const SetupForm = ({ intl, location, values, errors, status, isSubmitting, handleSubmit }: Props) => {
  const { formatMessage } = intl;
  const { ACTIVATION_CODE, ADMIN_ACCOUNT, KIDS_FIRST_NAME, CONTENT_SETTING, KIDS_PIN } = FORM_FIELD_NAMES;
  const firstName = useAppSelector(firstNameSelector);
  const hasPIN = useAppSelector(hasPINSelector);

  const contentSetting = values.contentSetting ? `${formatMessage(contentSettingMessages.optionPrefix)} ${formatMessage(contentSettingMessages[values.contentSetting])}` : '';
  const handleClickContentSetting = useCallback(() => {
    tubiHistory.push({
      pathname: WEB_ROUTES.contentSetting,
      state: {
        form: values,
      },
    });
  }, [values]);
  const handleKeydownContentSetting = useCallback((e: React.KeyboardEvent) => {
    if ([webKeys.arrowRight, webKeys.enter].includes(e.keyCode)) {
      e.preventDefault();
      e.stopPropagation();
      handleClickContentSetting();
    }
  }, [handleClickContentSetting]);

  const disableSubmit = isSubmitting || checkIfKeysExist(errors) || hasEmptyStringValue(omit(values, KIDS_PIN));

  useEffect(() => {
    tubiHistory.replace({
      pathname: location.pathname,
      query: location.query,
      state: {
        form: values,
      },
    });
    // deliberately ignore `location.query`, because the intention here is to save the form values into state.
    // adding `location.query` into the deps would cause a render loop: Main -> SetupForm(useEffect) -> Main
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, location.pathname]);

  useEffect(() => {
    preloadRatingImages();
  }, []);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.activationCode}>
        <ComposedField
          containerClass={styles.field}
          component={TextInput}
          name={ACTIVATION_CODE}
          type="hidden"
        />
      </div>
      {status?.errorMessage && <ErrorMessage message={status!.errorMessage} />}
      <div className={styles.adminAccount}>
        <ComposedField
          containerClass={styles.field}
          component={TextInput}
          name={ADMIN_ACCOUNT}
          value={firstName}
          label={formatMessage(messages.adminAccount)}
          disabled
        />
        <div className={styles.avatar} />
      </div>
      <div>{formatMessage(messages.tip)}</div>
      <ComposedField
        containerClass={styles.field}
        component={TextInput}
        name={KIDS_FIRST_NAME}
        label={formatMessage(messages.kidsFirstName)}
        maxLength={60}
        autoComplete="given-name"
        autoFocus={!values.kidsFirstName}
      />
      <div onClick={handleClickContentSetting} className={styles.contentSetting}>
        <ComposedField
          containerClass={styles.field}
          component={TextInput}
          name={CONTENT_SETTING}
          label={formatMessage(messages.contentSetting)}
          onClick={handleClickContentSetting}
          onKeyDown={handleKeydownContentSetting}
          type="radio"
          checked={!!values.contentSetting}
        />
        <span>{contentSetting}</span>
        <ChevronRight />
      </div>
      <div className={styles.pin}>
        <ComposedField
          containerClass={styles.field}
          component={TextInput}
          name={KIDS_PIN}
          label={formatMessage(hasPIN ? messages.pinExisted : messages.pinEmpty)}
          enablePasswordToggle={!hasPIN}
          canShowPassword
          maxLength={4}
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          autoComplete="off"
          disabled={hasPIN}
        />
        {hasPIN ? <LockClosed24 /> : null}
        <div className={styles.pinDesc}>
          <div>{formatMessage(hasPIN ? messages.pinExistedDesc : messages.pinEmptyDesc, { br: <br /> })}</div>
          <span>{formatMessage(messages.pinDescMore)}</span>
        </div>
      </div>
      <div className={styles.terms}>
        {formatMessage(messages.terms, {
          termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
          mailLink: ([msg]: React.ReactNode[]) => <ATag to={`mailto:${msg}`}>{msg}</ATag>,
        })}
      </div>
      <div className={styles.submit}>
        <Button
          type="submit"
          appearance={disableSubmit ? 'tertiary' : 'primary'}
          disabled={disableSubmit}
          width="theme"
        >{formatMessage(messages.submit)}</Button>
      </div>
    </form>
  );
};

const handleSubmit = async (values: FormValues, formikBag: FormikBag<PropsWithoutFormik, FormValues>) => {
  try {
    await submitSetupForm(values, formikBag);
    tubiHistory.push({
      pathname: WEB_ROUTES.addKidsSuccess,
      state: {
        form: values,
      },
    });
  } catch (error) {
    const { props: { intl }, setFieldError, setStatus } = formikBag;
    if (error.status !== 400) {
      setStatus({ errorMessage: intl.formatMessage(authMessages.unknownError) });
      return;
    }
    // 400 Errors
    // handle name/rating/PIN error first
    if (error.code === ERROR.DUPLICATE_KID_NAME) {
      setFieldError('kidsFirstName', intl.formatMessage(errorMessages.duplicateKidName));
    } else if (error.code === ERROR.INVALID_NAME_CHARS) {
      setFieldError('kidsFirstName', error.message);
    } else if (error.code === ERROR.TOO_MANY_KIDS) {
      tubiHistory.push({ pathname: WEB_ROUTES.addKidsError });
    } else if (error.code.startsWith('ACTIVATION_')) {
      // on activation field error [ACTIVATION_CODE_NOT_FOUND, ACTIVATION_CODE_EXPIRED, ACTIVATION_CODE_ALREADY_USED]
      // render <ActivationCodeForm />, allow user to try the code again
      tubiHistory.replace({
        pathname: WEB_ROUTES.addKids,
        state: {
          form: values,
          error,
        },
      });
    } else {
      setStatus({ errorMessage: intl.formatMessage(authMessages.unknownError) });
    }
  }
};

export const withFormikConfig: WithFormikConfig<PropsWithoutFormik, FormValues> = {
  // ensure that mapPropsToValues is called on location.state change (using deep equality check)
  enableReinitialize: true,
  mapPropsToValues: ({ location }) => {
    return {
      kidsFirstName: '',
      contentSetting: '',
      activationCode: location.query?.code || '',
      ...location.state?.form,
    };
  },
  handleSubmit,
  validate: (values, props) => {
    const { formatMessage } = props.intl;
    const { KIDS_FIRST_NAME, CONTENT_SETTING, KIDS_PIN } = FORM_FIELD_NAMES;
    const fieldsRequired = [KIDS_FIRST_NAME, CONTENT_SETTING] as const;
    const errors: FormikErrors<FormValues> = {};
    fieldsRequired.forEach((key) => {
      if (!values[key]) {
        errors[key] = formatMessage(errorMessages.required);
      }
    });

    if (values[KIDS_PIN] && !/^\d{4}$/.test(values[KIDS_PIN])) {
      errors[KIDS_PIN] = formatMessage(errorMessages.invalidPIN);
    }

    return errors;
  },
};

export default injectIntl(withRouter(connect()(withFormik(withFormikConfig)(SetupForm))));
