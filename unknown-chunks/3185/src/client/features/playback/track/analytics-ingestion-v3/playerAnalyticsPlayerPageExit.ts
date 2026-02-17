import type { VODExitCauseType } from 'client/features/playback/session/VODPageSession';
import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/track';

export type PlayerAnalyticsEventPlayerPageExit = {
  track_id: string;
  feedback?: string;
  has_error_modal: boolean;
  content_counts: number;
  ad_counts: number;
  is_ad: boolean;
  is_buffering: boolean;
  stage: string;
  cause?: VODExitCauseType;
  doubts?: VODExitCauseType[];
  content_duration?: number;
  current_position?: number;
};

export function playerAnalyticsPlayerPageExit(data: PlayerAnalyticsEventPlayerPageExit) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.PLAYER_PAGE_EXIT,
    message: data,
  });
}
