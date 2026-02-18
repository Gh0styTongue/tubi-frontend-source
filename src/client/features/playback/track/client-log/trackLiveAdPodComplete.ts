import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { LiveAdPodCompleteEventData } from 'client/features/playback/live/types';

import { playerAnalyticsLiveAdPodComplete } from '../analytics-ingestion-v3';
import type { PlayerAnalyticsEventLiveAdPodComplete } from '../analytics-ingestion-v3/playerAnalyticsLiveAdPodComplete';
import { getLivePlayerAnalyticsBaseInfo } from './utils/getLivePlayerAnalyticsBaseInfo';

export function trackLiveAdPodComplete(event: LiveAdPodCompleteEventData, { wrapper, contentId, videoPlayer, ssaiVersion }: { wrapper: LivePlayerWrapper, contentId: string, videoPlayer: PlayerDisplayMode, ssaiVersion: string }) {
  const baseInfo = getLivePlayerAnalyticsBaseInfo({
    wrapper,
    contentId,
    videoPlayer,
    ssaiVersion,
  });

  const data: PlayerAnalyticsEventLiveAdPodComplete = {
    track_id: baseInfo.track_id,
    video_id: baseInfo.video_id,
    total_count: event.adsCount,
    ssai_version: baseInfo.ssai_version,
  };

  playerAnalyticsLiveAdPodComplete(data);
}
