import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { setResumePosition } from 'common/actions/video';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

interface UsePlayerRegisterLogInButtonsProps {
  videoId: string;
  position: number;
  fromGateOverlay?: boolean;
}

interface UsePlayerRegisterLogInButtonsReturn {
  handleSignUpClick: (event: React.MouseEvent) => void;
  handleSignInClick: (event: React.MouseEvent) => void;
}

/**
 * Hook to handle sign-up and sign-in button clicks for player registration gates.
 * Saves the current video position and redirects to the appropriate authentication page.
 */
export const usePlayerRegisterLogInButtons = ({
  videoId,
  position,
  fromGateOverlay,
}: UsePlayerRegisterLogInButtonsProps): UsePlayerRegisterLogInButtonsReturn => {
  const dispatch = useDispatch();

  const trackRegistrationDialogEvent = useCallback(() => {
    trackEvent(
      eventTypes.DIALOG,
      buildDialogEvent(getCurrentPathname(), DialogType.REGISTRATION, 'reg_gt_watch', DialogAction.ACCEPT_DELIBERATE)
    );
  }, []);

  const handleSignUpClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(setResumePosition(videoId, position));
    if (fromGateOverlay) {
      trackRegistrationDialogEvent();
    }
    const currentPathEncoded = typeof window !== 'undefined'
      ? window.location.pathname + encodeURIComponent(window.location.search)
      : '';
    tubiHistory.push(`${WEB_ROUTES.register}?redirect=${currentPathEncoded}`);
  }, [dispatch, videoId, position, trackRegistrationDialogEvent, fromGateOverlay]);

  const handleSignInClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(setResumePosition(videoId, position));
    if (fromGateOverlay) {
      trackRegistrationDialogEvent();
    }
    const currentPathEncoded = typeof window !== 'undefined'
      ? window.location.pathname + encodeURIComponent(window.location.search)
      : '';
    tubiHistory.push(`${WEB_ROUTES.signIn}?redirect=${currentPathEncoded}`);
  }, [dispatch, videoId, position, trackRegistrationDialogEvent, fromGateOverlay]);

  return {
    handleSignUpClick,
    handleSignInClick,
  };
};

