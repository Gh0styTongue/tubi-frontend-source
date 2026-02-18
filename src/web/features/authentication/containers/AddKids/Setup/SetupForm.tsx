import useLatestForEffect from '@adrise/utils/lib/useLatestForEffect';
import { ChevronRight, LockClosed24 } from '@tubitv/icons';
import { TextInput, Button, ErrorMessage, ATag, OnOffSwitch } from '@tubitv/web-ui';
import type { FormikProps, FormikErrors, FormikBag, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import omit from 'lodash/omit';
import React, { useCallback, useEffect, useRef } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { ADD_KID_FORM_FIELD_NAMES } from 'common/constants/constants';
import { webKeys } from 'common/constants/key-map';
import { WEB_ROUTES } from 'common/constants/routes';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import { getPendingAdmin, usePendingAdmin } from 'common/features/authentication/store/pendingAdminStore';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { usePreviousDistinct } from 'common/hooks/usePreviousDistinct';
import { firstNameSelector, hasPINSelector, userAvatarUrlSelector } from 'common/selectors/userSettings';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { checkIfKeysExist, hasEmptyStringValue } from 'common/utils/collection';
import ComposedField from 'web/components/ComposedField/ComposedField';
import { handleAddKidsAccountSuccess } from 'web/features/authentication/actions/multipleAccounts';
import authMessages from 'web/features/authentication/constants/auth-message';
import { trackRegisterProcess } from 'web/features/authentication/utils/track';

import { ERROR, HELP_CENTER_ARTICLE, NEXT_ACTION } from '../constants';
import messages, { contentSettingMessages, errorMessages } from '../messages';
import styles from './Setup.scss';
import type { FormValues } from '../types';
import { submitSetupForm, preloadRatingImages } from '../utils';

type IntlProps = {
  intl: IntlShape;
}

type StateProps = {
  hasPINFromState: boolean;
}

type ConnectProps = StateProps & {
  dispatch: TubiThunkDispatch;
};

type OwnProps = {
  kids?: any[];
}

type PropsWithoutFormik = WithRouterProps & IntlProps & ConnectProps & OwnProps;

export type Props = PropsWithoutFormik & FormikProps<FormValues>;

const { ACTIVATION_CODE, ADMIN_ACCOUNT, KIDS_FIRST_NAME, CONTENT_SETTING, KIDS_PIN } = ADD_KID_FORM_FIELD_NAMES;

export const SetupForm = ({ intl, hasPINFromState, location, values, errors, status, isSubmitting, setFieldValue, handleSubmit }: Props) => {
  const { formatMessage } = intl;
  const firstName = useAppSelector(firstNameSelector);
  const userAvatarUrl = useAppSelector(userAvatarUrlSelector);

  // Use pending admin from store (when user selected an admin from AddAccount flow)
  // Fall back to current user's info (when user is already logged in as admin)
  const pendingAdmin = usePendingAdmin();
  const adminName = pendingAdmin?.name || firstName;
  const adminAvatarUrl = pendingAdmin?.avatarUrl || userAvatarUrl;
  const adminHasPIN = pendingAdmin?.hasPIN ?? hasPINFromState;

  // Capture initial admin user info to prevent values changing when pending admin is cleared
  const adminUserRef = useRef({ firstName: adminName, userAvatarUrl: adminAvatarUrl, hasPIN: adminHasPIN });

  const hasPIN = adminUserRef.current.hasPIN;
  const pinEnabled = values.pinEnabled;
  const togglePIN = useCallback(/* istanbul ignore next */(switchOn: boolean) => {
    setFieldValue('pinEnabled', switchOn, true);
  }, [setFieldValue]);

  const contentSetting = values.contentSetting ? `${formatMessage(contentSettingMessages.optionPrefix)} ${formatMessage(contentSettingMessages[values.contentSetting])}` : '';
  const handleClickContentSetting = useCallback(() => {
    tubiHistory.push({
      pathname: WEB_ROUTES.contentSetting,
      state: {
        form: values,
        referer: WEB_ROUTES.addKidsSetup,
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

  const valuesRequired = omit(values, ACTIVATION_CODE);
  const disableSubmit = isSubmitting || checkIfKeysExist(errors) || hasEmptyStringValue(pinEnabled && !hasPIN ? valuesRequired : omit(valuesRequired, KIDS_PIN));

  // Store location.query in a ref to avoid render loop when replacing history state
  const locationQueryRef = useLatestForEffect(location.query);

  useEffect(() => {
    tubiHistory.replace({
      pathname: location.pathname,
      query: locationQueryRef.current,
      state: {
        form: values,
      },
    });
  }, [values, location.pathname, locationQueryRef]);

  useEffect(() => {
    preloadRatingImages();
  }, []);

  const previousValues = usePreviousDistinct(values);
  useEffect(() => {
    [KIDS_FIRST_NAME, KIDS_PIN].forEach((k) => {
      const v = values[k];
      const pv = previousValues?.[k]; // previous value
      const iv = location.state?.form?.[k]; // initial value
      // track register progress when field value changes from empty to filled state
      if (!pv?.length && v?.length && !iv?.length) {
        trackRegisterProcess({ target: { name: k, value: v } });
      }
    });
  }, [values, previousValues, location.state]);

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
          value={adminUserRef.current.firstName}
          label={formatMessage(messages.adminAccount)}
          disabled
        />
        <div className={styles.avatar}>
          <Avatar name={adminUserRef.current.firstName} size="xs" avatarUrl={adminUserRef.current.userAvatarUrl} />
        </div>
      </div>
      <div>{formatMessage(messages.tip)}</div>
      <ComposedField
        containerClass={styles.field}
        component={TextInput}
        name={KIDS_FIRST_NAME}
        label={formatMessage(messages.kidsFirstName)}
        maxLength={40}
        autoComplete="given-name"
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
        <div className={styles.pinToggle}>
          <span>{formatMessage(pinEnabled ? messages.pinEnabled : messages.pinDisabled)}</span>
          <OnOffSwitch
            switchOn={pinEnabled}
            onChange={togglePIN}
            disabled={hasPIN}
          />
        </div>
        {pinEnabled ? (
          <div className={styles.pinField}>
            {hasPIN ? (
              <>
                <ComposedField
                  containerClass={styles.field}
                  component={TextInput}
                  name="FAKE_FIELD"
                  value="****"
                  label={formatMessage(messages.pinExisted)}
                  enablePasswordToggle
                  disabled
                />
                <LockClosed24 />
              </>
            ) : (
              <ComposedField
                containerClass={styles.field}
                component={TextInput}
                name={KIDS_PIN}
                label={formatMessage(messages.pin)}
                enablePasswordToggle={!hasPIN}
                canShowPassword
                maxLength={4}
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                autoComplete="off"
                disabled={hasPIN}
              />
            ) }
          </div>
        ) : null}
        <div className={styles.pinDesc}>
          <div>
            {formatMessage(pinEnabled ? (hasPIN ? messages.pinExistedDesc : messages.pinEnabledDesc) : messages.pinDisabledDesc, { br: <br /> })}
            <ATag to={HELP_CENTER_ARTICLE} target="_blank">{formatMessage(messages.pinDescMore)}</ATag>
          </div>
        </div>
      </div>
      <div className={styles.terms}>
        {formatMessage(messages.terms, {
          termsLink: ([msg]: React.ReactNode[]) => <ATag to={WEB_ROUTES.terms} target="_blank">{msg}</ATag>,
          privacyLink: ([msg]: React.ReactNode[]) => <ATag to={WEB_ROUTES.privacy} target="_blank">{msg}</ATag>,
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
    const kid = await submitSetupForm(values, formikBag);
    if (values.activationCode) {
      tubiHistory.push({
        pathname: WEB_ROUTES.addKidsSuccess,
        state: {
          referer: WEB_ROUTES.addKidsSetup,
        },
      });
    } else {
      const { props: { dispatch } } = formikBag;
      await dispatch(handleAddKidsAccountSuccess(kid));
    }
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
      tubiHistory.push({
        pathname: WEB_ROUTES.addKidsError,
        state: {
          referer: WEB_ROUTES.addKidsSetup,
        },
      });
    } else if (error.code.startsWith('ACTIVATION_')) {
      // on activation field error [ACTIVATION_CODE_NOT_FOUND, ACTIVATION_CODE_EXPIRED, ACTIVATION_CODE_ALREADY_USED]
      // render <ActivationCodeForm />, allow user to try the code again
      tubiHistory.replace({
        pathname: WEB_ROUTES.addKids,
        state: {
          form: values,
          error,
          action: NEXT_ACTION.CONTINUE,
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
      pinEnabled: true,
      kidsPIN: '',
      ...location.state?.form,
    };
  },
  handleSubmit,
  validate: (values, props) => {
    const { intl: { formatMessage }, hasPINFromState } = props;
    const { KIDS_FIRST_NAME, CONTENT_SETTING, KIDS_PIN } = ADD_KID_FORM_FIELD_NAMES;
    // Get hasPIN from pending admin store, fallback to current user's hasPIN from state
    const hasPIN = getPendingAdmin()?.hasPIN ?? hasPINFromState;
    const fieldsRequired = [
      KIDS_FIRST_NAME,
      CONTENT_SETTING,
      ...(!hasPIN && values.pinEnabled ? [KIDS_PIN] : []),
    ];
    const errors: FormikErrors<FormValues> = {};
    fieldsRequired.forEach((key) => {
      if (!values[key]) {
        errors[key] = formatMessage(errorMessages.required);
      }
    });

    if (values.pinEnabled && values[KIDS_PIN] && !/^\d{4}$/.test(values[KIDS_PIN])) {
      errors[KIDS_PIN] = formatMessage(errorMessages.invalidPIN);
    }

    return errors;
  },
};

const mapStateToProps = (state: StoreState): StateProps => ({
  hasPINFromState: hasPINSelector(state),
});

export default injectIntl(withRouter(connect(mapStateToProps)(withFormik(withFormikConfig)(SetupForm))));
