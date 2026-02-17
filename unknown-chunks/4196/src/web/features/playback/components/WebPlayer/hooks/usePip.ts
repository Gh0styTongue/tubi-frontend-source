import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import type { UserInteraction } from '@tubitv/analytics/lib/componentInteraction';
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useState, useRef, useEffect } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { trackEnterPictureInPicture, trackEnterPictureInPictureError, trackLeavePictureInPicture } from 'client/features/playback/track/client-log';
import * as eventTypes from 'common/constants/event-types';
import { buildComponentInteractionEvent, buildPictureInPictureToggleEventObject } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { exitPictureInPicture, isPictureInPictureEnabled } from 'common/utils/pictureInPicture';
import { trackEvent } from 'common/utils/track';

interface UsePipParams {
  contentId: string;
  player: Player | LivePlayerWrapper | null;
}

export const usePip = ({ contentId, player }: UsePipParams) => {
  const playerRef = useRef<Player | LivePlayerWrapper | null>();
  const pipPromiseRef = useRef<Promise<PictureInPictureWindow | void> | undefined>();
  const [pipEnabled, setPipEnabled] = useState(false);

  const onEnterPictureInPicture = useCallback(() => {
    setPipEnabled(true);
    const pipToggleEventObject = buildPictureInPictureToggleEventObject(contentId, ToggleState.ON);
    trackEvent(eventTypes.PIP_TOGGLE_EVENT, pipToggleEventObject);
    trackEnterPictureInPicture(contentId);
  }, [setPipEnabled, contentId]);

  const onLeavePictureInPicture = useCallback(() => {
    setPipEnabled(false);
    const pipToggleEventObject = buildPictureInPictureToggleEventObject(contentId, ToggleState.OFF);
    trackEvent(eventTypes.PIP_TOGGLE_EVENT, pipToggleEventObject);
    trackLeavePictureInPicture(contentId);
  }, [setPipEnabled, contentId]);

  const initPictureInPictureStatus = useCallback(() => {
    // Preserve PIP status, if it's not disabled (manually or by ads)
    if (isPictureInPictureEnabled()) {
      playerRef.current?.enterPictureInPicture().catch((error: DOMException) => {
        trackEnterPictureInPictureError(contentId, error.message);
      });
    }
  }, [playerRef, contentId]);

  const togglePictureInPicture = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current || !playerRef.current.getVideoElement()) return;
    if (pipPromiseRef.current) {
      await pipPromiseRef.current.catch(() => {});
    }
    let userInteraction: UserInteraction;
    if (pipEnabled) {
      userInteraction = 'TOGGLE_OFF';
      pipPromiseRef.current = exitPictureInPicture().catch((error: DOMException) => {
        trackEnterPictureInPictureError(contentId, error.message);
      });
    } else {
      userInteraction = 'TOGGLE_ON';
      pipPromiseRef.current = playerRef.current.enterPictureInPicture().catch((error: DOMException) => {
        trackEnterPictureInPictureError(contentId, error.message);
      });
    }
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction,
      component: 'BUTTON',
      buttonType: ButtonType.IMAGE,
      buttonValue: 'pip',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
  }, [pipEnabled, contentId]);

  useEffect(() => {
    playerRef.current = player;
    playerRef.current?.on(PLAYER_EVENTS.ready, initPictureInPictureStatus);
    playerRef.current?.on(PLAYER_EVENTS.enterPictureInPicture, onEnterPictureInPicture);
    playerRef.current?.on(PLAYER_EVENTS.leavePictureInPicture, onLeavePictureInPicture);

    return () => {
      playerRef.current?.off(PLAYER_EVENTS.ready, initPictureInPictureStatus);
      playerRef.current?.off(PLAYER_EVENTS.enterPictureInPicture, onEnterPictureInPicture);
      playerRef.current?.off(PLAYER_EVENTS.leavePictureInPicture, onLeavePictureInPicture);
    };
  }, [player, initPictureInPictureStatus, onEnterPictureInPicture, onLeavePictureInPicture]);

  return {
    pipEnabled,
    togglePictureInPicture,
  };
};
