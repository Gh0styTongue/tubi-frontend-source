import throttle from 'lodash/throttle';
import { useCallback, useRef } from 'react';

import type { ViewTimeManagerOptions } from 'client/features/playback/services/ViewTimeManager';
import { ViewTimeManager } from 'client/features/playback/services/ViewTimeManager';
import { useOnLivePlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnLivePlayerCreate';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import useLatest from 'common/hooks/useLatest';

type ViewTimeManagerProps = {
  track: ReturnType<ViewTimeManagerOptions['getTrack']>;
};

export function useViewTimeManager({ track }: ViewTimeManagerProps) {
  const viewTimeManagerRef = useRef<ViewTimeManager | undefined>();
  const trackRef = useLatest(track);

  useOnPlayerCreate(useCallback((player) => {
    viewTimeManagerRef.current = new ViewTimeManager({
      player,
      getTrack: () => throttle(trackRef.current, 10_000),
    });
    const viewTimeManager = viewTimeManagerRef.current;
    return () => {
      viewTimeManager.destroy();
    };
  }, [trackRef]));
}

export function useLiveViewTimeManager({ track }: ViewTimeManagerProps) {
  const viewTimeManagerRef = useRef<ViewTimeManager | undefined>();
  const trackRef = useLatest(track);

  useOnLivePlayerCreate(useCallback((player) => {
    viewTimeManagerRef.current = new ViewTimeManager({
      player,
      getTrack: () => throttle(trackRef.current, 10_000),
    });
    const viewTimeManager = viewTimeManagerRef.current;
    return () => {
      viewTimeManager.destroy();
    };
  }, [trackRef]));
}

export function ViewTimeManagerWrapper(props: ViewTimeManagerProps) {
  useViewTimeManager(props);
  return null;
}
