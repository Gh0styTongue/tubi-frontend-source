import { PLAYER_EVENTS } from '@adrise/player';
import type { UserInteraction } from '@tubitv/analytics/lib/componentInteraction';
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useState, useRef } from 'react';

import { trackEnterPictureInPicture, trackEnterPictureInPictureError, trackLeavePictureInPicture } from 'client/features/playback/track/client-log';
import * as eventTypes from 'common/constants/event-types';
import { useGetLivePlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetLivePlayerInstance';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import useLivePlayerEvent from 'common/features/playback/hooks/useLivePlayerEvent';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import { buildComponentInteractionEvent, buildPictureInPictureToggleEventObject } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { exitPictureInPicture, isPictureInPictureEnabled } from 'common/utils/pictureInPicture';
import { trackEvent } from 'common/utils/track';

interface UsePipParams {
  contentId: string;
}

export const usePip = ({ contentId }: UsePipParams) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const { getLivePlayerInstance } = useGetLivePlayerInstance();
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
    const player = getPlayerInstance() || getLivePlayerInstance();
    // Preserve PIP status, if it's not disabled (manually or by ads)
    if (player && isPictureInPictureEnabled()) {
      player.enterPictureInPicture().catch((error: DOMException) => {
        trackEnterPictureInPictureError(contentId, error.message);
      });
    }
  }, [getPlayerInstance, getLivePlayerInstance, contentId]);

  const togglePictureInPicture = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const player = getPlayerInstance() || getLivePlayerInstance();
    if (!player || !player.getCurrentVideoElement()) return;
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
      pipPromiseRef.current = player.enterPictureInPicture().catch((error: DOMException) => {
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
  }, [pipEnabled, contentId, getPlayerInstance, getLivePlayerInstance]);

  usePlayerEvent(PLAYER_EVENTS.ready, initPictureInPictureStatus);
  usePlayerEvent(PLAYER_EVENTS.enterPictureInPicture, onEnterPictureInPicture);
  usePlayerEvent(PLAYER_EVENTS.leavePictureInPicture, onLeavePictureInPicture);

  useLivePlayerEvent(PLAYER_EVENTS.ready, initPictureInPictureStatus);
  useLivePlayerEvent(PLAYER_EVENTS.enterPictureInPicture, onEnterPictureInPicture);
  useLivePlayerEvent(PLAYER_EVENTS.leavePictureInPicture, onLeavePictureInPicture);

  return {
    pipEnabled,
    togglePictureInPicture,
  };
};
