import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventLiveAdComplete = {
  track_id: string;
  video_id?: string;
  ad_id: string;
  url: string;
  ad_index: number;
  ad_count: number;
  duration: number; // milliseconds
  ssai_version: number; // 0: UNSPECIFIED, 1: APOLLO, 2: YOUSPACE
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsLiveAdComplete(data: PlayerAnalyticsEventLiveAdComplete) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.LIVE_AD_COMPLETE,
    message: data,
  });
}
