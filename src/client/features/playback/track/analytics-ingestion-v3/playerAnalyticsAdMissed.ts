import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventAdMissed = {
  track_id: string;
  position: number;
  cue_point: number;
  ad_count: number;
  total_ads_duration: number;
  reason: string;
  response_time: number;
  video_id: string;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsAdMissed(data: PlayerAnalyticsEventAdMissed) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.AD_MISSED,
    message: data,
  });
}
