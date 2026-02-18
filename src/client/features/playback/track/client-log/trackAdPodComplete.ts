import type { AdPodCompleteEventData } from '@adrise/player/lib';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';

import { playerAnalyticsAdPodComplete } from '../analytics-ingestion-v3';
import { trackAdPodFinishedMetrics } from '../datadog';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

export function trackAdPodComplete(event: AdPodCompleteEventData & { contentId: string; }) {
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: event.contentId,
    ad_count: event.count,
    successful_count: event.successCount,
    failed_count: event.failureCount,
    total_ads_duration: Math.round(event.duration * 1000), // millisecond
    play_time_exclude_pause_time: Math.round(event.totalDurationExcludePause), // millisecond
    is_preroll: event.isPreroll,
  };
  playerAnalyticsAdPodComplete(playerAnalyticsData);
  const { isPreroll, count, successCount, failureCount } = event;
  trackAdPodFinishedMetrics({ isPreroll, count, successCount, failureCount });
}
