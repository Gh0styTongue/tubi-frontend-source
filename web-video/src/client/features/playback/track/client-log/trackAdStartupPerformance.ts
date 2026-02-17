import type { Ad } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsAdStartupPerformance } from '../analytics-ingestion-v3';

interface AdStartupPerformanceParams {
  ad?: Ad;
  adSequence?: number;
  adsCount?: number;
  adPosition?: number;
  isPreroll?: boolean;
  metrics: {
    [x: string]: number;
  };
}

export function trackAdStartupPerformance(
  { metrics, ...data }: AdStartupPerformanceParams,
): void {
  const {
    first_frame_time,
    frag_loaded_time,
    manifest_loaded_time,
    ...other_metrics
  } = metrics;
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    ad_id: nullishCoalescingWrapper(data.ad?.id, ''),
    url: nullishCoalescingWrapper(data.ad?.video, ''),
    is_preroll: data.isPreroll,
    ad_index: data.adSequence,
    ad_count: data.adsCount,
    duration: convertUnitWithMathRound(data.ad?.duration, 1000), // millisecond
    first_frame_time: Math.round(first_frame_time), // millisecond
    frag_loaded_time: Math.round(frag_loaded_time), // millisecond
    manifest_loaded_time: Math.round(manifest_loaded_time), // millisecond
    message_map: convertObjectValueToString({
      metrics: other_metrics,
    }),
  };
  playerAnalyticsAdStartupPerformance(playerAnalyticsData);
}
