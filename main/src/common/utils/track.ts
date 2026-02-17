import { parseQueryString } from '@adrise/utils/lib/queryString';
import { secs } from '@adrise/utils/lib/time';
import Analytics from '@tubitv/analytics';
import type { AppEvent, ClientEvent, EventTypes } from '@tubitv/analytics/lib/events';
import dayjs from 'dayjs';
import isEqual from 'lodash/isEqual';
import { v4 } from 'uuid';

import type { PlayerAnalyticsEventParams } from 'client/features/playback/track/analytics-ingestion-v3';
import { setCookie, removeCookie, getCookie, getLocalData } from 'client/utils/localDataStorage';
import { QA_PROXY_COOKIE } from 'common/constants/cookies';
import type { APPBOY_ADD_BOOKMARK, APPBOY_START_VIDEO } from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import WebAnalyticsAnonymousToken from 'common/experiments/config/webAnalyticsAnonymousToken';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { ReferredCtx } from 'common/utils/analytics';
import { getPlatform } from 'common/utils/platform';
import { syncAnonymousTokensClient } from 'common/utils/token';
import { COOKIE_DEVICE_ID } from 'src/common/constants/constants';
import config from 'src/config';

import { isUserNotCoppaCompliant } from './ageGate';
import { checkIfBlockedAnalyticsEvent, checkIsClientEnabledByThrottle } from './remoteConfig';
import { getOnboardingStepNumber, isOTTOnboardingUrl } from './urlPredicates';

export const QA_PROXY_ANALYTICS_ENDPOINT = 'qa-proxy.staging-public.tubi.io/analytics-ingestion/v2/single-event';
export const QA_PROXY_URL_PARAM_NAME = 'qaAnalyticsProxy';

export type DatascienceTrackParams = {
  type: string,
  subtype: string,
  message: string,
  version: string,
  platform: string,
  app_id?: string,
  user_id?: number,
  video_id?: string,
  level?: string,
  ip?: string,
  ua?: string,
  id?: string,
  device_id?: string,
};

interface BaseTrackParams {
  [key: string]: any;
  message: string | Record<string, unknown>;
  subtype: string;
}

interface TrackParamsForDebug extends BaseTrackParams {
  [key: string]: any;
  level: 'debug';
  type: 'API:DEBUG' | 'CLIENT:DEBUG' | 'VIDEO:DEBUG' | 'AD:DEBUG';
}

interface TrackParamsForInfo extends BaseTrackParams {
  [key: string]: any;
  level?: 'info';
  type: 'API:INFO' | 'CLIENT:INFO' | 'VIDEO:INFO' | 'AD:INFO';
}

interface TrackParamsForWarn extends BaseTrackParams {
  [key: string]: any;
  level: 'warn';
  type: 'API:SLOW' | 'API:TIMEOUT' | 'CLIENT:MEMORY' | 'CLIENT:CPU' | 'CLIENT:DISK' | 'AD:TIMEOUT' | 'AD:BAD_RESPONSE';
}

interface TrackParamsForError extends BaseTrackParams {
  [key: string]: any;
  level: 'error';
  type: 'API:ERROR' | 'API:BAD_RESPONSE' | 'VIDEO:PLAYBACK' | 'VIDEO:LOAD' | 'VIDEO:BUFFER' | 'AD:ERROR';
}

export type TrackParams =
  | TrackParamsForDebug
  | TrackParamsForInfo
  | TrackParamsForWarn
  | TrackParamsForError
  | {
      level?: 'debug' | 'info' | 'warn' | 'error';
      type: string;
      subtype: string;
      message: unknown;
    };

type AppboyEvent = typeof APPBOY_ADD_BOOKMARK | typeof APPBOY_START_VIDEO;

export interface ReferredQueryParams {
  [key: string]: any;
  utm_source?: string | string[];
  utm_medium?: string | string[];
  utm_campaign?: string | string[];
  utm_term?: string;
  utm_content?: string;
}

type GetReferredExtraCtx = (referredQueryParams?: ReferredQueryParams) => ReferredCtx | boolean;

let _apiClient: InstanceType<typeof ApiClient>;
export const dependencies = {
  get apiClient(): InstanceType<typeof ApiClient> {
    // need to make this lazy so the function is available by the time the function is actually executed
    /* istanbul ignore next */
    if (!_apiClient) _apiClient = ApiClient.create();
    return _apiClient;
  },
};

export const isQaAnalyticsProxy = () => {
  if (FeatureSwitchManager.isEnabled('QaAnalyticsProxy')) {
    return true;
  }
  if (typeof window !== 'undefined') {
    const params = parseQueryString(window.location.search);
    if (params[QA_PROXY_URL_PARAM_NAME] === 'off') {
      removeCookie(QA_PROXY_COOKIE);
      return false;
    }
    if (params[QA_PROXY_URL_PARAM_NAME] || getCookie(QA_PROXY_COOKIE)) {
      setCookie(QA_PROXY_COOKIE, 'true', 0);
      return true;
    }
  }
  return false;
};

export const getAnalyticsEndpoint = (useTokenEndpoint?: boolean, usePurpleCarpetEndPoint = false) => {
  if (usePurpleCarpetEndPoint) {
    return config.purpleCarpetAnalyticsEndpoint;
  }
  let analyticsEndpoint = useTokenEndpoint ? config.analyticsTokenEndpoint : config.analyticsEndpoint;
  if (__STAGING__ || __DEVELOPMENT__ || __IS_ALPHA_ENV__) {
    if (isQaAnalyticsProxy()) {
      const protocol = analyticsEndpoint.startsWith('http:') ? 'http://' : 'https://';
      analyticsEndpoint = `${protocol}${QA_PROXY_ANALYTICS_ENDPOINT}`;
    }
  }
  return analyticsEndpoint;
};

const debugLog = (...args: any[]): void => {
  // eslint-disable-next-line no-console
  console.log('LogAnalyticsAndTracking', ...args);
};

// sendEvent is only to be used inside of trackEvent, do not import and call this directly
async function sendEvent(
  data: Record<string, unknown>,
  params: Record<string, unknown>,
  purpleCarpet: boolean,
): Promise<void> {
  let useTokenEndpoint = false;
  try {
    useTokenEndpoint = WebAnalyticsAnonymousToken().getValue();
  } catch (err) {
    logger.error(err, 'Error using WebAnalyticsAnonymousToken experiment');
  }
  try {
    if (useTokenEndpoint) {
      await syncAnonymousTokensClient();
    }
    dependencies.apiClient.sendBeacon(getAnalyticsEndpoint(useTokenEndpoint, purpleCarpet), {
      data,
      params,
    });
  } catch (err) {
    logger.error({ err, data, params, useTokenEndpoint }, 'Error in trackEvent');
  }
}

/**
 * @returns `false` means the event did not be sent
 */
export function trackEvent(
  eventName: EventTypes,
  eventValue: AppEvent | null | undefined,
  purpleCarpet = false
): boolean {
  /**
   * /search page with keyword on web invokes
   * this method on server render. We should prevent that
   * from happening.
   */
  if (__SERVER__) return false;

  // Don't send the event if eventValue is null/undefined
  if (eventValue == null) return false;

  if (checkIfBlockedAnalyticsEvent(eventName)) return false;

  // Block Analytics Events based on consent(GDPR country)
  if (!OnetrustClient.canSendAnalyticsEvents(eventName)) {
    return false;
  }

  const baseData = Analytics.getBaseEventBody();
  const eventBody: Partial<AppEvent> = {
    [eventName]: eventValue,
  };
  const eventData: ClientEvent = {
    ...baseData,
    event: eventBody as AppEvent,
  };
  const params: {eventName?: string} = {};

  // You can type the key event name to filter the network request in Chrome devtool via FeatureSwitchManager
  if (FeatureSwitchManager.get('LogAnalyticsAndTracking') === 'AddQueryParam') {
    params.eventName = eventName;
  } else if (FeatureSwitchManager.get('LogAnalyticsAndTracking') === 'LogToConsole') {
    debugLog(`[eventName: ${eventName}]`, eventData);
  }

  sendEvent(eventData, params, purpleCarpet);
  return true;
}

let lastValue: { value: TrackParams, timestamp: number } | undefined;

// Using dependency-injection style to allow testing to supply a mock ApiClient easily. Normal use should not include
// the second parameter, it will just reuse the same apiClient instance.
export function trackLogging(
  params: {
    level?: 'error' | 'debug' | 'info' | 'warn';
    type: string;
    subtype: string;
    message: unknown;
  }
): void {
  const enabledClientLogInRemote = checkIsClientEnabledByThrottle(Math.random());
  const enableClientLog =
    FeatureSwitchManager.isEnabled(['Logging', 'ClientLog']) ||
    (!FeatureSwitchManager.isDisabled(['Logging', 'ClientLog']) &&
      OnetrustClient.canSendClientLog() &&
      enabledClientLogInRemote);
  if (!enableClientLog) return;
  // On the server, don't do any limiting, as it is hard to envision any scenario where we would do so.
  if (!__SERVER__) {
    const oldLastValue = lastValue;
    const timestamp = Date.now();
    lastValue = { value: params, timestamp };
    if (oldLastValue) {
      // On the client, only log events that are the same as the previous one if they are 30 seconds apart.
      // This should help prevent exceeding the rate limit on the logging API.
      const isSame = isEqual(params, oldLastValue.value);
      const isWithinTimespan = timestamp - oldLastValue.timestamp <= secs(30);
      if (isSame && isWithinTimespan) {
        return;
      }
    }
  }
  const baseData = Analytics.getBaseEventBody();
  const data: DatascienceTrackParams = {
    ...params,
    message: JSON.stringify(params.message),
    device_id: baseData.device?.device_id || getCookie(COOKIE_DEVICE_ID) || getLocalData(COOKIE_DEVICE_ID),
    user_id: parseInt(baseData.user?.user_id, 10) || 0,
    platform: getPlatform(),
    version: __RELEASE_HASH__,
  };
  const trackParams: Partial<TrackParams> = {};
  if (FeatureSwitchManager.get('LogAnalyticsAndTracking') === 'AddQueryParam') {
    trackParams.subtype = params.subtype;
  } else if (FeatureSwitchManager.get('LogAnalyticsAndTracking') === 'LogToConsole') {
    debugLog(`[subtype: ${params.subtype}]`, data);
  }
  dependencies.apiClient.sendBeacon(`${config.datasciencePrefix}/logging`, {
    data,
    params: trackParams,
  });
}

export function trackAnalyticsIngestionV3<S extends string>(
  params: {
    name: string;
    message: S extends keyof PlayerAnalyticsEventParams ? PlayerAnalyticsEventParams[S] : Record<string, unknown>;
  }
): void {
  const enabledPlayerAnalyticsEventInRemote = checkIsClientEnabledByThrottle(Math.random(), 'player_analytics_event_enabled');
  const enablePlayerAnalyticsEventLog = FeatureSwitchManager.isEnabled(['Logging', 'PlayerAnalyticsEvent'])
    || (!FeatureSwitchManager.isDisabled(['Logging', 'PlayerAnalyticsEvent']) && __SHOULD_ENABLE_PLAYER_ANALYTICS_EVENT_LOG__ && enabledPlayerAnalyticsEventInRemote && OnetrustClient.canSendAnalyticsIngestionV3());
  if (!enablePlayerAnalyticsEventLog) return;
  const baseData = Analytics.getBaseEventBody();
  const data = {
    event_name: params.name,
    event_payloads: [
      JSON.stringify({
        client_common: {
          event_id: v4(),
          event_timestamp: dayjs().format(),
        },
        device_id: baseData.device?.device_id || getCookie(COOKIE_DEVICE_ID) || getLocalData(COOKIE_DEVICE_ID),
        platform: getPlatform(),
        version: __RELEASE_HASH__,
        ...params.message,
      }),
    ],
  };
  dependencies.apiClient.sendBeacon(`${config.analyticsIngestionV3Prefix}`, {
    data,
  });
}

export function trackAppboyEvent(type: AppboyEvent): void {
  const { braze } = global;
  if (braze && !isUserNotCoppaCompliant()) {
    braze.logCustomEvent(type);
  }
}

/**
 * We use the Set for recording the showing of onboarding pages, to avoid from sending the page_load and navigate_to_page events repeatedly.
 * We'll optimize (probably remove) this by updating routes after we graduate the experiment. See more about the current logic:
 * https://app.shortcut.com/tubi/story/744108/ftv-single-screen-onboarding-1-variant#activity-762831
 */
const sentOnboardingPageLoadEvents = new Set<number>();

interface TrackEventOption {
  isOTTFireTVSingleScreenOnboardingEnabled?: boolean;
}

/**
 * check whether to track navigate_to_page event
 * @param currentPathname
 * @param nextPathname
 * @returns {boolean}
 */
export function shouldTrackNavigateToPage(
  currentPathname: string,
  nextPathname: string,
  option?: TrackEventOption,
): boolean {
  // empty current url
  if (!currentPathname) return false;

  // pathname no change
  if (currentPathname === nextPathname) return false;

  // from search page to search page
  if (currentPathname.indexOf(WEB_ROUTES.search) === 0 && nextPathname.indexOf(WEB_ROUTES.search) === 0) return false;

  // we record only the first cycle on the onboarding pages.
  if (option?.isOTTFireTVSingleScreenOnboardingEnabled && isOTTOnboardingUrl(currentPathname)) {
    if (isOTTOnboardingUrl(nextPathname)) {
      const currentStep = getOnboardingStepNumber(currentPathname);
      if (sentOnboardingPageLoadEvents.has(currentStep)) {
        return false;
      }
      sentOnboardingPageLoadEvents.add(currentStep);
    } else {
      sentOnboardingPageLoadEvents.clear();
    }
  }

  return true;
}

export const shouldTrackPageLoad = (currentPathname: string, option?: TrackEventOption) => {
  // we record only the first cycle on the onboarding pages.
  // The navigateToPage event is after the pageLoad event，
  // so we only read the set state on pageLoad event,
  // and the set will be updated with navigateToPage event.
  if (
    option?.isOTTFireTVSingleScreenOnboardingEnabled
    && isOTTOnboardingUrl(currentPathname)
    && sentOnboardingPageLoadEvents.has(getOnboardingStepNumber(currentPathname))
  ) {
    return false;
  }
  return true;
};

/**
 * Convert object to string for referred events.
 * Caution! Implementation is incomplete, but sufficient for use in referred events.
 * Do not use for other purposes in its current form.
 * Eg:
 * ['test', 'test1'] => "test, test1"
 * { 1: 'test', 2: test2 } => "{"1":"test","2":"test2"}"
 */
const convertToString = (obj: Record<string, unknown> | unknown[]) => {
  // If obj is an array, then use toString
  if (Array.isArray(obj)) return obj.toString();

  // If obj is any other type (string etc), then just return the object
  return obj;
};

export const getReferredExtraCtxFromQuery: GetReferredExtraCtx = (queryParams = {}) => {
  if (!queryParams.utm_source && !queryParams.utm_medium && !queryParams.utm_campaign) {
    return false;
  }

  const extraCtx = ['campaign', 'source', 'medium', 'content', 'term'].reduce((result: ReferredCtx, key: string) => {
    const value = convertToString(queryParams[`utm_${key}`]);
    if (value) {
      result[key] = value;
    }
    return result;
  }, {} as ReferredCtx);

  const brazeId = queryParams.braze_external_id;
  if (brazeId) {
    extraCtx.braze_id = brazeId;
  }

  return extraCtx;
};

export const getHostnameFromUrl = (url: string = '') => {
  if (window.URL) {
    try {
      const { hostname } = new URL(url);
      return hostname;
    } catch (e) {
      return '';
    }
  }

  const match = url.toLowerCase().match(/^https?:\/\/([^/:?#]*).*$/);
  return match ? match[1] : '';
};

export const getReferredExtraCtxFromDocument: GetReferredExtraCtx = (queryParams = {}) => {
  if (__SERVER__) {
    return false;
  }

  if (queryParams.utm_source) {
    return false;
  }

  const hostname = getHostnameFromUrl(document.referrer);
  let source = /google|bing|yahoo|twitter|facebook|instagram|tiktok/.exec(hostname)?.[0];

  if (['t.co', 'x.com'].includes(hostname)) {
    source = 'twitter';
  }

  if (source) {
    return {
      source,
      medium: 'seo',
    } as ReferredCtx;
  }

  return false;
};

/**
 * convert url to format defined in [URI Scheme](https://tubitv.atlassian.net/wiki/display/EC/URI+Scheme)
 * @param url
 * @example convert `/category/1611/featured` to `category/1611`
 * @returns {string}
 */
const contentURIParseFn = (url: string): string => {
  const fields = url.substr(1).split('/').slice(0, 2);
  return `/${fields.join('/')}`;
};

interface MapEntry {
  test: RegExp;
  cb: ((url: string) => string) | string;
}

type UriMap = MapEntry[];

const URI_MAP: UriMap = [
  {
    test: /^\/video|series\/[^/]+/,
    cb: contentURIParseFn,
  },
  {
    test: /^\/category|channels\/[^/]+/,
    cb: (url) => {
      // containerUrl: /category/whats_on_tubi_trailers
      // subContainerUrl: /category/international/s/korean_dramas
      const fields = url.substr(1).split('/');
      if (url.indexOf('/s/') > 0) {
        const parentSlug = fields[1];
        const subContainerSlug = fields[3];
        return `/category/${parentSlug}/${subContainerSlug}`;
      }
      const containerId = fields[1];
      return `/category/${containerId}`;
    },
  },
  // embedded video
  {
    test: /^\/embedded\/[^/]+/,
    cb: (url) => {
      const fields = url.substr(1).split('/');
      return `/embedded/video/${fields[2]}`;
    },
  },
  // need to add /home/cat/:containerSlug
  { test: /^\/$/, cb: '/landing' },
  { test: /^\/search\/[^/]+/, cb: '/search' },
  { test: /^\/activate$/, cb: '/deviceregistration' },
  { test: /\/home/, cb: '/home' },
  { test: /\/login/, cb: '/auth/signin' },
  { test: /\/signup/, cb: '/auth/register' }, // TODO REMOVE THIS WHEN DONE WITH BELOW
  // { test: /\/sign-in/, cb: '/auth/signin' }, // TODO enable these when refactored signup ~> register and login ~> sign-in
  // { test: /\/register/, cb: '/auth/register' },
  {
    test: /^\/tv-shows|movies/,
    cb: (url) => {
      const videoId = url.split('/')[2]; // '/movies/305419/asylum' ~> '305419'
      return `/video/${videoId}`; // '/video/305419'
    },
  },
];

const URI_MAP_OTT: UriMap = [
  {
    test: /^\/video|series\/[^/]+/,
    cb: contentURIParseFn,
  },
  { test: /\/activate/, cb: '/login-choice/code' },
  { test: /^\/$/, cb: '/home' },
  {
    test: /\/ott\/category/,
    cb: (url): string => {
      // containerUrl: /ott/category/whats_on_tubi_trailers
      // subContainerUrl: /ott/category/international/s/korean_dramas
      const fields = url.substr(1).split('/');
      if (url.indexOf('/s/') > 0) {
        const parentSlug = fields[2];
        const subContainerSlug = fields[4];
        return `/${fields[1]}/${parentSlug}/${subContainerSlug}`;
      }
      return `/${fields[1]}/${fields[2]}`;
    },
  },
  {
    test: /^\/ott\/player\/[^/]+/,
    cb: (url): string => {
      // /ott/player/333000
      // /ott/player/333000/trailer/0
      const fields = url.substr(1).split('/');
      if (fields[3] === 'trailer') {
        return `/video/${fields[2]}/trailer/${fields[4]}`;
      }
      return `/video/${fields[2]}/play`;
    },
  },
  {
    test: /^\/ott\/androidplayer\/[^/]+/,
    cb: (url): string => {
      // /ott/androidplayer/333000/10
      const fields = url.substr(1).split('/');
      return `/video/${fields[2]}/play`;
    },
  },
  {
    test: /^\/containers\/(regular|channel)/,
    cb: (url): string => {
      // /containers/regular => /containers/categories
      // /containers/channel => /containers/channels
      const fields = url.substr(1).split('/');
      const containerType = fields[1];
      return `/containers/${containerType === 'channel' ? 'channels' : 'categories'}`;
    },
  },
  {
    test: /^\/container\/(regular|channel)\/[^/]+/,
    cb: (url): string => {
      // /container/regular/action => /container/categories/action
      // /container/channel/babyfirst => /container/channels/babyfirst
      const fields = url.substr(1).split('/');
      const containerType = fields[1];
      const containerId = fields[2];
      return `/container/${containerType === 'channel' ? 'channels' : 'categories'}/${containerId}`;
    },
  },
];

/**
 * convert url to URI required by track event
 * see https://tubitv.atlassian.net/wiki/display/EC/URI+Scheme
 * @param url
 */
export const getTrackingURI = (url: string): string => {
  const TRACK_URI_MAP = __ISOTT__ ? URI_MAP_OTT : URI_MAP;
  for (const val of TRACK_URI_MAP) {
    if (val.test.test(url)) {
      const cb = val.cb;
      if (typeof cb === 'string') {
        return cb;
      }

      return cb(url);
    }
  }

  return url;
};

/**
 * add utm_campaign and utm_source
 * @param url
 * @param socialPlatform
 * @returns String
 */
export const addUtmParams = (url: string, socialPlatform?: 'facebook' | 'twitter'): string => {
  if (!url) return url; // avoid needless errors
  const hasQuery = url.indexOf('?') !== -1;

  // source will default to 'web-social', or optionally 'web-social-facebook' / 'web-social-twitter' etc
  const sourceValue = `web-social${socialPlatform ? `-${socialPlatform}` : ''}`;
  const paramsToAdd = `utm_campaign=web-sharing&utm_source=${sourceValue}`;

  return `${url}${hasQuery ? '&' : '?'}${paramsToAdd}`;
};
