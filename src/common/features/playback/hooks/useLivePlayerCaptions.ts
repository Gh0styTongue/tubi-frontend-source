import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useMemo } from 'react';

import type { LivePlayerManagers, LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { useOnLivePlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnLivePlayerCreate';
import { captionsStore, useCaptionsStore } from 'common/features/playback/store/captionsStore';
import { getCaptionFromTextTrack } from 'common/utils/captionTools';

export function useLivePlayerCaptions() {
  // Set up subscriptions when live player is created
  useOnLivePlayerCreate(useCallback((player: LivePlayerWrapper, _managers: LivePlayerManagers) => {
    // Read initial state from player's text tracks
    const videoElement = player.videoElement;
    if (videoElement) {
      const textTracks = Array.from(videoElement.textTracks || []);
      const initialList = textTracks.map(track => getCaptionFromTextTrack(track));
      captionsStore.getState().setCaptionsList(initialList);
    }

    // Subscribe to changes
    const onCaptionsListChange = (textTracks: TextTrack[]) => {
      const captions = textTracks.map(track => getCaptionFromTextTrack(track));
      captionsStore.getState().setCaptionsList(captions);
    };

    const onCaptionsChange = (language: string) => {
      // Find the index of the caption with matching language
      const videoElement = player.videoElement;
      if (!videoElement) {
        return;
      }
      const currentList = Array.from(videoElement.textTracks || []).map(track => getCaptionFromTextTrack(track));
      const index = currentList.findIndex(caption =>
        caption.lang === language || caption.label === language
      );
      captionsStore.getState().setCaptionsIndex(Math.max(0, index));
    };

    player.addListener(PLAYER_EVENTS.captionsListChange, onCaptionsListChange);
    player.addListener(PLAYER_EVENTS.captionsChange, onCaptionsChange);

    return () => {
      player.removeListener(PLAYER_EVENTS.captionsListChange, onCaptionsListChange);
      player.removeListener(PLAYER_EVENTS.captionsChange, onCaptionsChange);
      // Only reset if store is empty (no other components using it)
      // This prevents reset when drawer closes but PlayerOverlay is still active
      const state = captionsStore.getState();
      if (state.captionsList.length === 0) {
        captionsStore.getState().reset();
      }
    };
  }, []));

  // Select values separately to avoid creating new object references
  const captionsList = useCaptionsStore((state) => state.captionsList);
  const captionsIndex = useCaptionsStore((state) => state.captionsIndex);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({ captionsList, captionsIndex }),
    [captionsList, captionsIndex]
  );
}

