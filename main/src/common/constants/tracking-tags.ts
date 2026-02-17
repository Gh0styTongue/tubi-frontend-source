/**
 * The tags defined in this file are used as a way of adding dimensions to Datadog telemetries.
 * Datadog charges us based on the number of custom metric, which is identified by a combination of a metric name and tag values.
 * So we need to control the number of tags carefully. Any tags not included in this file will be filtered out.
 */

// used by all
export enum GLOBAL_TAGS {
  ENV = 'env',
  PLATFORM = 'platform',
}

// used by:
// web_ott.performance.metrics.*
// web_ott.video.metric.* [HAS_ERROR, STAGE]
export enum CUSTOM_TAGS {
  CONTAINERS_REQUEST_TYPE = 'containers_req_type',
  EXPERIMENT_GROUP = 'experiment_group',
  INTENTIONAL = 'intentional',
  PAGE = 'page',
  PATH = 'path',
  REFERER = 'referer',
  RESOURCE_NAME = 'resource_name',
  RESOURCE_TYPE = 'resource_type',
  USE_CACHE_KEY = 'use_cache_key',
  HAS_ERROR = 'has_error',
  STAGE = 'stage',
  PAGINATION = 'pagination',
  APP_LAUNCH_TYPE = 'app_launch_type',
  IS_PREROLL = 'is_preroll',
  CDN = 'cdn',
  COUNTRY = 'country',
}

// used by:
// tubi.web.express.router.*
// web_ott_metrics.node.*
export enum SERVER_TAGS {
  NAMESPACE = 'kube_namespace',
  POD_NAME = 'kube_pod_name',
  POD_UID = 'kube_pod_uid',
  SERVICE = 'service',
  COUNTRY = 'country',
}

// values of CONTAINERS_REQUEST_TYPE tag
export const CONTAINERS_REQUEST_TYPE = {
  INITIAL: 'initial',
  FOLLOWING: 'following',
};

