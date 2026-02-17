import type { PerformanceCollector } from '@adrise/player';

import type ApiClient from 'common/helpers/ApiClient';
import { dependencies } from 'common/utils/track';

export const trackCuePointFilledMetrics = (
  params: {
    isPreroll: boolean,
    count: number,
  },
  _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/cue-point-filled-metrics', {
    data: params,
  });
};

export const trackAdPodFinishedMetrics = (
  params: {
    isPreroll: boolean,
    count: number,
    successCount: number,
    failureCount: number,
  },
  _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient
) => {
  _apiClient.sendBeacon('/oz/videos/ad-pod-finished-metrics', {
    data: params,
  });
};

export const trackPlayerPerformanceMetrics = (metrics: PerformanceCollector['timeMap'], _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/performance/player-metrics', {
    data: {
      metrics,
    },
  });
};

export const trackPlayerQosMetrics = (metrics: {
  [x: string]: number;
}, tags?: {
  [x: string]: string;
}, _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/performance/player-qos-metrics', {
    data: {
      metrics,
      ...(tags !== undefined ? { tags } : {}),
    },
  });
};

export const trackVideoFallbackMetrics = (_apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/fallback-metrics');
};

export type PlayerExitMetricsParam = {
  hasError: boolean;
  stage: string;
  totalViewTime: number;
};

export const trackPlayerPageExitMetrics = (param: PlayerExitMetricsParam, _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/player-exit-metrics', {
    data: param,
  });
};

// Live
export const trackLivePlayerExitMetrics = (param: PlayerExitMetricsParam, _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/live-player-exit-metrics', {
    data: param,
  });
};

export const trackLivePlayerPerformanceMetrics = (metrics: PerformanceCollector['timeMap'], _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  return _apiClient.sendBeacon('/oz/performance/live-player-metrics', {
    data: {
      metrics,
    },
  });
};

export const trackLiveAdFinishedMetrics = (_apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/live-ad-finished-metrics');
};

export const trackLiveFirstFrame = (_apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/live-first-frame');
};

export const trackLiveBufferRatio = (bufferRatio: number, _apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/live-buffer-ratio', {
    data: {
      bufferRatio,
    },
  });
};

export const trackLiveFatalError = (_apiClient: InstanceType<typeof ApiClient> = dependencies.apiClient) => {
  _apiClient.sendBeacon('/oz/videos/live-fatal-error');
};
