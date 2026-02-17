import type { Player } from '@adrise/player';
import { useEffect } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { ViewTimeManagerOptions } from 'client/features/playback/services/ViewTimeManager';
import { ViewTimeManager } from 'client/features/playback/services/ViewTimeManager';

type ViewTimeManagerProps = Omit<ViewTimeManagerOptions, 'player'> & {
  player: Player | LivePlayerWrapper | null | undefined;
};

export function useViewTimeManager({
  player,
  track,
}: ViewTimeManagerProps) {

  useEffect(() => {
    if (!player) return;
    const instance = new ViewTimeManager({
      player,
      track,
    });
    return () => {
      instance.destroy();
    };
  }, [player, track]);
}

export function ViewTimeManagerWrapper(props: ViewTimeManagerProps) {
  useViewTimeManager(props);
  return null;
}
