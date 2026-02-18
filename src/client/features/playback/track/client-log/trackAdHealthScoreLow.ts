import type { AdHealthScoreLowEventData } from '@adrise/player';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface AdHealthScoreParams {
  event: AdHealthScoreLowEventData
}

export function trackAdHealthScoreLow({
  event,
}: AdHealthScoreParams): void {
  const { ad, healthScore, scores, currentTime, skipAd, duration, reason } = event;
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.AD_HEALTH_SCORE_LOW,
    message: {
      adUrl: ad.video,
      adId: ad.id,
      currentTime,
      healthScore,
      history: scores.history,
      reason,
      currentTimeScore: scores.currentTime,
      bufferGrowthScore: scores.bufferGrowth,
      timeUpdateScore: scores.timeUpdate,
      lowMetrics: scores.lowMetrics || '',
      checkCount: scores.checkCount,
      lowMetricsCount: scores.lowMetricsCount || 0,
      healthThreshold: scores.threshold,
      estimatedTimeCost: scores.estimatedTimeCost,
      skipAd,
      duration,
    },
  });
}
