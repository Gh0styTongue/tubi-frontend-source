import { PLAYER_EVENTS,
} from '@adrise/player';
import { useCallback, useRef, useState } from 'react';

import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import type { Video } from 'common/types/video';

export interface UseSetupAutoPlayParams {
  video: Video;
}

/**
 * Used only by web VideoDetail to determine if we should fetch the autoplay contents.
 * Note the web autoplay component is responsible for fetching the autoplay contents.
 * @todo-liam Consider consolidating this into a context that the playback page can reference, rather then prop drilling.
 */
export const useSetupAutoPlay = ({ video }: UseSetupAutoPlayParams) => {
  const [showAutoPlay, setShowAutoPlay] = useState(false);

  const videoRef = useRef<Video>(video);
  videoRef.current = video;

  const autoPlayTriggeredRef = useRef(false);

  const maybeShowAutoplay = useCallback(({ position }: {position: number}) => {
    const { duration, credit_cuepoints = {} } = videoRef.current;
    // if we don't have credits information, default to showing autoplay
    // just before we reach the end of the content. Note this is legacy
    // logic and may not have been decided on via experiment...
    const autoPlayShowTime = credit_cuepoints.postlude || (duration - 1);
    if (!autoPlayTriggeredRef.current && position >= autoPlayShowTime) {
      autoPlayTriggeredRef.current = true;
      setShowAutoPlay(true);
    } else if (autoPlayTriggeredRef.current && position < autoPlayShowTime) {
    // remove autoplay if rewinding before show time
      autoPlayTriggeredRef.current = false;
      setShowAutoPlay(false);
    }
  }, []);

  usePlayerEvent(PLAYER_EVENTS.time, maybeShowAutoplay);

  return {
    showAutoPlay,
  };
};
