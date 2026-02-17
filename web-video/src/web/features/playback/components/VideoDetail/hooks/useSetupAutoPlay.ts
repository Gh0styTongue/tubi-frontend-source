import type {
  Player } from '@adrise/player';
import { PLAYER_EVENTS,
} from '@adrise/player';
import { useCallback, useRef, useState } from 'react';

import useLatest from 'common/hooks/useLatest';
import type { Video } from 'common/types/video';

export interface UseSetupAutoPlayParams {
  video: Video;
}

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

  const maybeShowAutoplayRef = useLatest(maybeShowAutoplay);

  const attachAutoPlay = useCallback((player: Player) => {
    player.on(PLAYER_EVENTS.time, maybeShowAutoplayRef.current);
  }, [maybeShowAutoplayRef]);

  const detachAutoPlay = useCallback((player: Player) => {
    player.removeListener(PLAYER_EVENTS.time, maybeShowAutoplayRef.current);
  }, [maybeShowAutoplayRef]);

  return {
    showAutoPlay,
    attachAutoPlay,
    detachAutoPlay,
  };
};
