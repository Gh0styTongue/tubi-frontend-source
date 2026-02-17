import { ActionLevel, controlActions } from '@adrise/player';
import { PauseState } from '@tubitv/analytics/lib/playerEvent';
import { useRef, useCallback } from 'react';

import { toggleRegistrationPrompt } from 'common/actions/ui';
import * as eventTypes from 'common/constants/event-types';
import WebRegistrationPlayerGate, { WEB_REGISTRATION_PLAYER_GATE_VALUE } from 'common/experiments/config/webRegistrationPlayerGate';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import { buildPauseToggleEventObject } from 'common/utils/analytics';
import { trackEvent } from 'common/utils/track';
import { hasShownRegistratonPromptSelector } from 'web/features/playback/selectors/ui';

interface UsePlayHandlerParams {
  contentId: string;
  refreshActiveTimer: () => void;
}

export const usePlayAndPauseHandlers = ({
  contentId,
  refreshActiveTimer,
}: UsePlayHandlerParams) => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const webRegistrationPlayerGate = useExperiment(WebRegistrationPlayerGate);
  const hasShownRegistrationPrompt = useAppSelector(hasShownRegistratonPromptSelector);
  const hasPlayActionTriggeredRef = useRef(false);

  const play = useCallback(
    (explicit: boolean) => {
      /**
       * For Registration Gate experiment, stop the play action.
       * Show a prompt to guide user to register instead.
       */
      if (!isLoggedIn && !isMobile) {
        const registrationFlow = webRegistrationPlayerGate.getValue();
        if (
          registrationFlow === WEB_REGISTRATION_PLAYER_GATE_VALUE.FORCED ||
          (registrationFlow === WEB_REGISTRATION_PLAYER_GATE_VALUE.OPTIONAL && !hasShownRegistrationPrompt)
        ) {
          dispatch(toggleRegistrationPrompt({ isOpen: true }));
          return Promise.resolve();
        }
      }

      /* istanbul ignore else */
      if (explicit && !hasPlayActionTriggeredRef.current) {
        hasPlayActionTriggeredRef.current = true;
      }

      return dispatch(controlActions.play(explicit ? ActionLevel.UI : ActionLevel.CODE))
        .then(() => {
          /* istanbul ignore else */
          if (!explicit) return;
          refreshActiveTimer();
          const pauseToggleEventObject = buildPauseToggleEventObject(contentId, PauseState.RESUMED);
          trackEvent(eventTypes.PAUSE_TOGGLE, pauseToggleEventObject);
        });
    },
    [
      dispatch,
      contentId,
      isMobile,
      isLoggedIn,
      hasShownRegistrationPrompt,
      webRegistrationPlayerGate,
      refreshActiveTimer,
      // not actually necesssary, but satisfies the linter and allows us to
      // get around disabling the rule
      hasPlayActionTriggeredRef,
    ]
  );

  const explicitPlay = useCallback(() => play(true), [play]);

  const pause = useCallback((explicit: boolean) => {
    return dispatch(controlActions.pause()).then(() => {
      if (!explicit) return;
      refreshActiveTimer();
      const pauseToggleEventObject = buildPauseToggleEventObject(contentId, PauseState.PAUSED);
      trackEvent(eventTypes.PAUSE_TOGGLE, pauseToggleEventObject);
    });
  }, [
    dispatch,
    contentId,
    refreshActiveTimer,
  ]);

  const explicitPause = useCallback(() => pause(true), [pause]);

  return { play, explicitPlay, pause, explicitPause };
};

