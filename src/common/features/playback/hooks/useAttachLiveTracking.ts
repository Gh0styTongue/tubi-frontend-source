import type { StartupPerformanceEventData } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { LiveAdPodCompleteEventData } from 'client/features/playback/live/types';
import type { LiveAdEventData } from 'client/features/playback/live/utils/liveAdClient';
import { trackLiveAdComplete } from 'client/features/playback/track/client-log/trackLiveAdComplete';
import { trackLiveAdPodComplete } from 'client/features/playback/track/client-log/trackLiveAdPodComplete';
import { trackLiveAdStart } from 'client/features/playback/track/client-log/trackLiveAdStart';
import { trackLiveContentStart } from 'client/features/playback/track/client-log/trackLiveContentStart';
import { trackLiveContentStartupPerformance } from 'client/features/playback/track/client-log/trackLiveContentStartupPerformance';
import type { VideoResource } from 'common/types/video';

interface attachLiveTrackingParams {
  wrapper: LivePlayerWrapper | null;
  contentId: string;
  videoPlayer: PlayerDisplayMode;
  videoResource?: VideoResource;
}

export const useAttachLiveTracking = ({ wrapper, contentId, videoPlayer, videoResource }: attachLiveTrackingParams) => {
  const ssaiVersion = videoResource?.ssai_version || '';

  const onLiveAdStart = useCallback((event: LiveAdEventData) => {
    if (!wrapper) return;
    trackLiveAdStart(event, { wrapper, contentId, videoPlayer, ssaiVersion });
  }, [wrapper, contentId, videoPlayer, ssaiVersion]);

  const onLiveAdComplete = useCallback((event: LiveAdEventData) => {
    if (!wrapper) return;
    trackLiveAdComplete(event, { wrapper, contentId, videoPlayer, ssaiVersion });
  }, [wrapper, contentId, videoPlayer, ssaiVersion]);

  const onLiveAdPodComplete = useCallback((event: LiveAdPodCompleteEventData) => {
    if (!wrapper) return;
    trackLiveAdPodComplete(event, { wrapper, contentId, videoPlayer, ssaiVersion });
  }, [wrapper, contentId, videoPlayer, ssaiVersion]);

  const onLiveContentStart = useCallback(() => {
    if (!wrapper || !videoResource) return;
    trackLiveContentStart({ wrapper, contentId, videoPlayer, ssaiVersion, videoResource });
  }, [wrapper, contentId, videoPlayer, ssaiVersion, videoResource]);

  const onLiveStartupPerformance = useCallback((event: StartupPerformanceEventData) => {
    if (!wrapper || !videoResource) return;
    const { metrics } = event;
    trackLiveContentStartupPerformance({ wrapper, contentId, videoPlayer, ssaiVersion, videoResource, metrics });
  }, [wrapper, contentId, videoPlayer, ssaiVersion, videoResource]);

  useEffect(() => {
    if (!wrapper || !videoResource) {
      return;
    }

    wrapper.on(PLAYER_EVENTS.adStart, onLiveAdStart);
    wrapper.on(PLAYER_EVENTS.adComplete, onLiveAdComplete);
    wrapper.on(PLAYER_EVENTS.adPodComplete, onLiveAdPodComplete);
    wrapper.on(PLAYER_EVENTS.liveContentStart, onLiveContentStart);
    wrapper.on(PLAYER_EVENTS.startupPerformance, onLiveStartupPerformance);

    return () => {
      wrapper.off(PLAYER_EVENTS.adStart, onLiveAdStart);
      wrapper.off(PLAYER_EVENTS.adComplete, onLiveAdComplete);
      wrapper.off(PLAYER_EVENTS.adPodComplete, onLiveAdPodComplete);
      wrapper.off(PLAYER_EVENTS.liveContentStart, onLiveContentStart);
      wrapper.off(PLAYER_EVENTS.startupPerformance, onLiveStartupPerformance);
    };
  }, [
    wrapper,
    videoResource,
    onLiveAdStart,
    onLiveAdComplete,
    onLiveAdPodComplete,
    onLiveContentStart,
    onLiveStartupPerformance,
  ]);
};
