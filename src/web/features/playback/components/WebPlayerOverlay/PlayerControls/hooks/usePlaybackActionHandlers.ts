import type { controlActions } from '@adrise/player';
import { State as PLAYER_STATES, ActionLevel } from '@adrise/player';
import type React from 'react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import useLatest from 'common/hooks/useLatest';
import { playerStateSelector } from 'common/selectors/playerStore';
import type { TubiThunkDispatcherFn } from 'common/types/reduxThunk';
import type { WebStepSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';

interface UsePlaybackActionHandlersArgs {
  stepRewind: WebStepSeekFn;
  stepForward: WebStepSeekFn;
  pause: TubiThunkDispatcherFn<typeof controlActions['pause']>;
  play: TubiThunkDispatcherFn<typeof controlActions['play']>;
}

interface UsePlaybackActionHandlersResult {
  handleClickStepRewind: (e: React.MouseEvent) => void;
  handleClickStepForward: (e: React.MouseEvent) => void;
  handleClickPlayPause: (e: React.MouseEvent) => void;
}

export const usePlaybackActionHandlers = ({
  stepRewind,
  stepForward,
  pause,
  play,
}: UsePlaybackActionHandlersArgs): UsePlaybackActionHandlersResult => {
  const playerState = useSelector(playerStateSelector);
  const playerStateRef = useLatest(playerState);

  const handleClickStepRewind = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      stepRewind('ON_SCREEN_BUTTON' as const);
    },
    [stepRewind],
  );

  const handleClickStepForward = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      stepForward('ON_SCREEN_BUTTON' as const);
    },
    [stepForward],
  );

  const handleClickPlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const isPlaying = playerStateRef.current === PLAYER_STATES.playing;
      if (isPlaying) {
        pause();
      } else {
        play(ActionLevel.UI);
      }
    },
    [playerStateRef, pause, play],
  );

  return {
    handleClickStepRewind,
    handleClickStepForward,
    handleClickPlayPause,
  };
};
