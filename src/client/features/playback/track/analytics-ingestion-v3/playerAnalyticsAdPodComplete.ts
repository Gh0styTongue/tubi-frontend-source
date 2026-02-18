import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventAdPodComplete = {
  track_id: string;
  video_id: string;
  ad_count: number;
  successful_count: number;
  failed_count: number;
  total_ads_duration: number;
  play_time_exclude_pause_time: number;
  is_preroll: boolean;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsAdPodComplete(data: PlayerAnalyticsEventAdPodComplete) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.AD_POD_COMPLETE,
    message: data,
  });
}
