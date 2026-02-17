import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { useEffect } from 'react';

import { setLiveLoading } from 'common/features/playback/actions/live';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

export function useImagePreview({
  isPlayerStalled,
  dispatch,
  videoPlayer,
}: {
    isPlayerStalled: boolean;
    dispatch: TubiThunkDispatch;
    videoPlayer: PlayerDisplayMode
  }) {
  // image preview
  useEffect(() => {
    if (!isPlayerStalled) return;
    if (videoPlayer !== PlayerDisplayMode.DEFAULT) {
      dispatch(setLiveLoading(true));
    }
    return () => {
      dispatch(setLiveLoading(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerStalled]);
}
