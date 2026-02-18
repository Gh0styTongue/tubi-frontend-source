import { buildQueryString } from '@adrise/utils/lib/queryString';
import { isEmptyObject } from '@adrise/utils/lib/size';
import { now } from '@adrise/utils/lib/time';
import type express from 'express';
import type FormData from 'form-data';
import throttle from 'lodash/throttle';
import qs from 'qs';
import type { Request } from 'superagent';
import superagent from 'superagent';

import { getData, setData, supportsSessionStorage } from 'client/utils/sessionDataStorage';
import {
  IS_SENDBEACON_ON,
  REQ_TIMINGS_STORAGE,
  X_CLIENT_PATH,
  CUSTOM_EVENT_NAME,
  CUSTOM_EVENT_TYPES,
  TUBI_FAILSAFE_TWO_DIGIT_COUNTRY_HEADER,
} from 'common/constants/constants';
import type { AuthError } from 'common/features/authentication/types/auth';
import { isUserNotFound, isLoginRequired } from 'common/features/authentication/utils/user';
// TODO: Consider lazy loading this function because this file is used in a lot of places but the `formatError` function
//  is only used very infrequently.
import { CLIENT_ERROR_CONFIG_PRODUCTION, CLIENT_ERROR_CONFIG_STAGING } from 'common/helpers/apiClient/constants';
import { defaultClientErrorConfig } from 'common/helpers/apiClient/defaultClientErrorConfig';
import {
  getHttpMethod,
  getRetryDelay,
  getRetryStrategy,
  isLegalRetryStrategy,
} from 'common/helpers/apiClient/utils';
import { formatError } from 'common/utils/log';
import { isEndpointDisabled } from 'common/utils/remoteConfig';
import { getPageNameForTracking } from 'common/utils/routePath';
import type { TokenResponse } from 'common/utils/token';
import {
  ANONYMOUS_ACCESS_TOKEN,
  ANONYMOUS_TOKEN_CLIENT_HEADER_NAME,
  getAnonymousTokenExpiresFromStorage,
  getAnonymousTokenFromCookie,
  getAnonymousTokenFromMemory,
  getAnonymousTokenFromStorage,
  SERVER_ANONYMOUS_ACCESS_TOKEN,
  SHOULD_SEND_ANONYMOUS_TOKEN_IN_HEADER,
  syncAnonymousTokenOnServer,
  syncAnonymousTokensClient,
} from 'common/utils/token';
import { trackLogging } from 'common/utils/track';
import { determineCountryFromRequest } from 'i18n/utils';
import config from 'src/config';
import TestApiClient from 'test/lib/TestApiClient';

import logger from './logging';

export type ApiClientMethods = keyof Omit<ApiClient, 'getInstanceValue'>;

export interface ApiClientMethodOptions {
  [key: string]: any;
  deviceId?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string | number | undefined | string[]>;
  data?: Record<string, unknown> | FormData;
  userIP?: string;
  timeout?: number;
  deadline?: number;
  ip?: string;
  get?: (val: string) => string | void;
  useAnonymousToken?: boolean;
  reportError?: boolean;
  retryCallback?: (error: AuthError) => void;
  shouldTrackDuration?: boolean;
  trackDurationTags?: Record<string, string>;
  shouldSetAuthorizationHeader?: boolean;
  qsStringifyOptions?: qs.IStringifyOptions;
  returnText?: boolean;
}

export const formatUrl = (url: string) => {
  /* for internal requests, add host and port */
  if (__SERVER__ && url.indexOf('http') !== 0) {
    return `http://${config.host}:${config.port}${url}`;
  }

  // samsung tv uses file protocol, it requires full url
  if (__CLIENT__ && __OTTPLATFORM__ === 'TIZEN' && url.indexOf('http') !== 0) {
    const protocol = __DEVELOPMENT__ ? 'http' : 'https';
    return `${protocol}://${config.fqdn}${url}`;
  }

  return url;
};

interface StoreReqDurationParams {
  reqStartTS: number;
  reqEndTS: number;
  reqUrl: string;
  tags: Record<string, unknown>;
}

let unloading: boolean = false;

/**
 * This also runs on server.
 * Only run when we have a window.
 */
/* istanbul ignore else */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unloading = true;
  });
}

export const storeReqDuration = ({ reqStartTS, reqEndTS, reqUrl, tags }: StoreReqDurationParams) => {
  if (!__CLIENT__ || !supportsSessionStorage() || !reqStartTS || !reqUrl) return;

  // get previous timings, attach the current one and store it
  let timings;
  try {
    const timingsArray = getData(REQ_TIMINGS_STORAGE);
    timings = timingsArray ? JSON.parse(timingsArray) : null;
  } catch (error) {
    // istanbul ignore next
    logger.error({ error, localData: getData(REQ_TIMINGS_STORAGE) }, ' Failed to parse request timings');
  }

  // use empty if no previous data
  if (!Array.isArray(timings)) {
    timings = [];
  }

  timings.push({
    duration: Number((reqEndTS - reqStartTS).toFixed(0)),
    page: getPageNameForTracking(location.pathname) || 'unknown',
    url: reqUrl,
    tags,
  });
  setData(REQ_TIMINGS_STORAGE, JSON.stringify(timings));
};

export const setHeadersFields = ({
  anonymousToken,
  fullUrl,
  ip,
  srcReq,
  desReq,
  shouldSetAuthorizationHeader,
}: {
  anonymousToken?: string;
  fullUrl: string;
  ip?: string;
  srcReq?: express.Request;
  desReq: Request;
  shouldSetAuthorizationHeader?: boolean;
}) => {
  if (srcReq && fullUrl.indexOf(config.host) !== -1) {
    // forward headers
    const HEADERS_TO_FORWARD = __WEBPLATFORM__ === 'WEB' ? ['cookie', 'Referer', 'user-agent'] : ['cookie', 'Referer'];
    HEADERS_TO_FORWARD.forEach((field) => {
      if (srcReq.get && typeof srcReq.get(field) === 'string') {
        desReq.set(field, srcReq.get(field) as string);
      }
    });

    // forward all `x-` headers
    Object.keys(srcReq.headers ?? {}).forEach((field) => {
      // istanbul ignore else
      if (field.startsWith('x-') && srcReq.get && typeof srcReq.get(field) === 'string') {
        desReq.set(field, srcReq.get(field) as string);
      }
    });

    // attached deviceId to headers, see deviceid middleware for more info
    if (srcReq.deviceId) desReq.set('deviceid', srcReq.deviceId);
    if (srcReq.firstSeen) desReq.set('firstseen', srcReq.firstSeen);
    // attach req.url to headers for tracking requests sent during ssr
    if (srcReq.url) desReq.set(X_CLIENT_PATH, srcReq.url);
  }

  if (ip) {
    desReq.set('x-forwarded-for', ip);
  }

  if (shouldSetAuthorizationHeader) { // manually set Authorization header
    const token = anonymousToken || srcReq?.cookies[ANONYMOUS_ACCESS_TOKEN];
    if (token) {
      desReq.set('Authorization', `Bearer ${token}`);
    }
  } else if (anonymousToken) { // set token header for node proxy server
    desReq.set(SERVER_ANONYMOUS_ACCESS_TOKEN, anonymousToken);
  }

  if (__SERVER__ && srcReq) {
    desReq.set(TUBI_FAILSAFE_TWO_DIGIT_COUNTRY_HEADER, determineCountryFromRequest(srcReq));
  }
};

type CustomEventData = Record<string, unknown>;

// APIs are normally called in batches in proxy.ts, which means multiple custom errors (such as
// the "USER_NOT_FOUND" error) may be raised within a short time period. To handle the error more
// efficiently, it’s better to throttle the event dispatching and process the error only once.
const dispatchCustomEvent = (type: string, data: CustomEventData = {}) =>
  throttle(
    () => {
      window.dispatchEvent(
        new CustomEvent(CUSTOM_EVENT_NAME, {
          detail: {
            ...data,
            type,
          },
        })
      );
    },
    200,
    {
      leading: true,
      trailing: false,
    }
  );

const dispatchUserNotFoundEvent = dispatchCustomEvent(CUSTOM_EVENT_TYPES.USER_NOT_FOUND);
const dispatchLoginRequiredEvent = (data: CustomEventData) =>
  dispatchCustomEvent(CUSTOM_EVENT_TYPES.LOGIN_REQUIRED, data)();

class ApiClient {
  static create(req?: express.Request): ApiClient {
    if (__TESTING__ && !__IS_E2E_TEST__) {
      return new TestApiClient();
    }
    return new ApiClient(req);
  }

  private static clientErrorConfig = defaultClientErrorConfig;

  private static loadRemoteClientErrorConfigPromise?: Promise<void>;

  constructor(private req?: express.Request) {
    if (!ApiClient.loadRemoteClientErrorConfigPromise && !__TESTING__) {
      ApiClient.loadRemoteClientErrorConfigPromise = this.get(
        __PRODUCTION__ ? CLIENT_ERROR_CONFIG_PRODUCTION : CLIENT_ERROR_CONFIG_STAGING
      )
        .then(conf => {
          ApiClient.clientErrorConfig = conf;
        })
        .catch(error => {
          logger.error({ error }, 'Failed to fetch client error config');
        });
    }
  }

  private static async tryToGetAnonymousToken(req: express.Request): Promise<string | undefined> {
    if (__CLIENT__) {
      await syncAnonymousTokensClient();
      // TEMPORARY LOGGING FOR ANONYMOUS TOKEN
      // TODO @cbengtson to remove
      // istanbul ignore if
      if (!getAnonymousTokenFromMemory()) {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_ApiClient_Sync',
          message: {
            errorMessage: 'SYNC EMPTY TOKEN',
            getAnonymousTokenFromCookie: !!getAnonymousTokenFromCookie(),
            getAnonymousTokenFromMemory: !!getAnonymousTokenFromMemory(),
            accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
          },
        });
      }
    } else if (__SERVER__) {
      const response = (await syncAnonymousTokenOnServer(req)) as TokenResponse;
      if (response) {
        return response.access_token;
      }
    }
  }

  get(url: string, options?: ApiClientMethodOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstanceValue('get', url, options)(resolve, reject, !!options?.useAnonymousToken);
    });
  }

  post(url: string, options?: ApiClientMethodOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstanceValue('post', url, options)(resolve, reject, !!options?.useAnonymousToken);
    });
  }

  put(url: string, options?: ApiClientMethodOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstanceValue('put', url, options)(resolve, reject, !!options?.useAnonymousToken);
    });
  }

  patch(url: string, options?: ApiClientMethodOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstanceValue('patch', url, options)(resolve, reject, !!options?.useAnonymousToken);
    });
  }

  del(url: string, options?: ApiClientMethodOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getInstanceValue('del', url, options)(resolve, reject, !!options?.useAnonymousToken);
    });
  }

  // Notice: sendBeacon will fail on some user agents while sending large data
  // https://stackoverflow.com/questions/28989640/navigator-sendbeacon-data-size-limits
  sendBeacon(url: string, sendBeaconConfig?: ApiClientMethodOptions) {
    const { params, data, reportError } = sendBeaconConfig || {};
    const errorMsg = 'Fail to run window.navigator.sendBeacon';

    if (isEndpointDisabled(url)) {
      return;
    }

    if (__CLIENT__ && IS_SENDBEACON_ON) {
      const hasSendBeacon = !!(window.navigator && window.navigator.sendBeacon);
      const isHttps = url?.startsWith('https:') || (!url?.startsWith('http:') && window.location.protocol === 'https:'); // sendBeacon only supports HTTPS

      if (hasSendBeacon && isHttps) {
        const sendBeaconParams = { sendBeacon: true, ...(params || {}) };
        const sendSuccessfully = window.navigator.sendBeacon(
          `${url}${buildQueryString(sendBeaconParams)}`,
          JSON.stringify(data)
        );
        if (sendSuccessfully) {
          return;
        }
        if (reportError) {
          logger.error({ data, url, error: new Error(errorMsg) }, errorMsg);
        }
      }
    }

    // if the function hasn't returned, means we'll use POST instead
    this.post(url, sendBeaconConfig).catch((err) => {
      if (isIncompleteRequestError(err)) return;
      if (reportError) {
        logger.error({ data, url, error: err }, `${errorMsg} (POST)`);
      }
    });
  }

  getInstanceValue(method: 'get' | 'put' | 'post' | 'patch' | 'del', url: string, options: ApiClientMethodOptions = {}) {
    const {
      params,
      qsStringifyOptions,
      data,
      userIP,
      timeout = __DEVELOPMENT__ ? 20000 : 15000,
      deadline = 20000,
      headers = {},
      shouldTrackDuration,
      trackDurationTags = {},
      useAnonymousToken,
      shouldSetAuthorizationHeader,
      retryCallback,
      returnText = false,
    } = options;

    if (isEndpointDisabled(url, method)) {
      return (resolve: (value: unknown) => void) => {
        resolve(undefined);
        return { abort: () => void 0 };
      };
    }

    if (deadline && timeout && deadline < timeout) {
      throw new Error('timeout value must be less than or equal to deadline value');
    }

    const fullUrl = formatUrl(url);
    let hostname = '';
    let pathname = '';
    try {
      // new URL() will throw an error if the URL is invalid
      const url = new URL(fullUrl);
      hostname = url.hostname;
      pathname = url.pathname;
    } catch (err) {
      // nothing to do
    }

    const methodName = getHttpMethod(method);

    let retriedTimes = 0;

    const sendRequestDetails = (
      resolve: (body: unknown) => void,
      reject: (err: Error | object) => void,
      needsAnonymousToken: boolean
    ) => {
      let currentTimeout: ReturnType<typeof setTimeout> | undefined;
      let currentRequest: ReturnType<typeof makeOneRequest> | undefined;

      const makeRequest = async () => {
        let anonToken: string | undefined;

        if (needsAnonymousToken) {
          anonToken = await ApiClient.tryToGetAnonymousToken(this.req as express.Request);
        }

        currentRequest = makeOneRequest(
          (body) => {
            currentRequest = undefined;
            resolve(body);
          },

          (err) => {
            currentRequest = undefined;
            const retryStrategy = getRetryStrategy({
              hostname,
              pathname,
              method: methodName,
              status: (err as AuthError).status,
              clientErrorConfig: ApiClient.clientErrorConfig,
              responseCode: String((err as AuthError).code)?.toLowerCase(),
            });
            if (retryStrategy) {
              const {
                // error_actions, // we don't handle these during the game
                max_retries,
              } = retryStrategy;
              const shouldRetry = retriedTimes < max_retries && isLegalRetryStrategy(retryStrategy);
              if (shouldRetry) {
                const delay = getRetryDelay(retryStrategy, ++retriedTimes);
                retryCallback?.(err as AuthError);
                currentTimeout = setTimeout(() => {
                  makeRequest();
                }, delay);
                return;
              }
            }
            reject(err);
          },

          anonToken
        );
      };

      makeRequest();

      return {
        abort: () => {
          clearTimeout(currentTimeout);
          currentRequest?.abort();
        },
      };
    };

    const makeOneRequest = (
      resolve: (body: unknown) => void,
      reject: (err: Error | object) => void,
      anonymousToken?: string
    ) => {
      const fullUrl = formatUrl(url);
      const request = superagent[method](fullUrl);
      const ip = userIP || (this.req && this.req.ip);
      let reqStartTS: number | undefined;

      if (__SERVER__) {
        setHeadersFields({
          anonymousToken,
          desReq: request,
          fullUrl,
          ip,
          srcReq: this.req,
          shouldSetAuthorizationHeader,
        });
      }

      if (__CLIENT__ && shouldTrackDuration) {
        reqStartTS = now();
      }

      /* istanbul ignore next */
      if (params) {
        request.query(
          qsStringifyOptions
            ? qs.stringify(params, qsStringifyOptions)
            : params
        );
      }

      if (useAnonymousToken && __CLIENT__) {
        const token = getAnonymousTokenFromStorage();
        // istanbul ignore else
        if (token) {
          // istanbul ignore else
          if (shouldSetAuthorizationHeader) {
            request.set('Authorization', `Bearer ${token}`);
          } else if (!getAnonymousTokenFromCookie() || SHOULD_SEND_ANONYMOUS_TOKEN_IN_HEADER) {
            // set anonymous token header for use on the node proxy server
            request.set(ANONYMOUS_TOKEN_CLIENT_HEADER_NAME, token);
          }
        } else {
          // TEMPORARY LOGGING FOR ANONYMOUS TOKEN
          // TODO @cbengtson to remove
          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'anonError_ApiClient_Req',
            message: {
              errorMessage: 'EMPTY TOKEN',
              getAnonymousTokenFromCookie: !!getAnonymousTokenFromCookie(),
              getAnonymousTokenFromMemory: !!getAnonymousTokenFromMemory(),
              accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
            },
          });
        }
      }

      if (timeout || deadline) {
        request.timeout({
          response: timeout,
          deadline,
        });
      }

      if (data) {
        request.send(data);
      }

      // set headers from options
      Object.keys(headers).forEach((field) => {
        if (headers[field]) {
          request.set(field, headers[field] as string);
        }
      });

      request.on('abort', () => {
        /**
         * using "request.timedout" result to deal with the situation
         * that "abort" event is fired manually by unsubscribed callback
         *
         * "timeout" event is also calling "request.abort()"
         * according to https://github.com/visionmedia/superagent/blob/v3.8.3/lib/request-base.js#L666
         * but using callback in "end" event to handle that
         */
        // @ts-expect-error: not defined in @types/superagent :(
        if (!request.timedout) {
          logger.debug(`request to ${url} was aborted`);
          resolve(undefined);
        }
      });

      request.end(
        (err: ApiClientMethodOptions, { type, text, body }: Partial<superagent.Response> = {}) => {
          if (shouldTrackDuration && reqStartTS) {
            const reqEndTS = now();
            storeReqDuration({ reqStartTS, reqEndTS, reqUrl: fullUrl, tags: trackDurationTags });
          }

          // support for static html or text content
          // support for dash manifest prefetch
          if (returnText || type && (type.startsWith('text/') || type === 'application/dash+xml')) {
            body = text;
          }

          if (err) {
            logger.debug(
              {
                body,
                err: formatError(err),
                ip,
                method,
                url,
              },
              `ApiClient request ${err.timeout ? 'timeout' : 'fail'}.`
            );
            if (err.timeout) {
              reject(new Error(`request timeout - ${method.toUpperCase()} ${url}`));
            } else {
              let errObj = err;

              if (body && typeof body === 'object' && !isEmptyObject(body)) {
                errObj = { ...body, status: err.status };
              }

              if (__CLIENT__) {
                if (isUserNotFound(errObj.status, errObj.code)) {
                  dispatchUserNotFoundEvent();
                } else if (isLoginRequired(errObj.status, errObj.errorCode)) {
                  dispatchLoginRequiredEvent({
                    originalUrl: errObj.originalUrl,
                  });
                }
                // track if this error due to page unloading
                errObj.unloading = unloading;
              }

              reject(errObj);
            }
          } else {
            resolve(body);
          }
        }
      );

      return request;
    };

    return sendRequestDetails;
  }
}

/**
 * whether current request error is caused by incomplete XHR
 * superagent throws errors if XHR doesn't successfully receive server response
 * @link https://github.com/visionmedia/superagent/blob/33809d8102d7405a222b49ae60162e80b91e48b9/lib/client.js#L702
 * @link http://stackoverflow.com/questions/872206/http-status-code-0-what-does-this-mean-in-ms-xmlhttp#answer-14507670
 * @param {Object} [err]
 * @returns {boolean}
 */
export function isIncompleteRequestError(err: Error & { crossDomain?: boolean }): boolean {
  return err?.crossDomain === true;
}

export default ApiClient;
