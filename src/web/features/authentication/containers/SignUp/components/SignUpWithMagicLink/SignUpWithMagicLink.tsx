import { ProgressType } from '@tubitv/analytics/lib/registerEvent';
import type { Location } from 'history';
import React, { useCallback, useEffect } from 'react';
import type { HelmetProps } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';

import Mail from 'common/components/uilib/SvgLibrary/Mail';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { REGISTRATION_FORM_FIELD_NAMES } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { clearLoginActions, register } from 'common/features/authentication/actions/auth';
import { COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import {
  loginCallbackSelector,
  loginRedirectSelector,
} from 'common/features/authentication/selectors/auth';
import type { AgeGateData, AuthError } from 'common/features/authentication/types/auth';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import AgeGateProvider from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import { useAppDispatch } from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isUserNotCoppaCompliant } from 'common/utils/ageGate';
import { trackRegisterEvent } from 'common/utils/analytics';
import Footer from 'web/components/Footer/Footer';
import AgeGateFormForMagicLink from 'web/features/coppa/components/AgeGateForm/AgeGateFormForMagicLink';

import styles from './SignUpWithMagicLink.scss';

interface Props {
  meta: HelmetProps;
  location: Location;
  registrationUID: string;
}

interface FormEvent {
  target: {
    name: string;
    value: string;
  }
}

const {
  FIRST_NAME,
  BIRTH_YEAR,
  GENDER,
  SUBMIT,
} = REGISTRATION_FORM_FIELD_NAMES;

// onBlur of the field (key), we execute a trackEvent of RegistrationEvent with progress value
const {
  COMPLETED_BIRTHDAY,
  COMPLETED_GENDER,
  COMPLETED_NAME,
  CLICKED_REGISTER,
} = ProgressType;

const registrationProgressMap = {
  [BIRTH_YEAR]: COMPLETED_BIRTHDAY,
  [GENDER]: COMPLETED_GENDER,
  [FIRST_NAME]: COMPLETED_NAME,
  [SUBMIT]: CLICKED_REGISTER,
};

const messages = defineMessages({
  title: {
    description: 'title text',
    defaultMessage: 'LAST BUT NOT LEAST',
  },
});

const SignUpWithMagicLink: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();
  const { location } = props;
  const { formatMessage } = useIntl();
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: location.search }));
  const loginCallback = useAppSelector(loginCallbackSelector);
  const isCoppaEnabled = useAppSelector(isCoppaEnabledSelector);

  useEffect(() => {
    if (isCoppaEnabled) {
      // if user tries to hit back button after entering bad age, check the cookie and redirect
      if (isUserNotCoppaCompliant()) {
        tubiHistory.replace(WEB_ROUTES.home);
      }
    }
  }, [dispatch, isCoppaEnabled]);

  /**
   * send track event for tracking registration progress. Completion of certain fields warrant event firing
   * @param e - dom event
   */
  const trackRegisterProcess = useCallback((e: FormEvent) => {
    const { name, value } = e.target as HTMLInputElement;
    if (value && value.length > 0) {
      trackRegisterEvent({ progress: registrationProgressMap[name as keyof typeof registrationProgressMap] });
    }
  }, []);

  const handleRegistration = (location: Location) => (ageGateData: AgeGateData, actions: AgeGateFormikActions) => {
    const { setStatus, setSubmitting } = actions;
    const registrationData = {
      ...ageGateData,
      registrationUID: props.registrationUID,
      authType: 'EMAIL' as const,
    };

    // registering, collect already stored user credentials from part 1
    dispatch(register(location, registrationData)).then(() => {
      setStatus({ formError: null });
      // if there is a loginCall back call the function here
      if (loginCallback) loginCallback();
      // redirect to loginRedirect or default to '/home'
      tubiHistory.replace(loginRedirect || `${WEB_ROUTES.activate}?from=magic_link`);
      if (loginRedirect || loginCallback) {
        dispatch(clearLoginActions());
      }
    }).catch((error: AuthError) => {
      // We will not show the generic error message for COPPA errors. Fail scenario handled in register action.
      if (!COPPA_ERROR_STATUS_CODES.includes(error.status)) {
        setSubmitting(false);
        setStatus({ formError: error });
      }
    });
  };

  const { meta } = props;

  return (
    <div className={styles.main} data-test-id="container-sign-up-with-coppa">
      <Helmet {...meta} />
      <TopPlaceholder logo invert />
      <div className={styles.registrationWrapper}>
        <div className={styles.circle}>
          <Mail className={styles.icon} />
        </div>
        <div className={styles.title}>
          {formatMessage(messages.title)}
        </div>
        <AgeGateProvider onSubmit={handleRegistration(location)} isRegistering hasGenderField hasFirstNameField>
          {(childrenProps) => (
            <AgeGateFormForMagicLink
              {...childrenProps}
              trackRegisterProcess={trackRegisterProcess}
              isRegistering
            />
          )}
        </AgeGateProvider>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default SignUpWithMagicLink;
