import { ActionLevel, interceptorManager, playerCommander } from '@adrise/player';
import type { Interceptor } from '@adrise/player';
import { controlActions } from '@adrise/player/lib/action';
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { ChevronLeft } from '@tubitv/icons';
import { Button, IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { useFormConsents, useOneClickConsent } from 'common/features/gdpr/hooks/useConsent';
import messages from 'common/features/gdpr/messages';
import type { OptionalConsentValue } from 'common/features/gdpr/types';
import { getUserInteraction } from 'common/features/gdpr/utils';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { buildComponentInteractionEvent, buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import Overlay from 'web/components/Overlay/Overlay';
import Consents from 'web/features/gdpr/components/Consents/Consents';
import { isInitialConsentVisibleSelector } from 'web/features/gdpr/selectors/gdpr';

import styles from './InitialConsentModal.scss';

const interceptor: Interceptor = {
  name: 'Initial Consent Modal',
  play: /* istanbul ignore next */ () => ActionLevel.NONE,
};
const addInterceptor = () => {
  interceptorManager.addInterceptor(interceptor);
};
const removeInterceptor = () => {
  interceptorManager.removeInterceptor(interceptor);
};

const InitialConsentModal = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const currentLocation = useLocation();
  const isInitialConsentVisible = useAppSelector(state => isInitialConsentVisibleSelector(state, { currentLocation }));
  const isUpdatingConsent = useAppSelector((state) => state.consent.updatingConsent);
  const privacyDescription = useAppSelector((state) => state.consent.privacyDescription);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const [isPromptStep, setIsPromptStep] = useState(true);

  useEffect(() => {
    if (isInitialConsentVisible) {
      // Pause VOD playback with controlActions and pause live player with playerCommander
      dispatch(controlActions.pause());
      playerCommander.pause();
      // The interceptor is to prevent any playback from interactions, autostart, etc.
      addInterceptor();
    }
  }, [dispatch, isInitialConsentVisible]);

  const onClose = useCallback(() => {
    removeInterceptor();
    dispatch(controlActions.play(ActionLevel.CODE));
    playerCommander.play();
  }, [dispatch]);

  useEffect(() => {
    if (isInitialConsentVisible) {
      const dialogType = isPromptStep ? DialogType.YOUR_PRIVACY : DialogType.PRIVACY_PREFERENCES;
      trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), dialogType, undefined, DialogAction.SHOW));
    }
  }, [isPromptStep, isInitialConsentVisible]);

  const onManageClick = useCallback(() => {
    setIsPromptStep(false);
  }, []);
  const onBackClick = useCallback(() => {
    setIsPromptStep(true);
  }, []);
  const { onAcceptAll, onRejectAll } = useOneClickConsent();

  const onAcceptClick = useCallback(() => {
    onAcceptAll();
    trackEvent(
      eventTypes.COMPONENT_INTERACTION_EVENT,
      buildComponentInteractionEvent({
        pathname: getCurrentPathname(),
        component: 'BUTTON',
        buttonValue: 'ACCEPT_ALL_CONSENTS',
        buttonType: ButtonType.TEXT,
        userInteraction: 'CONFIRM',
      })
    );
  }, [onAcceptAll]);
  const onRejectClick = useCallback(() => {
    trackEvent(
      eventTypes.COMPONENT_INTERACTION_EVENT,
      buildComponentInteractionEvent({
        pathname: getCurrentPathname(),
        component: 'BUTTON',
        buttonValue: 'REJECT_ALL_CONSENTS',
        buttonType: ButtonType.TEXT,
        userInteraction: 'CONFIRM',
      })
    );
    onRejectAll().then(() => {
      window.location.reload();
    });
  }, [onRejectAll]);

  const renderPrompt = useCallback(() => {
    return (
      <>
        <div className={styles.header}>
          <div className={styles.title}>{intl.formatMessage(messages.yourPrivacy)}</div>
          <div className={styles.subtitle}>{intl.formatMessage(messages.yourPrivacySubtitle)}</div>
        </div>
        <div className={styles.body}>
          <div className={styles.description}>{privacyDescription}</div>
          {isLoggedIn ? (
            <div className={styles.subDescription}>{intl.formatMessage(messages.signedUserTip)}</div>
          ) : null}
          <div className={styles.subDescription}>
            {intl.formatMessage(messages.visitMore, {
              link: (
                // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs
                <Link className={styles.link} to={WEB_ROUTES.privacy}>tubi.tv/privacy</Link>
              ),
            })}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.buttons}>
            <Button
              className={styles.button}
              appearance="tertiary"
              onClick={onAcceptClick}
              disabled={isUpdatingConsent}
            >
              {intl.formatMessage(messages.accept)}
            </Button>
            <Button
              className={styles.button}
              appearance="tertiary"
              onClick={onRejectClick}
              disabled={isUpdatingConsent}
            >
              {intl.formatMessage(messages.reject)}
            </Button>
            <div className={styles.right}>
              <Button className={styles.button} appearance="tertiary" onClick={onManageClick}>
                {intl.formatMessage(messages.managePreferences)}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }, [intl, isLoggedIn, isUpdatingConsent, onAcceptClick, onManageClick, onRejectClick, privacyDescription]);

  const { formValues, onConsentChange: toggleConsent, onConsentsSave } = useFormConsents();
  const onConsentChange = useCallback(
    (consentKey: string, value: OptionalConsentValue) => {
      toggleConsent(consentKey, value);
      trackEvent(
        eventTypes.COMPONENT_INTERACTION_EVENT,
        buildComponentInteractionEvent({
          pathname: getCurrentPathname(),
          component: 'BUTTON',
          buttonValue: consentKey.toUpperCase(),
          buttonType: ButtonType.TEXT,
          userInteraction: getUserInteraction(value),
        })
      );
    },
    [toggleConsent]
  );
  const onSaveClick = useCallback(() => {
    trackEvent(
      eventTypes.COMPONENT_INTERACTION_EVENT,
      buildComponentInteractionEvent({
        pathname: getCurrentPathname(),
        component: 'BUTTON',
        buttonValue: 'SAVE_AND_CONTINUE',
        buttonType: ButtonType.TEXT,
        userInteraction: 'CONFIRM',
      })
    );
    onConsentsSave().then(() => {
      const hasPurposeRejected = Object.values(formValues).some((value) => value === 'opted_out');
      if (hasPurposeRejected) {
        window.location.reload();
      }
    });
  }, [formValues, onConsentsSave]);
  const renderSettings = useCallback(
    () => (
      <>
        <div className={styles.header}>
          <div className={classNames(styles.title, styles.withBackIcon)}>
            <IconButton className={styles.backIcon} icon={<ChevronLeft />} onClick={onBackClick} />
            {intl.formatMessage(messages.privacySettings)}
          </div>
        </div>
        <Consents className={styles.body} displayedValues={formValues} onConsentChange={onConsentChange} />
        <div className={styles.bottom}>
          <Button className={styles.button} onClick={onSaveClick} disabled={isUpdatingConsent}>
            {intl.formatMessage(messages.save)}
          </Button>
        </div>
      </>
    ),
    [formValues, intl, isUpdatingConsent, onBackClick, onConsentChange, onSaveClick]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Overlay isOpen={isInitialConsentVisible} onClose={onClose} nodeRef={containerRef}>
      <div ref={containerRef} className={styles.container}>
        <div
          className={classNames(styles.modal, {
            [styles.prompt]: isPromptStep,
            [styles.settings]: !isPromptStep,
          })}
        >
          {isPromptStep ? renderPrompt() : renderSettings()}
        </div>
      </div>
    </Overlay>
  );
};

export default InitialConsentModal;
