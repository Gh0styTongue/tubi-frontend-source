import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useMemo, useRef, useState } from 'react';

import { AUTO_START_MUTED, RESUME_TIME_QUERY } from 'common/constants/constants';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';

/**
 * Hook to manage the unmute modal for muted autoplay scenarios.
 * When the user switches accounts during video playback, the video
 * resumes with muted autoplay. This modal prompts the user to unmute.
 */
export const useUnmuteModal = () => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const [isUnmuteModalOpen, setIsUnmuteModalOpen] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Check if we should show unmute modal (for account switch muted autoplay scenario)
  const shouldShowUnmuteModal = useMemo(() => {
    /* istanbul ignore if */
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get(AUTO_START_MUTED) === 'true';
  }, []);

  // Show modal on first play event if autoStartMuted is present
  usePlayerEvent(PLAYER_EVENTS.play, useCallback(() => {
    if (shouldShowUnmuteModal && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsUnmuteModalOpen(true);
    }
  }, [shouldShowUnmuteModal]));

  // Cleanup URL params after consumption to prevent stale state on refresh
  const cleanupUrlParams = useCallback(() => {
    /* istanbul ignore if */
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const hasParams = url.searchParams.has(AUTO_START_MUTED) || url.searchParams.has(RESUME_TIME_QUERY);
    if (hasParams) {
      url.searchParams.delete(AUTO_START_MUTED);
      url.searchParams.delete(RESUME_TIME_QUERY);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleCloseUnmuteModal = useCallback(() => {
    const player = getPlayerInstance();
    if (player) {
      player.setMute(false);
    }
    cleanupUrlParams();
    setIsUnmuteModalOpen(false);
  }, [getPlayerInstance, cleanupUrlParams]);

  return {
    isUnmuteModalOpen,
    handleCloseUnmuteModal,
  };
};
