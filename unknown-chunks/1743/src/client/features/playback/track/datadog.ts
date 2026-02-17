import type { PerformanceCollector } from '@adrise/player';

import { trackPerformanceMetrics, trackVideoMetrics, trackWhitelistedMetricsAndWarnAboutOthers } from 'client/utils/datadog';
import { PLAYER_PERF_METRIC_KEYS, PLAYER_QOS_METRIC_DISTRIBUTION_TYPE_KEYS, PLAYER_QOS_METRIC_INCREMENT_TYPE_KEYS } from 'common/constants/constants';
import { CUSTOM_TAGS } from 'common/constants/tracking-tags';

export const trackCuePointFilledMetrics = ({ isPreroll, count }: { isPreroll: boolean, count: number }) => {
  trackVideoMetrics({ cuePointFilled: 1, clientAdsReceived: count }, { [CUSTOM_TAGS.IS_PREROLL]: isPreroll }, 'increment');
};

export const trackAdPodFinishedMetrics = (
  { isPreroll, count, successCount, failureCount }: {
    isPreroll: boolean,
    count: number,
    successCount: number,
    failureCount: number,
  },
) => {
  trackVideoMetrics({
    adPodFinished: 1,
    clientAdsPlayed: successCount,
    clientAdsFailed: failureCount,
    clientAdsLost: count - failureCount - successCount,
  }, { [CUSTOM_TAGS.IS_PREROLL]: isPreroll }, 'increment');
};

export const trackPlayerPerformanceMetrics = (metrics: PerformanceCollector['timeMap']) => {
  trackWhitelistedMetricsAndWarnAboutOthers({
    keysWhitelist: PLAYER_PERF_METRIC_KEYS,
    metricNamePrefix: 'vodPlayer.',
    metrics,
  });
};

export const trackPlayerQosMetrics = (metrics: {
  [x: string]: number;
}, tags?: {
  [x: string]: string;
}) => {
  const incrementMetrics = {};
  const distributionMetrics = {};
  Object.keys(metrics).forEach(key => {
    if (PLAYER_QOS_METRIC_INCREMENT_TYPE_KEYS.includes(key)) {
      incrementMetrics[`vodQos.${key}`] = metrics[key];
    } else if (PLAYER_QOS_METRIC_DISTRIBUTION_TYPE_KEYS.includes(key)) {
      distributionMetrics[`vodQos.${key}`] = metrics[key];
    }
  });
  if (Object.keys(incrementMetrics).length > 0) {
    trackPerformanceMetrics(incrementMetrics, tags, 'increment');
  }
  if (Object.keys(distributionMetrics).length > 0) {
    trackPerformanceMetrics(distributionMetrics, tags);
  }
};

export const trackVideoFallbackMetrics = () => {
  trackVideoMetrics({ fallbacks: 1 }, {}, 'increment');
};

export type PlayerExitMetricsParam = {
  hasError: boolean;
  stage: string;
  totalViewTime: number;
};

export const trackPlayerPageExitMetrics = ({ hasError, stage, totalViewTime }: PlayerExitMetricsParam) => {
  trackVideoMetrics({ playerExit: 1 }, { [CUSTOM_TAGS.HAS_ERROR]: hasError, [CUSTOM_TAGS.STAGE]: stage }, 'increment');
  if (totalViewTime > 0) {
    trackVideoMetrics({ vodSessionTotalViewTime: totalViewTime });
  }
};

// Live
export const trackLivePlayerExitMetrics = ({ hasError, stage, totalViewTime }: PlayerExitMetricsParam) => {
  trackVideoMetrics({ livePlayerExit: 1 }, { [CUSTOM_TAGS.HAS_ERROR]: hasError, [CUSTOM_TAGS.STAGE]: stage }, 'increment');
  if (totalViewTime > 0) {
    trackVideoMetrics({ liveSessionTotalViewTime: totalViewTime });
  }
};

export const trackLivePlayerPerformanceMetrics = (metrics: PerformanceCollector['timeMap']) => {
  trackWhitelistedMetricsAndWarnAboutOthers({
    keysWhitelist: PLAYER_PERF_METRIC_KEYS,
    metricNamePrefix: 'livePlayer.',
    metrics,
  });
};

export const trackLiveAdFinishedMetrics = () => {
  trackVideoMetrics({ liveAdFinished: 1 }, {}, 'increment');
};

export const trackLiveFirstFrame = () => {
  trackVideoMetrics({ liveFirstFrame: 1 }, {}, 'increment');
};

export const trackLiveBufferRatio = (bufferRatio: number) => {
  if (bufferRatio >= 0) {
    trackVideoMetrics({ liveBufferRatio: bufferRatio });
  }
};

export const trackLiveFatalError = () => {
  trackVideoMetrics({ liveFatalError: 1 }, {}, 'increment');
};
