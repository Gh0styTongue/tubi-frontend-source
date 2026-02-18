import { State as PLAYER_STATES } from '@adrise/player';
import { useCallback } from 'react';
import type { RefObject } from 'react';

import { toggleTransportControl } from 'common/actions/ui';
import useAppSelector from 'common/hooks/useAppSelector';
import { playerStateSelector } from 'common/selectors/playerStore';
import { isFullscreenSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { isAdSelector } from 'web/features/playback/selectors/player';

interface UseOverlayClickHandlersProps {
  explicitPause: () => Promise<void>;
  explicitPlay: () => Promise<void>;
  dispatch: TubiThunkDispatch;
  captionSettingsVisible: boolean;
  setCaptionSettingsVisible: (visible: boolean) => void;
  qualitySettingsVisible: boolean;
  setQualitySettingsVisible: (visible: boolean) => void;
  playerOverlayRef: RefObject<HTMLDivElement>;
  requestFullscreen: (value: boolean) => void;
}

export const useOverlayClickHandlers = ({
  explicitPause,
  explicitPlay,
  dispatch,
  captionSettingsVisible,
  setCaptionSettingsVisible,
  qualitySettingsVisible,
  setQualitySettingsVisible,
  playerOverlayRef,
  requestFullscreen,
}: UseOverlayClickHandlersProps) => {
  const playerState = useAppSelector(playerStateSelector);
  const isAd = useAppSelector(isAdSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);

  const togglePlay = useCallback(() => {
    if (playerState === PLAYER_STATES.playing) {
      explicitPause();
    } else {
      explicitPlay();
    }
  }, [playerState, explicitPause, explicitPlay]);

  /**
   * do not interfere with ads
   * note- there are other click handler in TransportControls that will stop propagation earlier than this handler
   */
  const onClick = useCallback((e: React.MouseEvent) => {
    dispatch(toggleTransportControl(true));
    if (isAd) return;
    if (captionSettingsVisible) {
      setCaptionSettingsVisible(false);
      return;
    }
    if (qualitySettingsVisible) {
      setQualitySettingsVisible(false);
      return;
    }
    // note- we disable pointer-events with css for now. we can improve this by properly bubbling this event to the ad div
    e.stopPropagation();
    togglePlay();
  }, [
    dispatch,
    isAd,
    captionSettingsVisible,
    setCaptionSettingsVisible,
    qualitySettingsVisible,
    setQualitySettingsVisible,
    togglePlay,
  ]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const isClickingOnChildComponent = e.target !== playerOverlayRef.current;
    if (isClickingOnChildComponent) return;
    requestFullscreen(!isFullscreen);
  }, [playerOverlayRef, isFullscreen, requestFullscreen]);

  return {
    onClick,
    onDoubleClick,
    // exposed for testing only
    togglePlay,
  };
};
