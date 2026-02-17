import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

export type PlayerAnalyticsEventCuePointFilled = {
  track_id: string;
  video_id: string;
  position?: number;
  request_position?: number;
  position_deviation: number;
  cue_point?: number;
  ad_response_time?: number;
  is_preroll: boolean;
  ad_count: number;
};

export function playerAnalyticsCuePointFilled(data: PlayerAnalyticsEventCuePointFilled) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.CUE_POINT_FILLED,
    message: data,
  });
}
