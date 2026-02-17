import { useCallback, useEffect } from 'react';

import {
  enterPage,
  resetVODPageSession,
} from 'client/features/playback/session/VODPageSession';
import type { VODPlaybackInfo } from 'client/features/playback/session/VODPlaybackSession';
import { VODPlaybackEvents, VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import {
  trackVODPlayerServiceQuality,
} from 'client/features/playback/track/client-log';
import type { Video } from 'common/types/video';

interface UseSetupVodSessionsParams {
  video: Video;
  isFromAutoplay: boolean;
  isDeeplink: boolean;
  resumePosition: number;
}

/**
 * Intended to encapsulate code that sets up VOD Playback and VOD Page session
 */
export const useSetupVodSessions = ({ video, isFromAutoplay, isDeeplink, resumePosition }: UseSetupVodSessionsParams) => {
  const reportPlaybackSessionData = useCallback((retrievedPlaybackInfo?: VODPlaybackInfo) => {
    trackVODPlayerServiceQuality(retrievedPlaybackInfo);
  }, []);

  useEffect(() => {
    resetVODPageSession();
    VODPlaybackSession.getInstance().getEventEmitter().on(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    enterPage({
      isAutomaticAutoplay: false,
      contentId: video?.id,
      isDeeplink,
    });
    VODPlaybackSession.getInstance().startPlayback({
      isSeries: !!video?.series_id,
      contentId: video?.id,
      isAutoplay: isFromAutoplay,
      isContinueWatching: resumePosition > 0,
    });
    // Intentionally run on mount and never again no matter if
    // any values used internally change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reportPlaybackSessionData };
};
