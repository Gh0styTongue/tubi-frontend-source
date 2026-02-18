import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventLiveAdPodComplete = {
  track_id: string;
  video_id?: string;
  total_count: number;
  ssai_version: number; // 0: UNSPECIFIED, 1: APOLLO, 2: YOUSPACE
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsLiveAdPodComplete(data: PlayerAnalyticsEventLiveAdPodComplete) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.LIVE_AD_POD_COMPLETE,
    message: data,
  });
}
