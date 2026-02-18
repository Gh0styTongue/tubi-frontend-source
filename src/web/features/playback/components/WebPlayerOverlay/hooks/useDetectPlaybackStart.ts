import { useEffect, useState } from 'react';

import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import useAppSelector from 'common/hooks/useAppSelector';
import { isPlayingSelector } from 'common/selectors/playerStore';

export const useDetectPlaybackStart = () => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const isExistingPlayerPlaying = !!getPlayerInstance()?.isPlaying();
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(isExistingPlayerPlaying);
  const isPlaying = useAppSelector(isPlayingSelector);

  useEffect(() => {
    if (!hasPlaybackStarted && isPlaying) {
      setHasPlaybackStarted(true);
    }
  }, [hasPlaybackStarted, isPlaying]);
  return {
    hasPlaybackStarted,
  };
};
