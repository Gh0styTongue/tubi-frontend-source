import type { PerformanceCollector } from '@adrise/player';

import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface LivePerformanceMetrics {
  contentId: string,
  metrics: PerformanceCollector['timeMap'],
  preloaded: boolean,
  streamUrl: string,
}

export function trackLivePerformanceMetrics(
  { contentId, metrics, preloaded, streamUrl }:
    LivePerformanceMetrics,
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_PERFORMANCE_METRIC,
    message: {
      metrics,
      preloaded,
      ...getLiveClientLogBaseInfo({ contentId, streamUrl }),
    },
  });
}
