import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import React, { useRef, useState } from 'react';
import { defineMessages } from 'react-intl';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { setCookie } from 'client/utils/localDataStorage';
import { loadHomeScreen } from 'common/actions/container';
import { toggleAgeGateModal, setKidsMode, showEligibilityModal, showCannotExitKidsModeModal } from 'common/actions/ui';
import { updateUserSettings, registerDevice, setUserCoppaState } from 'common/actions/userSettings';
import { AGE_GATE_BIRTHDAY } from 'common/constants/cookies';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { TRANSPARENT_BUTTON_COLOR } from 'common/constants/style-constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { logout } from 'common/features/authentication/actions/auth';
import type { AgeGateData, User } from 'common/features/authentication/types/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import AgeGateProvider from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { checkBirthdayLocally, getBirthdayISOStr } from 'common/features/coppa/utils/ageGate';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type ApiClient from 'common/helpers/ApiClient';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type {
  UserCoppaError } from 'common/utils/ageGate';
import {
  setLockedInKidsModeCookie,
  setCoppaCompliantCookie,
  setRequireLogoutCookie,
} from 'common/utils/ageGate';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { kidsModeToggleRedirect, setKidsModeStatusInCookie } from 'common/utils/webKidsModeTools';
import type { LocaleOptionType } from 'i18n/constants';
import { useIntl } from 'i18n/intl';
import Button from 'web/components/Button/Button';
import AgeGateForm from 'web/features/coppa/components/AgeGateForm/AgeGateForm';
import useDisableBodyScroll from 'web/hooks/useDisableBodyScroll';

import styles from './AgeGateModal.scss';

interface Props {
  isLoggedIn: boolean;
  dispatch: TubiThunkDispatch;
  isVisible: boolean;
  isFromExitKidsMode: boolean;
  username?: string;
  searchQuery?: string;
  preferredLocale?: LocaleOptionType;
}

const ageGateTransitions = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  appear: styles.appear,
  appearActive: styles.appearActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
  exitDone: styles.exitDone,
};

interface BirthYearConfirmation {
  birthYear: string;
  onConfirm(): void;
  onCancel(): void;
}

const messages = defineMessages({
  birthYearConfirmationHeader: {
    description: 'header message when confirm birth year',
    defaultMessage: 'Were you born in {birthYear}?',
  },
  birthYearConfirmationSubheader: {
    description: 'subheader message when confirm birth year',
    defaultMessage: 'Please confirm to continue',
  },
  yes: {
    description: 'button message for yes button',
    defaultMessage: 'Yes',
  },
  no: {
    description: 'button message for no button',
    defaultMessage: 'No',
  },
});

function trackAgeConfirmationEvent(action: DialogAction) {
  const eventObj = buildDialogEvent(getCurrentPathname(), DialogType.BIRTHDAY, 'age_confirmation', action);
  trackEvent(eventTypes.DIALOG, eventObj);
}

function trackAppModeChange(searchQuery: string | undefined) {
  // if in home page, dispatch navigate to page event for app mode change
  if (getCurrentPathname() === WEB_ROUTES.home) {
    trackingManager.trackNavigateToPageEvent({
      nextPageUrl: WEB_ROUTES.home,
      currentPageUrl: getCurrentPathname(),
      extraCtx: { query: searchQuery },
    });
  }
}

const AgeGateModal: React.FunctionComponent<Props> = (
  { isLoggedIn, dispatch, isVisible, isFromExitKidsMode, username, searchQuery, preferredLocale }): React.ReactElement => {
  const [birthYearConfirmation, setBirthYearConfirmation] = useState<BirthYearConfirmation | null>(null);
  const { formatMessage } = useIntl();
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  const location = useLocation();

  const handleSubmit = (data: AgeGateData, actions: AgeGateFormikActions) => {
    const { birthYear, birthMonth, birthDay, gender } = data;
    const birthdayStr = getBirthdayISOStr(data);
    const actionThunk = isLoggedIn ? updateUserSettings(location, {
      birthday: birthdayStr,
      gender,
    }, true) : registerDevice(birthdayStr);

    const onUserCompliant = () => {
      if (!isLoggedIn) {
        setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
        setCoppaCompliantCookie();
        // for guest, save birthday into a session cookie for reuse. Cookie last for 4hrs.
        setCookie(AGE_GATE_BIRTHDAY, JSON.stringify({ birthYear, birthMonth, birthDay }), 4 * 60 * 60);
      }
      // Note: this needs to be run after the cookie has been set,
      // or it will cause the App container go get the wrong state
      if (isFromExitKidsMode) {
        setKidsModeStatusInCookie(false);
        kidsModeToggleRedirect(preferredLocale);
        trackAppModeChange(searchQuery);
      } else {
        dispatch(toggleAgeGateModal({ isVisible: false }));
        actions.setSubmitting(false);
      }
      return Promise.resolve();
    };

    const onAgeConfirmation = () => {
      trackAgeConfirmationEvent(DialogAction.SHOW);
      setBirthYearConfirmation({
        birthYear: data.birthYear,
        onConfirm: () => {
          trackAgeConfirmationEvent(DialogAction.ACCEPT_DELIBERATE);
          trackEvent(eventTypes.DIALOG, buildDialogEvent(
            getCurrentPathname(),
            DialogType.EXIT_KIDS_MODE,
            'cannot_exit_kids',
          ));
          setUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
          setLockedInKidsModeCookie();
          dispatch(toggleAgeGateModal({ isVisible: false }));
          dispatch(showCannotExitKidsModeModal());
        },
        onCancel: () => {
          trackAgeConfirmationEvent(DialogAction.DISMISS_DELIBERATE);
          setBirthYearConfirmation(null);
          actions.setSubmitting(false);
        },
      });
      return Promise.resolve();
    };

    const onUserNotCompliant = () => {
      if (isFromExitKidsMode) {
        return onAgeConfirmation();
      }

      dispatch(setKidsMode(true));
      setUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
      setLockedInKidsModeCookie();
      const reset: ThunkAction<
        Promise<unknown>,
        StoreState,
        ApiClient,
        AnyAction
        > = isLoggedIn ? logout(location, { logoutOnProxyServerOnly: true }) : loadHomeScreen({ location, force: true });
      return dispatch(reset)
        .then(() => dispatch(toggleAgeGateModal({ isVisible: false })))
        .then(() => tubiHistory.replace(`${WEB_ROUTES.home}?t=${Date.now()}`))
        .then(() => dispatch(showEligibilityModal()))
        .then(() => {
          trackAppModeChange(searchQuery);
        });
    };

    const onRequireLogout = () => {
      if (isGDPREnabled) {
        setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_LOGOUT);
        setRequireLogoutCookie();
        return dispatch(logout(location));
      }
      return dispatch(logout(location))
        .then(() => dispatch(toggleAgeGateModal({ isVisible: false })))
        .then(() => tubiHistory.replace(`${WEB_ROUTES.home}?t=${Date.now()}`))
        .then(() => dispatch(showEligibilityModal()));
    };

    return dispatch(actionThunk).then(() => {
      return onUserCompliant();
    }).catch((error: UserCoppaError) => {
      if (error.coppaState === UserCoppaStates.NOT_COMPLIANT) {
        return onUserNotCompliant();
      }
      if (error.coppaState === UserCoppaStates.REQUIRE_LOGOUT) {
        return onRequireLogout();
      }
      if (checkBirthdayLocally(data)) {
        return onUserCompliant();
      }
      return onUserNotCompliant();
    });
  };

  useDisableBodyScroll(isVisible);

  const formType = isFromExitKidsMode ? 'YEAR_OF_BIRTH' : 'AGE';

  const mainNodeRef = useRef<HTMLDivElement>(null);

  return (
    <TransitionGroup component="div">
      {isVisible ? (
        <CSSTransition classNames={ageGateTransitions} timeout={300} nodeRef={mainNodeRef}>
          <div ref={mainNodeRef} className={styles.main} data-nosnippet>
            <div className={styles.ageGateModal}>
              <div style={{ display: birthYearConfirmation ? 'none' : 'block' }}>
                <AgeGateProvider hasGenderField={isLoggedIn} onSubmit={handleSubmit} formType={formType}>
                  {(childrenProps) => (
                    <AgeGateForm
                      {...childrenProps}
                      asModal
                      hasGenderField={isLoggedIn}
                      username={username}
                      formType={formType}
                    />
                  )}
                </AgeGateProvider>
              </div>
              {birthYearConfirmation && (
                <div className={styles.birthYearConfirmation}>
                  <div className={styles.headers}>
                    <div className={styles.header}>
                      {formatMessage(messages.birthYearConfirmationHeader, { birthYear: birthYearConfirmation.birthYear })}
                    </div>
                    <div className={styles.subheader}>{formatMessage(messages.birthYearConfirmationSubheader)}</div>
                  </div>
                  <Button
                    size="large"
                    color={TRANSPARENT_BUTTON_COLOR}
                    className={styles.button}
                    tabIndex={0}
                    onClick={birthYearConfirmation.onConfirm}
                    block
                  >
                    {formatMessage(messages.yes)}
                  </Button>
                  <Button
                    size="large"
                    color={TRANSPARENT_BUTTON_COLOR}
                    className={styles.button}
                    tabIndex={0}
                    onClick={birthYearConfirmation.onCancel}
                    block
                  >
                    {formatMessage(messages.no)}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>
      ) : null}
    </TransitionGroup>
  );
};

const mapStateToProps = (state: StoreState) => {
  const { ui: { ageGateModal, preferredLocale }, auth, search: { key } } = state;
  const isLoggedIn = !!(auth && auth.user);
  return {
    isLoggedIn,
    isVisible: ageGateModal.isVisible,
    isFromExitKidsMode: ageGateModal.isFromExitKidsMode,
    username: isLoggedIn ? (auth.user as User).name : '',
    searchQuery: key,
    preferredLocale,
  };
};

export default connect(mapStateToProps)(AgeGateModal);
