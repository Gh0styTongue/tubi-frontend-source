import type { Captions, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useMemo } from 'react';

import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import { captionsStore, useCaptionsStore } from 'common/features/playback/store/captionsStore';

export function usePlayerCaptions() {
  // Set up subscriptions when player is created
  useOnPlayerCreate(useCallback((player: Player, _managers: PlayerManagers) => {
    const initialList = player.getCaptionsList();
    const initialIndex = player.getCaptions();
    captionsStore.getState().setCaptionsList(initialList);
    captionsStore.getState().setCaptionsIndex(initialIndex);

    // Subscribe to changes
    const onCaptionsListChange = ({ captionsList: newList }: { captionsList: Captions[] }) => {
      captionsStore.getState().setCaptionsList(newList);
    };

    const onCaptionsChange = ({ captionsIndex: newIndex }: { captionsIndex: number }) => {
      captionsStore.getState().setCaptionsIndex(newIndex);
    };

    player.on(PLAYER_EVENTS.captionsListChange, onCaptionsListChange);
    player.on(PLAYER_EVENTS.captionsChange, onCaptionsChange);

    return () => {
      player.off(PLAYER_EVENTS.captionsListChange, onCaptionsListChange);
      player.off(PLAYER_EVENTS.captionsChange, onCaptionsChange);
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

