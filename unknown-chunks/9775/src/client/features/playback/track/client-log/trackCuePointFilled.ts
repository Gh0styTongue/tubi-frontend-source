import type { Player, AdPod, AdRequestMetrics } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';
import { trackLogging } from 'common/utils/track';

import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsCuePointFilled } from '../analytics-ingestion-v3';
import { trackCuePointFilledMetrics } from '../datadog';

export function trackCuePointFilled({
  contentId,
  player,
  response,
  requestPosition,
  metrics,
  cuePoint,
}: {
  contentId: string,
  player?: InstanceType<typeof Player>,
  response?: AdPod,
  requestPosition?: number,
  metrics?: AdRequestMetrics
  cuePoint?: number,
}) {
  const position = player?.getPosition();
  let positionDeviation = 0;
  if (position !== undefined && typeof cuePoint === 'number') {
    positionDeviation = Math.floor(position - cuePoint);
  }
  const isPreroll = nullishCoalescingWrapper(player?.isPreroll(), false);
  const count = nullishCoalescingWrapper(response?.length, -1);
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: contentId,
    position: position !== undefined ? position * 1000 : undefined, // millisecond
    request_position: requestPosition !== undefined ? requestPosition * 1000 : undefined, // millisecond
    position_deviation: positionDeviation * 1000, // millisecond
    cue_point: cuePoint !== undefined ? cuePoint * 1000 : undefined, // millisecond
    ad_response_time: metrics?.responseTime !== undefined ? metrics.responseTime * 1000 : undefined, // millisecond
    is_preroll: isPreroll,
    ad_count: count,
  };
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.CUE_POINT_FILLED,
    message: {
      ...playerAnalyticsData,
      network_response_time: metrics?.networkResponseTime !== undefined ? metrics.networkResponseTime * 1000 : undefined, // millisecond
      request_queue_time: metrics?.requestQueueTime !== undefined ? metrics.requestQueueTime * 1000 : undefined, // millisecond
      retries: nullishCoalescingWrapper(metrics?.retries, 0),
      overlapping_requests: nullishCoalescingWrapper(metrics?.overlappingRequests, 0),
      overlapping_request_hash: metrics?.overlappingRequestHash,
      request_id: metrics?.requestId,
    },
  });
  playerAnalyticsCuePointFilled({
    ...playerAnalyticsData,
    position: convertUnitWithMathRound(position, 1000), // millisecond
    request_position: convertUnitWithMathRound(requestPosition, 1000), // millisecond
    position_deviation: Math.round(positionDeviation * 1000), // millisecond
    cue_point: convertUnitWithMathRound(cuePoint, 1000), // millisecond
    ad_response_time: convertUnitWithMathRound(metrics?.responseTime, 1000), // millisecond
  });

  trackCuePointFilledMetrics({ isPreroll, count });
}
