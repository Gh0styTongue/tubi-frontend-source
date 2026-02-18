import type { PerformanceCollector } from '@adrise/player';

import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface LivePerformanceMetrics {
  contentId: string,
  metrics: PerformanceCollector['timeMap'],
  streamUrl: string,
}

export function trackLivePerformanceMetrics(
  { contentId, metrics, streamUrl }:
    LivePerformanceMetrics,
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_PERFORMANCE_METRIC,
    message: {
      metrics,
      ...getLiveClientLogBaseInfo({ contentId, streamUrl }),
    },
  });
}
