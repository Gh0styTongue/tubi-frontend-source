import type { AdRequestMetrics, PresetAdType } from '@adrise/player';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface AdPodFetchParams {
  isError: boolean;
  adType: 'preroll' | 'midroll';
  metrics?: AdRequestMetrics;
  adsCount?: number;
  message?: string;
  // A duration when we start fetch until users can noticed
  silentDuration?: number;
  presetAdType?: PresetAdType;
}

function formatTimeOut(timeout?: number) {
  if (typeof timeout === 'number') {
    return timeout / 1000;
  }
  return 0;
}

const SAMPLE_RATE = 0.1;

export function trackAdPodFetch({
  isError,
  adType,
  metrics,
  adsCount,
  message,
  silentDuration = 0,
  presetAdType,
}: AdPodFetchParams) {
  if (presetAdType === 'preview') {
    silentDuration = 10;
  }
  const baseMessage = {
    ad_type: adType,
    message,
    timeout: formatTimeOut(metrics?.timeout),
    silent_duration: silentDuration,
  };

  if (Math.random() > SAMPLE_RATE) {
    return;
  }

  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_POD_FETCH,
    message: {
      ...baseMessage,
      is_error: isError,
      ads_count: adsCount ?? -1,
      network_response_time: metrics?.networkResponseTime,
      duration: metrics?.responseTime ?? 0,
      retries: metrics?.retries ?? 0,
      max_tries: metrics?.maxRetries ?? 0,
      request_id: metrics?.requestId ?? '',
      presetAdType,
    },
  });
}

