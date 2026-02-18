import { convertToDate, isSameDay } from '@adrise/utils/lib/time';
import debounce from 'lodash/debounce';

import type { HybDeviceInfo } from 'client/systemApi/types';
import { parseUrl } from 'client/utils/clientTools';
import { getData, setData, supportsSessionStorage, removeData } from 'client/utils/sessionDataStorage';
import {
  DEEPLINK_TO_PLAYER_INFO,
  COMPUTED_PERF_METRICS,
  IS_PERFORMANCE_COLLECTING_ON,
  PERF_METRIC_KEYS,
  RESOURCE_TYPES,
  RESOURCE_TYPES_KEYS,
  REQ_TIMINGS_STORAGE,
  IS_APP_STARTED_UP,
} from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { REQ_WHITELIST_CONFIGS } from 'common/constants/performance-metrics';
import { WEB_ROUTES, OTT_ROUTES } from 'common/constants/routes';
import { CUSTOM_TAGS } from 'common/constants/tracking-tags';
import type { Experiment } from 'common/experiments/Experiment';
import logger from 'common/helpers/logging';
import { tryJSONParse } from 'common/utils/jsonTools';
import { alwaysResolve } from 'common/utils/promise';
import { dependencies, trackLogging } from 'common/utils/track';
import { getRouteRegExp, matchesRoute } from 'common/utils/urlPredicates';
import {
  APP_LAUNCH_TS,
  APP_RESUME_TS,
  INTRO_PAGE_LOAD_TIME,
  INTRO_ANIMATION_START_TS,
  INTRO_ANIMATION_END_TS,
  INTRO_DOC_DOWNLOAD_TIME,
  INTRO_DOC_TIME_ORIGIN,
  INTRO_DOC_TTFB,
  INTRO_VIDEO_LOAD_DURATION,
  WEBVIEW_LATEST_START_TS,
  WEBVIEW_START_TS,
  WEB_DOC_LOADED_TS,
  REACT_APP_RENDERED_TS,
} from 'ott/constants/tracking';

export type EventTags = Record<string, string>;
type TrackLoggingMessage = Record<string, unknown>;

// Considering the timestamps passed from the native-side could be unstable,
// we treat it as invalid data when the value of time-related metric is larger than 3 mins.
const MAX_TIME_METRIC_VALUE = 1000 * 60 * 3;

/**
 * Combine multiple experiments into one tag, the format would be:
 * `<experimentA>=<valueA>&<experimentB>=<valueB>`
 */
export function getExperimentGroupTagValue(experiments?: Experiment[]) {
  if (!experiments || experiments.length === 0) {
    return undefined;
  }
  return experiments.map((experiment) => {
    const expName = experiment.configuredExperimentName;
    const expValue = experiment.getValue();
    if (typeof expValue === 'object') {
      // If using a nested object for the experiment value, such as for episode pagination,
      // just log the treatment name instead.
      return `${expName}=${experiment.treatment}`;
    }
    return `${expName}=${expValue}`;
  }).join('&');
}

/**
 * Modify the message object sent to client logs to add additional useful information without the cost increase associated
 * with metrics on DataDog.
 * @param {Object|string} existingMessage The object with keys for the metrics and tags that were sent to DataDog to use as a base.
 */
export const augmentMessageForClientLogs = (existingMessage: TrackLoggingMessage) => {
  // Since we can include more information in the client logs, and we don't have the same restrictions with increases in
  // cardinality (the number of possible combinations of all indexed tag values) leading to an increase in cost, we can
  // track IDs and other information in the performance logs for those pages to give us more information to do more
  // detailed analysis in Sisense with.
  const data = {
    ...existingMessage,
  };
  const pathname = parseUrl().pathname;
  if (__WEBPLATFORM__) {
    const isMoviePage = pathname.startsWith(`${WEB_ROUTES.movies}/`);
    const isSeriesEpisodePage = pathname.startsWith(`${WEB_ROUTES.tvShows}/`);
    const isSeriesPage = pathname.startsWith(`${WEB_ROUTES.series}/`);
    if (isMoviePage) {
      data.contentType = 'movie';
    } else if (isSeriesEpisodePage) {
      data.contentType = 'episode';
    } else if (isSeriesPage) {
      data.contentType = 'series';
    }
    if (isSeriesPage || isSeriesEpisodePage || isMoviePage) {
      const idPrefix = isSeriesPage ? '0' : '';
      data.contentId = idPrefix + pathname.split(/\//g).filter(Boolean)[1];
    }
  } else {
    const matchingContentRoute = [
      OTT_ROUTES.player,
      OTT_ROUTES.livePlayer,
      OTT_ROUTES.series,
      OTT_ROUTES.episodeList,
    ].find(route => matchesRoute(route, pathname));
    if (matchingContentRoute) {
      const routeRegex = getRouteRegExp(matchingContentRoute);
      const contentId = routeRegex.exec(pathname)?.[1];
      const isSeriesRelatedPage = matchingContentRoute === OTT_ROUTES.series || matchingContentRoute === OTT_ROUTES.episodeList;
      data.contentId = isSeriesRelatedPage ? `0${contentId}` : contentId;
    }
  }
  return data;
};

export const sendPerformanceLogging = (message: TrackLoggingMessage) => {
  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.APP_PERFORMANCE,
    message: augmentMessageForClientLogs(message),
  });
};

export const sendEvent = (metric?: { name: string, value: number }, tags?: EventTags) => {
  const { name, value } = metric || {};
  if (!IS_PERFORMANCE_COLLECTING_ON || !name || typeof value !== 'number' || value < 0) return;

  try {
    const metrics = {
      // If value is not an integer, only retain two digits after the decimal point.
      [name]: value % 1 === 0 ? value : Number(value.toFixed(2)),
    };
    dependencies.apiClient.sendBeacon('/oz/performance/event', {
      data: {
        metrics,
        tags,
      },
    });
    sendPerformanceLogging({ ...metrics, ...tags });
  // eslint-disable-next-line no-empty
  } catch (e) {}
};

const getStartMarkerName = (label: string) => `${label}-start`;
const getEndMarkerName = (label: string) => `${label}-end`;
export const mark = (label: string) => {
  const { performance } = window;
  if (!performance || !performance.mark || !label) return;
  performance.mark(label);
};

export const markStart = (label: string) => {
  mark(getStartMarkerName(label));
};

export const markEnd = (label: string) => {
  mark(getEndMarkerName(label));
};

export const measure = (label: string) => {
  const { performance } = window;
  if (!performance || !performance.measure || !label) return;

  try {
    const startMarker = getStartMarkerName(label);
    const endMarker = getEndMarkerName(label);
    performance.measure(label, startMarker, endMarker);
    const item = performance.getEntriesByName(label)[0];
    performance.clearMarks(startMarker);
    performance.clearMarks(endMarker);
    performance.clearMeasures(label);
    return item?.duration;
  } catch (err) {
    // do nothing
  }
};

// record metrics includes intro* and dom*
let performanceTimingRecords = {};

/**
 * A convenient method to combine measurement and reporting
 * @param {String} metricName
 * @param {Object} tags
 */
export const measureAndReport = (metricName: string, tags?: EventTags) => {
  const duration = measure(metricName);

  if (!duration) return;
  sendEvent({ name: metricName, value: duration }, tags);
};

export const getTrackingPathname = () => {
  // To avoid creating too many custom metrics (like video page includes the video id), we ignore the video id.
  // We just track player page as '/player' and track home page.
  // https://docs.datadoghq.com/developers/metrics/custom_metrics/
  let trackingPathname;
  const pathname = parseUrl().pathname;

  if (__WEBPLATFORM__) {
    if (pathname.startsWith(`${WEB_ROUTES.movies}/`) || pathname.startsWith(`${WEB_ROUTES.tvShows}/`)) {
      trackingPathname = '/player';
    } else if (pathname === WEB_ROUTES.home) {
      trackingPathname = WEB_ROUTES.home;
    } else if (pathname === WEB_ROUTES.landing) {
      trackingPathname = WEB_ROUTES.landing;
    } else if (pathname.startsWith(WEB_ROUTES.series)) {
      trackingPathname = WEB_ROUTES.series;
    }
  } else {
    if (pathname.startsWith(OTT_ROUTES.player.split(':')[0])) {
      trackingPathname = '/player';
    } else if (pathname.startsWith(OTT_ROUTES.livePlayer.split(':')[0])) {
      trackingPathname = '/livePlayer';
    } else if (pathname.startsWith(OTT_ROUTES.onboarding.split(':')[0])) {
      trackingPathname = '/onboarding';
    } else if (pathname === OTT_ROUTES.home) {
      trackingPathname = OTT_ROUTES.home;
    } else if (pathname === OTT_ROUTES.landing) {
      trackingPathname = OTT_ROUTES.landing;
    } else if (matchesRoute(OTT_ROUTES.series, pathname)) {
      trackingPathname = '/series';
    } else if (matchesRoute(OTT_ROUTES.episodeList, pathname)) {
      trackingPathname = '/series/episodes-list';
    }
  }

  return trackingPathname;
};

export const reportClientTiming = (tags = {}) => {
  const { performance } = window;
  const trackingPathname = getTrackingPathname();
  if (!trackingPathname || !performance) return;

  const metrics: Partial<Record<
    keyof typeof COMPUTED_PERF_METRICS | keyof typeof PERF_METRIC_KEYS,
    number
  >> = {};

  // for platforms such as Comcast and Cox, they use Safari 8 kernel,
  // when calling performance.getEntriesByType('navigation'), it returns an empty object
  // we can only use performance.timing on these platforms
  if (
    typeof performance.getEntriesByType === 'function'
    && performance.getEntriesByType('navigation')
    && typeof performance.getEntriesByType('navigation')[0] === 'object'
  ) {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    PERF_METRIC_KEYS.filter(key => navigationTiming[key] > 0).forEach((key) => {
      metrics[key] = Math.round(navigationTiming[key]);
    });
    const { requestStart, responseEnd, responseStart } = navigationTiming;
    metrics[COMPUTED_PERF_METRICS.documentDownloadTime] = Math.round(responseEnd - responseStart);
    metrics[COMPUTED_PERF_METRICS.ttfb] = Math.round(responseStart - requestStart);

  } else if (performance.timing) {
    const { requestStart, responseStart, responseEnd } = performance.timing;
    PERF_METRIC_KEYS.filter(key => performance.timing[key] > 0).forEach((key) => {
      metrics[key] = Math.round(performance.timing[key] - performance.timing.navigationStart);
    });
    metrics[COMPUTED_PERF_METRICS.documentDownloadTime] = Math.round(responseEnd - responseStart);
    metrics[COMPUTED_PERF_METRICS.ttfb] = Math.round(responseStart - requestStart);

  } else {
    return;
  }

  performanceTimingRecords = { ...performanceTimingRecords, ...metrics };

  tags[CUSTOM_TAGS.PAGE] = trackingPathname;
  alwaysResolve(dependencies.apiClient.post('/oz/performance/metrics', { data: {
    metrics,
    tags,
  } }));
  sendPerformanceLogging({ ...metrics, ...tags });
};

const timestampKeys = [
  INTRO_PAGE_LOAD_TIME,
  INTRO_ANIMATION_START_TS,
  INTRO_ANIMATION_END_TS,
  INTRO_DOC_DOWNLOAD_TIME,
  INTRO_DOC_TIME_ORIGIN,
  INTRO_DOC_TTFB,
  INTRO_VIDEO_LOAD_DURATION,
  WEB_DOC_LOADED_TS,
  REACT_APP_RENDERED_TS,
] as const;

export const reportAppLaunchTiming = (deviceInfo?: HybDeviceInfo, experiments: Experiment[] = []) => {
  if (!supportsSessionStorage()) return;

  const trackingPathname = getTrackingPathname();
  const timestamps = {
    // APP_LAUNCH_TS and WEBVIEW_START_TS are passed from the native app for cold start only
    [APP_LAUNCH_TS]: deviceInfo?.[APP_LAUNCH_TS],
    [WEBVIEW_START_TS]: deviceInfo?.[WEBVIEW_START_TS],
    // while WEBVIEW_LATEST_START_TS is passed for every webview launch, both cold start and warm start
    [WEBVIEW_LATEST_START_TS]: deviceInfo?.[WEBVIEW_LATEST_START_TS],

    ...timestampKeys.reduce((acc, key) => {
      acc[key] = getData(key);
      return acc;
    }, {} as Record<typeof timestampKeys[number], string | null>),
  };
  const now = new Date();
  const isEnteredFromAnimationPage = timestamps[INTRO_ANIMATION_START_TS];

  // Decide if it is a hybrid app by checking if webview-related timestamps exist,
  // this also filters out older versions which do not pass them.
  const appLaunchDate = convertToDate(Number(timestamps[APP_LAUNCH_TS]));
  const isHybridApp = appLaunchDate && isSameDay(appLaunchDate, now);
  const {
    appDocLoadTime,
    introAnimationDuration,
    introDocLoadTime,
    introPageLoadTime,
    introAnimationPrepareTime,
    introDocDownloadTime,
    introDocTTFB,
    introVideoLoadDuration,
    webviewPrepareTime,
  } = COMPUTED_PERF_METRICS;
  const getDuration = (startMetric: keyof typeof timestamps, endMetric: keyof typeof timestamps) => Math.round(Number(timestamps[endMetric]) - Number(timestamps[startMetric]));
  // WEBVIEW_START_TS is only exists on the webview cold start; WEBVIEW_LATEST_START_TS is exits on the both webview cold start and warm start.
  const WEBVIEW_START_TS_TEMP = timestamps[WEBVIEW_LATEST_START_TS] ? WEBVIEW_LATEST_START_TS : INTRO_DOC_TIME_ORIGIN;
  const metrics = {
    [webviewPrepareTime]: isHybridApp ? getDuration(APP_LAUNCH_TS, WEBVIEW_START_TS) : null,
    [introPageLoadTime]: getDuration(WEBVIEW_START_TS_TEMP, INTRO_PAGE_LOAD_TIME),
    [introAnimationPrepareTime]: getDuration(INTRO_PAGE_LOAD_TIME, INTRO_ANIMATION_START_TS),
    // TODO: delete introDocLoadTime since it could be replaced by introPageLoadTime and introAnimationPrepareTime
    [introDocLoadTime]: getDuration(WEBVIEW_START_TS_TEMP, INTRO_ANIMATION_START_TS),
    [appDocLoadTime]: getDuration(isEnteredFromAnimationPage ? INTRO_ANIMATION_END_TS : INTRO_DOC_TIME_ORIGIN, WEB_DOC_LOADED_TS),
    [introAnimationDuration]: getDuration(INTRO_ANIMATION_START_TS, INTRO_ANIMATION_END_TS),
    [introDocDownloadTime]: Number(timestamps[INTRO_DOC_DOWNLOAD_TIME]),
    [introDocTTFB]: Number(timestamps[INTRO_DOC_TTFB]),
    [introVideoLoadDuration]: Number(timestamps[INTRO_VIDEO_LOAD_DURATION]),
  };

  // Filter out invalid data
  [
    appDocLoadTime,
    introAnimationDuration,
    introAnimationPrepareTime,
    introDocLoadTime,
    introPageLoadTime,
    webviewPrepareTime,
  ].forEach((metricName) => {
    const metric = metrics[metricName];
    if (typeof metric !== 'number' || isNaN(metric) || metric <= 0 || metric > MAX_TIME_METRIC_VALUE) {
      delete metrics[metricName];
    }
  });

  // Combine multiple experiments into one tag, the format would be:
  // `<experimentA>=<valueA>&<experimentB>=<valueB>`
  const expTagString = getExperimentGroupTagValue(experiments);

  const tags = {
    [CUSTOM_TAGS.PAGE]: trackingPathname,
  };
  if (expTagString) {
    tags[CUSTOM_TAGS.EXPERIMENT_GROUP] = expTagString;
  }

  performanceTimingRecords = { ...performanceTimingRecords, ...metrics };

  alwaysResolve(dependencies.apiClient.post('/oz/performance/metrics', { data: { metrics, tags } }));
  sendPerformanceLogging({ ...metrics, ...tags });

  timestampKeys.forEach((key) => removeData(key));
};

export const getTimeOrigin = () => {
  // timing API is deprecated, added as fallback here for Cox and Rogers devices compatibility
  return performance.timeOrigin ?? performance.timing.navigationStart;
};

export const reportAppStartUpTiming = () => {
  if (!supportsSessionStorage() || getData(IS_APP_STARTED_UP)) return;

  const { performance } = window;
  const trackingPathname = getTrackingPathname();

  if (!trackingPathname || !performance) return;

  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    const deepLinkInfoJson = getData(DEEPLINK_TO_PLAYER_INFO);

    if (deepLinkInfoJson) {
      const deepLinkInfo = tryJSONParse(deepLinkInfoJson, null);
      // skip hot deeplink on FireTV
      if (deepLinkInfo && deepLinkInfo.isHotDeeplink) return;
    }
  }

  const metrics = {
    ...performanceTimingRecords,
    [COMPUTED_PERF_METRICS.appStartUpDuration]: Date.now() - getTimeOrigin(),
  };

  sendPerformanceLogging({
    type: COMPUTED_PERF_METRICS.appStartUpDuration,
    page: trackingPathname,
    ...metrics,
  });
  // sent only once in one session
  setData(IS_APP_STARTED_UP, 'true');
};

export const reportWebViewReadyToUseTiming = ({ deviceInfo, rtuEndTime }: { deviceInfo?: HybDeviceInfo, rtuEndTime?: number}) => {
  if (!deviceInfo && !rtuEndTime) return;

  let type;
  let startTS;
  const trackingPathname = getTrackingPathname();
  let metrics;

  if (rtuEndTime) {
    /* istanbul ignore next */
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }
    // rtuIntroPageTime key is set in static/intro_animation_template.html
    let rtuStartTime = Number(getData('rtuIntroPageTime'));
    removeData('rtuIntroPageTime');
    if (isNaN(rtuStartTime) || rtuStartTime === 0) {
      rtuStartTime = getTimeOrigin();
    }

    // if number is really large, do not log, if the different is > 180 seconds do not log
    /* istanbul ignore next */
    if ((rtuEndTime - rtuStartTime) / 1000 > 180) {
      return;
    }

    metrics = {
      [COMPUTED_PERF_METRICS.webviewReadyToUseTime]: rtuEndTime - rtuStartTime,
    };
    type = 'launch';
  }

  if (deviceInfo) {
    if (deviceInfo[APP_LAUNCH_TS]) {
      // cold start
      // We don't care about the RTU time of the onboarding page in the cold start
      if (trackingPathname === '/onboarding') return;
      startTS = deviceInfo[APP_LAUNCH_TS];
      type = 'launch';
    } else if (deviceInfo[APP_RESUME_TS]) {
      // resume from background
      startTS = deviceInfo[APP_RESUME_TS];
      type = 'resume';
    } else if (deviceInfo[WEBVIEW_LATEST_START_TS]) {
      // exit and restart
      startTS = deviceInfo[WEBVIEW_LATEST_START_TS];
      type = 'restart';
    }
    if (!startTS) return;
    metrics = {
      [COMPUTED_PERF_METRICS.webviewReadyToUseTime]: Date.now() - startTS,
    };
  }

  const tags = {
    [CUSTOM_TAGS.PAGE]: trackingPathname,
    [CUSTOM_TAGS.APP_LAUNCH_TYPE]: type,
  };

  // send to Datadog
  alwaysResolve(dependencies.apiClient.post('/oz/performance/metrics', { data: { metrics, tags } }));
  // send client log
  sendPerformanceLogging({ ...metrics, ...tags });
};

export const reportResourceTiming = (tags = {}) => {
  const { performance } = window;
  const trackingPathname = getTrackingPathname();
  if (!trackingPathname || !performance) return;

  let resourcesCollected;
  if (
    typeof performance.getEntriesByType === 'function'
    && performance.getEntriesByType('resource')
  ) {
    resourcesCollected = performance.getEntriesByType('resource');
  }
  if (!resourcesCollected) return;

  const resources = resourcesCollected.filter((resource) => {
    if (!resource || typeof resource !== 'object' || !resource.name) return false;

    const { name } = resource;

    // Only report resources under the same origin.
    // We use different CDN for staging and prod
    // For staging, it is '//md0-staging.tubitv.com'.
    // For production, it is '//md0.tubitv.com'.
    const isSameHost = name.includes(__STAGING__ ? '//md0-staging.tubitv.com' : '//md0.tubitv.com');

    // Only track JS/CSS/images.
    const shouldTrackResource = RESOURCE_TYPES_KEYS.some((typeName) => {
      const { extensions } = RESOURCE_TYPES[typeName];
      const resourceName = name.split('?')[0];
      return extensions.some((extension) => resourceName.endsWith(extension));
    });

    return isSameHost && shouldTrackResource;
  }).map((resource) => {
    const { duration, name } = resource;
    let type;
    RESOURCE_TYPES_KEYS.forEach((typeName) => {
      const { extensions } = RESOURCE_TYPES[typeName];
      extensions.forEach((extension) => {
        if (name.endsWith(extension)) {
          type = typeName;
        }
      });
    });

    const metrics = {
      duration: Math.floor(duration), // in ms
      tags: {
        ...tags,
        [CUSTOM_TAGS.PAGE]: trackingPathname,
        [CUSTOM_TAGS.RESOURCE_TYPE]: type,
      },
    };

    const resourceName = type === 'js' ? (name.match(/dist\/([A-z1-9-]+)/) || []).pop() : null; // Only for JS the name is meaningful.
    if (resourceName) {
      metrics.tags[CUSTOM_TAGS.RESOURCE_NAME] = resourceName;
    }

    return metrics;
  }).filter(Boolean);

  alwaysResolve(dependencies.apiClient.post('/oz/performance/resources', {
    data: { resources },
  }));

  sendPerformanceLogging({
    type: 'resourceDuration',
    resources,
  });

  // not useful, only for testing
  return resources;
};

export const checkIsOTTHome = () => {
  let isOTTHome = false;
  const pathname = parseUrl().pathname;
  if (__ISOTT__ && (pathname === OTT_ROUTES.home || pathname.startsWith('/mode'))) {
    isOTTHome = true;
  }
  return isOTTHome;
};

export const reportImageTiming = () => {
  if (!window.PerformanceObserver) {
    return;
  }
  let resources: ({ duration: number, tags: EventTags })[] = [];
  const trackResources = () => {
    if (!resources.length) {
      return;
    }
    dependencies.apiClient.sendBeacon('/oz/performance/resources', {
      data: { resources },
    });

    sendPerformanceLogging({
      type: 'resourceDuration',
      resources,
    });

    resources = [];
  };
  const debouncedTrackResources = debounce(trackResources, 2000, {
    leading: false,
    trailing: true,
    maxWait: 5000,
  });

  // eslint-disable-next-line compat/compat
  const performanceObserver = new PerformanceObserver((list) => {
    // only want to track Home page
    const isOTTHome = checkIsOTTHome();
    if (!isOTTHome) {
      return;
    }
    list.getEntries()
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'img')
      .forEach(({ duration }) => {
        resources.push({
          duration,
          tags: {
            [CUSTOM_TAGS.PAGE]: OTT_ROUTES.home,
            [CUSTOM_TAGS.RESOURCE_TYPE]: 'observer-image',
          },
        });
      });
    debouncedTrackResources();
  });

  try {
    performanceObserver.observe({ type: 'resource', buffered: true });
  } catch (e) {
    // TODO fix this for at least 2018, 2019, and 2020 Tizen
    logger.error(e, 'unable to start performance observer');
  }
};

export const reportRequestTimings = () => {
  let reqTimings;
  try {
    const reqTimingsArray = getData(REQ_TIMINGS_STORAGE);
    reqTimings = reqTimingsArray ? JSON.parse(reqTimingsArray) : null;
  } catch (error) {
    logger.error({ error, localData: getData(REQ_TIMINGS_STORAGE) }, 'Failed to parse request timings');
  }
  if (!Array.isArray(reqTimings) || reqTimings.length === 0) return;

  removeData(REQ_TIMINGS_STORAGE);

  // avoid sending random request urls
  const requests = reqTimings
    .reduce((acc, { duration, page, url, tags }) => {
      const matchingWhitelistEntry = REQ_WHITELIST_CONFIGS.find(({ regex }) => regex.test(url)); // avoid sending random request urls
      if (!matchingWhitelistEntry) return acc;
      return [...acc, {
        duration,
        tags: {
          [CUSTOM_TAGS.PAGE]: page,
          ...tags,
        },
        url: matchingWhitelistEntry.reportedUrl,
      }];
    }, []);
  if (requests.length === 0) return;

  dependencies.apiClient.sendBeacon('/oz/performance/requests', {
    data: {
      requests,
    },
  });
  sendPerformanceLogging({
    type: 'requestDuration',
    requests,
  });
};
