import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventAdComplete = {
  track_id: string;
  video_id: string;
  ad_id: string;
  url: string;
  is_preroll?: boolean;
  ad_index?: number;
  ad_count?: number;
  duration?: number;
  play_time_exclude_pause_time?: number;
};

export function playerAnalyticsAdComplete(data: PlayerAnalyticsEventAdComplete) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.AD_COMPLETE,
    message: data,
  });
}
