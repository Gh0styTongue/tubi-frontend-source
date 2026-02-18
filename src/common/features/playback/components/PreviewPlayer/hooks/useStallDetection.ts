import { useEffect } from 'react';

import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import useLatest from 'common/hooks/useLatest';

interface UseStallDetectionProps {
  isVisible: boolean;
  onStartUpStall?: () => void;
  onStall?: () => void;
}

export const useStallDetection = ({
  isVisible,
  onStartUpStall,
  onStall,
}: UseStallDetectionProps) => {
  const playerContext = usePlayerContext();
  const player = playerContext.player;
  const onStartUpStallRef = useLatest(onStartUpStall);
  const onStallRef = useLatest(onStall);

  useEffect(() => {
    let stalledTimer: ReturnType<typeof setTimeout>;
    if (isVisible) {
      let position = player?.getPrecisePosition();
      // We increased the gap interval from 500ms to 1s after noticing 500ms was too small of a gap
      // on Kepler to see updates in currentPosition values
      const gap = 1000;
      stalledTimer = setInterval(() => {
        const currentPosition = player?.getPrecisePosition();
        if (player?.isPaused()) return;
        if (typeof currentPosition === 'number' && currentPosition > 0) {
          if (position === currentPosition) {
            player?.pause();
            onStallRef.current?.();
          }
          position = currentPosition;
        } else {
          onStartUpStallRef.current?.();
        }
      }, gap);
    }
    return () => {
      clearInterval(stalledTimer);
    };
  }, [isVisible, onStartUpStallRef, onStallRef, player]);
};
