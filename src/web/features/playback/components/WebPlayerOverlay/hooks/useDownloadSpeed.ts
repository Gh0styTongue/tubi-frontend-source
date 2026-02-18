import { useEffect, useState } from 'react';

import { getExperiment } from 'common/experimentV2';
import { webShowBufferingSpeed } from 'common/experimentV2/configs/webShowBufferingSpeed';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useProgressSubscription } from 'common/features/playback/hooks/usePlayerProgress';

const UPDATE_INTERVAL = 500; // Update every 500ms for more responsive display

export const useDownloadSpeed = () => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const { isBuffering } = useProgressSubscription();

  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);

  useEffect(() => {
    if (!isBuffering) {
      setDownloadSpeed(null);
      return;
    }

    const shouldShowBufferingSpeed = getExperiment(webShowBufferingSpeed).get('enable');
    if (!shouldShowBufferingSpeed) {
      setDownloadSpeed(null);
      return;
    }

    // Immediately check for download speed when buffering starts
    const updateSpeed = () => {
      const player = getPlayerInstance();
      if (!player) {
        setDownloadSpeed(null);
        return;
      }

      // Get bandwidth estimate from player (in bits per second)
      const bandwidthEstimate = player.getBandwidthEstimate?.();

      if (bandwidthEstimate && bandwidthEstimate > 0) {
        // Convert from bits per second to megabits per second
        const speedInMbps = bandwidthEstimate / 1_000_000;
        setDownloadSpeed(speedInMbps);
      } else {
        setDownloadSpeed(null);
      }
    };

    // Run immediately
    updateSpeed();

    // Then continue updating at interval
    const intervalId = setInterval(updateSpeed, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isBuffering, getPlayerInstance]);

  return downloadSpeed;
};
