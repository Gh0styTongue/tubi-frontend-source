/* istanbul ignore file */
/* eslint-disable import/no-unused-modules */
/* This file gets bundled as an entry (webpack.config.client.ts) and inline to the intro HTML files */
import { getConfig } from 'client/introLib/ottFireTVGen2RTU';
import type { PopperResponse } from 'common/api/popper';
import type { User } from 'common/features/authentication/types/auth';

import { ajax, cookies, buildQueryString, generateUUIDv4 } from './utils';

declare global {
  interface Window {
    introExperimentPromise: Promise<boolean | string | void>;
    finishFakeLoadProgress: () => void;
  }
}
const PUBLIC_PROD_API_HOST_DOMAIN = 'production-public.tubi.io';
const PUBLIC_STAGING_API_HOST_DOMAIN = 'staging-public.tubi.io';
const isStaging = process.env.TUBI_ENV === 'staging';
const isUsingProdAPI = String(process.env.USE_PROD_API) === 'true';
const useProd = !isStaging || isUsingProdAPI;
const publicApiHost = useProd ? PUBLIC_PROD_API_HOST_DOMAIN : PUBLIC_STAGING_API_HOST_DOMAIN;
const popperSubdomain = useProd ? 'popper-engine' : 'popper-engine-web';

const popperPrefix = `https://${popperSubdomain}.${publicApiHost}`;
const analyticsEndpoint = useProd
  ? 'https://analytics-ingestion.production-public.tubi.io/analytics-ingestion/v2/single-event'
  : 'https//analytics-ingestion.staging-public.tubi.io/analytics-ingestion/v2/single-event';

const config = getConfig();
const deviceId = cookies.get('deviceId');
const firstSeen = cookies.get('firstSeen');
/*
  This function rebuilt from trackEvent() and sendEvent().
  Necessary to hard code the API call to limit imports and ensure sent confirmation.
*/
const maybeLogExposure = (responses: [PopperResponse, User | void]) => {
  const {
    namespace_results = [],
    userId = undefined,
    authType = 'NOT_AUTHED',
  } = Object.assign({}, ...responses) as PopperResponse & User;

  if (!namespace_results.length) return;
  let resource: Record<string, string | boolean> = {};
  try {
    resource = JSON.parse(namespace_results[0].resource);
  } catch (e) {
    return;
  }
  const experiment_name = namespace_results[0].experiment_result?.experiment_name;
  const treatment = namespace_results[0].experiment_result?.treatment;
  const parameter_value = resource.enable_static_image;
  const salt = namespace_results[0].experiment_result?.segment ?? '';

  // const baseEventBody = Analytics.getBaseEventBody();
  // The following parameters are required for the sendBeacon() call
  // They would normally be derived from the app state
  const baseData = {
    request: {
      key: generateUUIDv4(),
    },
    user: {
      user_id: userId,
      auth_type: authType,
    },
    device: {
      device_id: cookies.get('deviceId'),
      manufacturer: 'AMAZON',
      model: 'AMAZON',
      os: window.navigator.platform,
      os_version: window.navigator.userAgent.match(/(Mac OS X|Windows NT|Linux) ([\d._]+)/)?.[2] || 'Unknown',
      user_agent: window.navigator.userAgent,
      is_mobile: /Mobi|Android/i.test(window.navigator.userAgent),
      device_width: window.screen.width,
      device_height: window.screen.height,
      locale: {
        identifier: window.navigator.language.replace('-', '_'),
        language: window.navigator.language.split('-')[0].toUpperCase(),
      },
    },
    app: {
      platform: 'AMAZON',
      app_version: '1.0',
      app_version_numeric: __APP_VERSION_NUMERIC__,
      app_height: window.screen.height * window.devicePixelRatio,
      app_width: window.screen.width * window.devicePixelRatio,
      app_mode: 'DEFAULT_MODE',
    },
    connection: {
      nominal_speed: 10,
    },
    sent_timestamp: new Date().toISOString(),
  };
  const data = {
    ...baseData,
    event: {
      exposure: {
        experiment: {
          namespace: config.namespace,
          name: experiment_name,
          salt,
          parameter_name: config.parameter,
          parameter_value: treatment,
        },
      },
    },
  };
  const sendBeaconParams = { sendBeacon: true };
  if (experiment_name) {
    window.navigator.sendBeacon(`${analyticsEndpoint}${buildQueryString(sendBeaconParams)}`, JSON.stringify(data));
  }
  return parameter_value;
};
(function introExperiment() {
  window.introExperimentPromise = Promise.resolve();

  if (__OTTPLATFORM__ === 'FIRETV_HYB' && deviceId) {
    const hasSendBeacon = !!(window.navigator && window.navigator.sendBeacon);
    const isSLowDevice = ['AFTB ', 'AFTM ', 'AFTT ', 'AFTN ', 'AFTS '].some(device => window.navigator.userAgent.includes(device));
    if (hasSendBeacon && isSLowDevice) {
      const getNamespace = ajax.get(
        `${popperPrefix}/popper/evaluate-namespaces`,
        {
          'namespaces': config.namespace,
          'request_context.platform': 'AMAZON',
          'request_context.device_id': deviceId,
          'request_context.first_seen': firstSeen,
        }
      );
      const getUser = ajax.get(
        '/oz/auth/loadAuth',
        {},
      ).catch(() => Promise.resolve());
      window.introExperimentPromise = Promise.all([getNamespace, getUser]).then(maybeLogExposure, maybeLogExposure);
    }
  }
}());
