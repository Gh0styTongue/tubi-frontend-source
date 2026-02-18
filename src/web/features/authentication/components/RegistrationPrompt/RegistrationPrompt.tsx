import { ActionLevel, interceptorManager } from '@adrise/player';
import type { Interceptor } from '@adrise/player';
import { controlActions } from '@adrise/player/lib/action';
import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import { Grid, Play, DeviceTv, PlusStroke, ThumbUpStroke, CloseStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useEffect, useRef, useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';
import { useSelector, shallowEqual } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { attachRedirectCookie } from 'client/utils/auth';
import { trackDialogEvent } from 'client/utils/track';
import { toggleRegistrationPrompt } from 'common/actions/ui';
import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import MailInverted from 'common/components/uilib/SvgLibrary/MailInverted';
import { webKeys } from 'common/constants/key-map';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebRegistrationPlayerGate, { WEB_REGISTRATION_PLAYER_GATE_VALUE } from 'common/experiments/config/webRegistrationPlayerGate';
import { loginRedirect } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useExperiment from 'common/hooks/useExperiment';
import type { StoreState } from 'common/types/storeState';
import {
  addEventListener,
  archiveAllEventListeners,
  removeEventListener,
} from 'common/utils/dom';
import Button from 'web/components/Button/Button';
import Overlay from 'web/components/Overlay/Overlay';

import styles from './RegistrationPrompt.scss';

const messages = defineMessages({
  title: {
    description: 'title for registration prompt',
    defaultMessage: 'Start Watching Now',
  },
  desc: {
    description: 'description for registration prompt',
    defaultMessage: 'Let’s Make It Official',
  },
  register: {
    description: 'Register button text',
    defaultMessage: 'Continue with Email',
  },
  ownedAccountMessage: {
    description: 'prompt and link for users with account',
    defaultMessage: 'Already have an account? <signInLink>Sign in.</signInLink>',
  },
  continueAsGuest: {
    description: 'continue as guest button text',
    defaultMessage: 'Continue as Guest',
  },
  free: {
    description: 'description text for free label',
    defaultMessage: 'It’s Free',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By registering, you agree to Tubi\'s<linebreak></linebreak><termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>',
  },
});

const allPromptMessages = defineMessages({
  forcedIntroTitle: {
    description: 'introduction title text',
    defaultMessage: 'Sign Up to Keep<linebreak></linebreak>Watching',
  },
  forcedIntroDesc: {
    description: 'introduction desc text',
    defaultMessage: 'Unlock this title • No credit card ever',
  },
  forcedFeature1: {
    description: 'feature 1 text',
    defaultMessage: 'Free movies, shows & live TV',
  },
  forcedFeature2: {
    description: 'feature 2 text',
    defaultMessage: 'Fewer ads than cable',
  },
  forcedFeature3: {
    description: 'feature 3 text',
    defaultMessage: 'Available on all devices',
  },
  optionalIntroTitle: {
    description: 'introduction title text',
    defaultMessage: 'A Better Tubi<linebreak></linebreak>is Waiting',
  },
  optionalIntroDesc: {
    description: 'introduction desc text',
    defaultMessage: 'No credit card ever',
  },
  optionalFeature1: {
    description: 'feature 1 text',
    defaultMessage: 'Create your own watchlist',
  },
  optionalFeature2: {
    description: 'feature 2 text',
    defaultMessage: 'Save your progress on any device',
  },
  optionalFeature3: {
    description: 'feature 3 text',
    defaultMessage: 'Find more of what you love',
  },
});

const getMessagesByVariant = (variant: WEB_REGISTRATION_PLAYER_GATE_VALUE) => {
  if (variant === WEB_REGISTRATION_PLAYER_GATE_VALUE.CONTROL) {
    return {};
  }
  return {
    introTitle: allPromptMessages[`${variant}IntroTitle`],
    introDesc: allPromptMessages[`${variant}IntroDesc`],
    feature1: allPromptMessages[`${variant}Feature1`],
    feature2: allPromptMessages[`${variant}Feature2`],
    feature3: allPromptMessages[`${variant}Feature3`],
  };
};

const allPromptIcons = {
  [WEB_REGISTRATION_PLAYER_GATE_VALUE.FORCED]: {
    feature1: Grid,
    feature2: Play,
    feature3: DeviceTv,
  },
  [WEB_REGISTRATION_PLAYER_GATE_VALUE.OPTIONAL]: {
    feature1: PlusStroke,
    feature2: Play,
    feature3: ThumbUpStroke,
  },
};

const PROMPT_DIALOG_SUB_TYPE = 'reg_at_play';

const interceptor: Interceptor = {
  name: 'Registration Gate',
  play: /* istanbul ignore next */ () => ActionLevel.NONE,
};

const addInterceptor = () => {
  interceptorManager.addInterceptor(interceptor);
};

const removeInterceptor = () => {
  interceptorManager.removeInterceptor(interceptor);
};

export const RegistrationPrompt: React.FC<WithRouterProps> = ({ router, routes }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const currentLocation = useLocation();
  const { isOpen, onClose, isSkipped } = useSelector((state: StoreState) => state.ui.registrationPrompt, shallowEqual);
  const isLoggedIn = useSelector(isLoggedInSelector);
  const isMobile = useSelector((state: StoreState) => state.ui.isMobile);

  const currentPath = (currentLocation?.pathname ?? '') + (currentLocation?.search ?? '');
  const currentPathEncoded = (currentLocation?.pathname ?? '') + encodeURIComponent(currentLocation?.search ?? '');

  const webRegistrationPlayerGate = useExperiment(WebRegistrationPlayerGate);
  const isUserInExperiment = !isLoggedIn && !isMobile;
  const shouldShowPrompt = isUserInExperiment && webRegistrationPlayerGate.getValue() !== WEB_REGISTRATION_PLAYER_GATE_VALUE.CONTROL && !isSkipped;
  const isOptionalTreatment = webRegistrationPlayerGate.getValue() === WEB_REGISTRATION_PLAYER_GATE_VALUE.OPTIONAL;

  const promptMessages = getMessagesByVariant(webRegistrationPlayerGate.getValue()) as Record<string, MessageDescriptor>;
  const promptIcons = allPromptIcons[webRegistrationPlayerGate.getValue() as keyof typeof allPromptIcons];

  // All advance navigation should be `replace` to override the history state for prompt
  const redirectToEmailRegister = useCallback(() => {
    tubiHistory.replace(`${WEB_ROUTES.register}?redirect=${currentPathEncoded}`);
  }, [currentPathEncoded]);

  const handleSignIn = useCallback(() => {
    tubiHistory.replace(`${WEB_ROUTES.signIn}?redirect=${currentPathEncoded}`);
  }, [currentPathEncoded]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const skipRegistration = (trigger?: 'continue' | 'close') => {
    // Registration prompt has a history state, use history navigation to control `isOpen`. See handlePopstateBackButton
    tubiHistory.goBack();
    if (trigger === 'continue') {
      dispatch(toggleRegistrationPrompt({ isSkipped: true }));
      removeInterceptor();
      dispatch(controlActions.play(ActionLevel.CODE));
      trackDialogEvent(DialogType.REGISTRATION, PROMPT_DIALOG_SUB_TYPE, DialogAction.ACCEPT_DELIBERATE);
    } else if (trigger === 'close') {
      trackDialogEvent(DialogType.REGISTRATION, PROMPT_DIALOG_SUB_TYPE, DialogAction.DISMISS_DELIBERATE);
    }
  };

  const skipRegistrationForContinue = useCallback(() => skipRegistration('continue'), [skipRegistration]);
  const skipRegistrationForClose = useCallback(() => skipRegistration('close'), [skipRegistration]);

  const handleSSOButtonClick = useCallback(() => {
    attachRedirectCookie(currentPath);
    dispatch(loginRedirect(currentPath));
  }, [currentPath, dispatch]);

  useEffect(() => {
    if (isUserInExperiment) {
      webRegistrationPlayerGate.logExposure();
    }
  }, [isUserInExperiment, webRegistrationPlayerGate]);

  useEffect(() => {
    if (isOpen) {
      // track analytic event when prompt is visible
      trackDialogEvent(DialogType.REGISTRATION, PROMPT_DIALOG_SUB_TYPE, DialogAction.SHOW);

      // when user leaves prompt to other page, close the prompt
      router.setRouteLeaveHook(routes[routes.length - 1], () => {
        dispatch(toggleRegistrationPrompt({ isOpen: false }));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // set a history state for registration prompt
  const originalPopstateListeners = useRef<ReturnType<typeof archiveAllEventListeners>>();
  const handlePopstateBackButton = useCallback(() => {
    dispatch(toggleRegistrationPrompt({ isOpen: false }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isOpen) {
      tubiHistory.push({
        ...currentLocation,
        state: {
          registrationPrompt: true,
        },
      });
      originalPopstateListeners.current = archiveAllEventListeners(window, 'popstate');
      addEventListener(window, 'popstate', handlePopstateBackButton);
    }
    return () => {
      if (!isOpen) {
        removeEventListener(window, 'popstate', handlePopstateBackButton);
        originalPopstateListeners.current?.restore();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (shouldShowPrompt) {
      dispatch(controlActions.pause());
      addInterceptor();
    }
    return () => {
      removeInterceptor();
    };
  }, [shouldShowPrompt, dispatch]);

  // prevent overlay hotkeys, only allow ESC to dismiss the prompt
  const originalKeydownListeners = useRef<ReturnType<typeof archiveAllEventListeners>>();
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    e.stopImmediatePropagation();
    if (e.keyCode === webKeys.escape) {
      skipRegistrationForClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webKeys.escape, skipRegistration]);
  useEffect(() => {
    if (isOpen) {
      originalKeydownListeners.current = archiveAllEventListeners(window, 'keydown');
      addEventListener(window, 'keydown', handleKeydown);
    }
    return () => {
      if (!isOpen) {
        removeEventListener(window, 'keydown', handleKeydown);
        originalKeydownListeners.current?.restore();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const promptRef = useRef<HTMLDivElement>(null);

  return shouldShowPrompt ? (
    <Overlay isOpen={isOpen} isCloseOnEscape={false} onClose={onClose} onClickOverlay={skipRegistrationForClose} dataNoSnippet nodeRef={promptRef}>
      <div ref={promptRef} className={classNames(styles.prompt)}>
        <button className={styles.close} onClick={skipRegistrationForClose}>
          <CloseStroke fill="white" width="24" height="24" />
        </button>
        <div className={styles.intro}>
          <div>
            <h1>
              {intl.formatMessage(promptMessages.introTitle, { linebreak: () => <br /> })}
              <span>{intl.formatMessage(messages.free)}</span>
            </h1>
            <p>{intl.formatMessage(promptMessages.introDesc)}</p>
          </div>
          <ul>
            <li>
              <div><promptIcons.feature1 /></div>
              <h2>{intl.formatMessage(promptMessages.feature1)}</h2>
            </li>
            <li>
              <div><promptIcons.feature2 /></div>
              <h2>{intl.formatMessage(promptMessages.feature2)}</h2>
            </li>
            <li>
              <div><promptIcons.feature3 /></div>
              <h2>{intl.formatMessage(promptMessages.feature3)}</h2>
            </li>
          </ul>
        </div>
        <div className={styles.form}>
          <h2>{intl.formatMessage(messages.desc, { linebreak: () => <br /> })}</h2>
          <div className={styles.sso}>
            <SSOButtonGroup
              googleClass={styles.button}
              buttonOnClick={handleSSOButtonClick}
            />
          </div>
          <Button
            icon={<MailInverted className={styles.mailIcon} />}
            color="primary"
            className={styles.button}
            onClick={redirectToEmailRegister}
          >
            {intl.formatMessage(messages.register)}
          </Button>
          <div>
            <div className={styles.ownedAccount}>
              {intl.formatMessage(messages.ownedAccountMessage, {
                signInLink: ([msg]: React.ReactNode[]) => <span className={styles.link} onClick={handleSignIn}>{msg}</span>,
              })}
            </div>
            {isOptionalTreatment ? (
              <Button
                className={classNames(styles.button, styles.skip)}
                onClick={skipRegistrationForContinue}
              >
                {intl.formatMessage(messages.continueAsGuest)}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Overlay>
  ) : null;
};

export default withRouter(RegistrationPrompt);
