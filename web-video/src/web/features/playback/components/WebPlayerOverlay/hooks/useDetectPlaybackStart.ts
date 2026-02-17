import { useEffect, useState } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import { isPlayingSelector } from 'common/selectors/playerStore';

export const useDetectPlaybackStart = () => {
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);
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
