import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventVODErrors = {
  log_version: string;
  track_id: string;
  video_id: string;
  position?: number;
  tvt: number;
  error_code: number;
  error_details?: string;
  fatal: boolean;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsVODErrors(data: PlayerAnalyticsEventVODErrors) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.CONTENT_ERROR,
    message: data,
  });
}
