import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/track';

export type PlayerAnalyticsEventAdStart = {
  log_version: string;
  track_id: string;
  video_id: string;
  ad_id?: string;
  url?: string;
  is_preroll?: boolean;
  ad_index?: number;
  ad_count?: number;
  duration?: number;
};

export function playerAnalyticsAdStart(data: PlayerAnalyticsEventAdStart) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.AD_START,
    message: data,
  });
}
