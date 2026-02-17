import type { Player } from '@adrise/player';
import throttle from 'lodash/throttle';
import { useEffect } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { ViewTimeManagerOptions } from 'client/features/playback/services/ViewTimeManager';
import { ViewTimeManager } from 'client/features/playback/services/ViewTimeManager';
import useLatest from 'common/hooks/useLatest';

type ViewTimeManagerProps = Omit<ViewTimeManagerOptions, 'player'> & {
  player: Player | LivePlayerWrapper | null | undefined;
};

export function useViewTimeManager({
  player,
  track,
}: ViewTimeManagerProps) {
  const throttledTrack = throttle(track, 10_000);
  const throttledTrackRef = useLatest(throttledTrack);

  useEffect(() => {
    if (!player) return;
    const instance = new ViewTimeManager({
      player,
      track: throttledTrackRef.current,
    });
    return () => {
      instance.destroy();
    };
    // Adding dependencies to this effect may cause the ViewTimeManager to be recreated unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);
}

export function ViewTimeManagerWrapper(props: ViewTimeManagerProps) {
  useViewTimeManager(props);
  return null;
}
