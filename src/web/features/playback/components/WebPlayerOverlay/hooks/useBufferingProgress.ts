import { PLAYER_EVENTS } from '@adrise/player';
import type { BufferStartEventData, BufferEndEventData } from '@adrise/player/lib/types/eventData';
import { bufferingProgressTracker } from '@adrise/player/lib/utils/customHlsLoader';
import { getBufferedInfo } from '@adrise/player/lib/utils/tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getExperiment } from 'common/experimentV2';
import { webShowBufferingProgress } from 'common/experimentV2/configs/webShowBufferingProgress';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import { useProgressSubscription } from 'common/features/playback/hooks/usePlayerProgress';

const UPDATE_INTERVAL = 200; // Update every 200ms for smooth progress display

export const useBufferingProgress = () => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const { isBuffering } = useProgressSubscription();

  const [bufferingProgress, setBufferingProgress] = useState<number | null>(null);
  const shouldCalculateRef = useRef(false);

  // Update shouldCalculateRef based on isBuffering and experiment
  useEffect(() => {
    const shouldShowBufferingProgress = getExperiment(webShowBufferingProgress).get('enable');
    shouldCalculateRef.current = isBuffering && shouldShowBufferingProgress;

    if (!shouldCalculateRef.current) {
      setBufferingProgress(null);
    }
  }, [isBuffering]);

  // Listen to bufferStart event to enable polling
  usePlayerEvent(
    PLAYER_EVENTS.bufferStart,
    useCallback((_event: BufferStartEventData) => {
      const shouldShowBufferingProgress = getExperiment(webShowBufferingProgress).get('enable');
      if (shouldShowBufferingProgress) {
        // Enable polling when buffering starts
        bufferingProgressTracker.enablePolling();
      }
    }, []),
  );

  // Listen to bufferEnd event to disable polling
  usePlayerEvent(
    PLAYER_EVENTS.bufferEnd,
    useCallback((_event: BufferEndEventData) => {
      // Disable polling when buffering ends
      bufferingProgressTracker.disablePolling();
    }, []),
  );

  // Calculate buffering progress when buffer changes
  const calculateProgress = useCallback(() => {
    if (!shouldCalculateRef.current) {
      return;
    }

    const player = getPlayerInstance();
    if (!player) {
      setBufferingProgress(null);
      return;
    }

    // Get the most accurate current position directly from player
    // Use getPrecisePosition() for more accurate position, especially during seek operations
    // getPrecisePosition() returns videoElement.currentTime which is the actual playback position
    const currentPosition = player.getPrecisePosition?.() ?? player.getPosition?.();

    if (currentPosition === undefined) {
      setBufferingProgress(null);
      return;
    }

    // Get video and audio buffer ranges
    const videoBufferedRange = player.getBufferedVideoRange?.() || [];
    const audioBufferedRange = player.getBufferedAudioRange?.() || [];

    // Calculate buffer length for both video and audio from current position
    const videoBufferedInfo = getBufferedInfo(videoBufferedRange, currentPosition, 0);
    const audioBufferedInfo = getBufferedInfo(audioBufferedRange, currentPosition, 0);

    // Take the minimum of video and audio buffer lengths
    // Both need to be buffered for playback to start
    const bufferedLength = Math.min(videoBufferedInfo.len, audioBufferedInfo.len);

    // Get incremental buffer from currently downloading segments
    // Only counts segments that extend the current buffer forward
    // This provides smooth progress updates during segment download
    // Type assertion needed because type definitions haven't been updated yet
    const incrementalBuffer = (bufferingProgressTracker.getIncrementalBufferDuration as (
      currentPosition: number,
      videoBufferEnd: number,
      audioBufferEnd: number
    ) => number)(
      currentPosition,
      videoBufferedInfo.end,
      audioBufferedInfo.end
    );

    // Add incremental buffer to current buffer length for smooth progress
    const totalBufferedLength = bufferedLength + incrementalBuffer;

    if (bufferedLength >= 0) {
      // Use a more accurate target buffer threshold
      // Browser's canplay event typically fires with ~2-3 seconds of buffer
      // ENOUGH_BUFFER_LENGTH_TO_PLAY_THRESHOLD (5s) is too high for actual playback start
      // Using 2.5 seconds as target - this is closer to when browser actually allows playback
      const TARGET_BUFFER_THRESHOLD = 2.5;
      const progress = totalBufferedLength >= TARGET_BUFFER_THRESHOLD
        ? 100
        : Math.round((totalBufferedLength / TARGET_BUFFER_THRESHOLD) * 100);
      // Clamp between 0 and 100
      const clampedProgress = Math.max(0, Math.min(100, progress));
      setBufferingProgress(clampedProgress);
    } else {
      setBufferingProgress(null);
    }
  }, [getPlayerInstance]);

  // Also listen to seeked event (seek completed) to update position after seek
  usePlayerEvent(
    PLAYER_EVENTS.seeked,
    useCallback(() => {
      // Don't reset tracker on seek - let cleanupOldDownloads handle it
      // Resetting here can cause progress to jump to 0 unexpectedly
      // The cleanup will happen in getIncrementalBufferDuration when bufferEnd is updated
      // Recalculate after seek is completed to use the new accurate position
      calculateProgress();
    }, [calculateProgress]),
    { disable: !shouldCalculateRef.current },
  );

  // Poll for smooth progress updates during segment download
  useEffect(() => {
    if (!shouldCalculateRef.current) {
      return;
    }

    // Calculate immediately
    calculateProgress();

    // Then poll at interval for smooth updates during segment download
    const intervalId = setInterval(() => {
      calculateProgress();
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isBuffering, calculateProgress]);

  // Reset tracker when buffering ends
  // Polling is already disabled in the above useEffect
  useEffect(() => {
    if (!isBuffering) {
      bufferingProgressTracker.reset();
    }
  }, [isBuffering]);

  return bufferingProgress;
};

