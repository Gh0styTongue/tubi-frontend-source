import { PLAYER_EVENTS } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { useState, useEffect, useRef } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { trackLiveError } from 'client/features/playback/track/client-log';
import type { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';

export function useLivePlayerErrorListener({
  wrapper,
  qualityManager,
  id,
  stream_url,
}: {
    wrapper: LivePlayerWrapper | null;
    stream_url: string;
    id: string;
    qualityManager: LivePlaybackQualityManager | undefined
  }) {
  const [playerError, setPlayerError] = useState<ErrorEventData | null>(null);
  const qualityManagerRef = useRef(qualityManager);
  qualityManagerRef.current = qualityManager;
  useEffect(() => {
    if (!wrapper) return;
    const timeListener = () => {
      // 'time' events mean player goes well, we consider errors are resolved when the time update event happens.
      setPlayerError(null);
    };
    const errorListener = (error: ErrorEventData) => {
      const isFatalError = (window.MediaError && error.error instanceof MediaError) || error.fatal;
      trackLiveError(error, { contentId: id, streamUrl: stream_url, wrapper, qualityManager: qualityManagerRef.current });
      if (!isFatalError) return;
      setPlayerError(error);
    };
    wrapper.addListener(PLAYER_EVENTS.time, timeListener);
    wrapper.addListener(PLAYER_EVENTS.error, errorListener);
    return () => {
      wrapper.removeListener(PLAYER_EVENTS.time, timeListener);
      wrapper.removeListener(PLAYER_EVENTS.error, errorListener);
      setPlayerError(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper]);
  return playerError;
}
