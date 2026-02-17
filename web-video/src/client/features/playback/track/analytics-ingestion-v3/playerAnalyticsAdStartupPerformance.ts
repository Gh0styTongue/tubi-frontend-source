import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventAdStartupPerformance = {
  track_id: string;
  ad_id: string;
  url: string;
  is_preroll?: boolean;
  ad_index?: number;
  ad_count?: number;
  duration?: number;
  first_frame_time: number;
  frag_loaded_time: number;
  variant_loaded_time?: number;
  manifest_loaded_time: number;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsAdStartupPerformance(data: PlayerAnalyticsEventAdStartupPerformance) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.AD_STARTUP_PERFORMANCE,
    message: data,
  });
}
