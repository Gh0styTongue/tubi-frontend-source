// client-side config
import type { PlatformLowercase } from './common/constants/platforms';
import platformHash, { PLATFORMS } from './common/constants/platforms';

const {
  analytics: platformForAnalytics,
  gaTrackerId,
  videoMonitoringCode = '',
  videoMonitoringBrand = '',
} = platformHash[__OTTPLATFORM__ || __WEBPLATFORM__];
// eslint-disable-next-line import/no-unused-modules
export const platform = PLATFORMS[(__OTTPLATFORM__ || __WEBPLATFORM__).toLowerCase() as PlatformLowercase];

const {
  HOST,
  PORT,
  TUBI_ENV,
  SENTRY_DSN,
  USE_PROD_API,
} = process.env;
const host = HOST || 'localhost';
const isStaging = TUBI_ENV === 'staging';
const isStagingOrAlpha = TUBI_ENV === 'staging' || __IS_ALPHA_ENV__;

let TUBI_WEB_FQDN;
if (__CLIENT__) {
  // Unlike other OTT platforms, Samsung's HTML documents are not processed by the Node.js server, so we need to use the .
  TUBI_WEB_FQDN = __OTTPLATFORM__ === 'TIZEN' ? __TUBI_WEB_FQDN__ : window.TUBI_WEB_FQDN;
} else {
  TUBI_WEB_FQDN = process.env.TUBI_WEB_FQDN;
}

const THEME_DARK_BG = '#10141F';
const THEME_KIDS_BG = '#2865B7';

/* eslint-disable import/no-unused-modules -- false positive */
export const KIDS_MODE_THEME_COLOR = '#FEA534';

const getAppThemeColor = (isKidsModeEnabled: boolean) => isKidsModeEnabled ? THEME_KIDS_BG : THEME_DARK_BG;

/*
 Some platforms need to use HTTP for dev and staging environments, so that they can be intercepted with Charles
 proxy during QA, for instance. Others, such as FireTV, need to always use HTTPS, for DRM purposes.
 A common cause for needing to use Charles is the lack of good debugging support (or Remote Debugger support) on a
 given platform.
 */
const useHttpOnDevAndStaging = platform === PLATFORMS.ps4;
const stagingProtocol = useHttpOnDevAndStaging ? 'http:' : 'https:';

const isProd = USE_PROD_API || __PRODUCTION__;

// Use prod analytics URL for production or when using USE_PROD_API=true...
// but don't do this in test and dev so we do not pollute prod data
const useProdAnalyticsEndpoint = isProd && ['testing', 'development'].indexOf(TUBI_ENV) < 0;
const analyticsEndpoint = useProdAnalyticsEndpoint
  ? 'https://analytics-ingestion.production-public.tubi.io/analytics-ingestion/v2/single-event'
  : `${stagingProtocol}//analytics-ingestion.staging-public.tubi.io/analytics-ingestion/v2/single-event`;

const sealionAnalyticsEndpoint = 'https://analytics-ingestion-sealion.production-public.tubi.io/analytics-ingestion/v2/single-event';
// Analytics token endpoint requires a valid JWT for authentication
const analyticsTokenPath = '/token/analytics-ingestion/v2/single-event';
let analyticsTokenEndpoint = `${stagingProtocol}//analytics-ingestion.staging-public.tubi.io${analyticsTokenPath}`;
if (useProdAnalyticsEndpoint) {
  if (__IS_ALPHA_ENV__) {
    // ALPHA envs use .tubi.io domains
    analyticsTokenEndpoint = `https://analytics-ingestion.production-public.tubi.io${analyticsTokenPath}`;
  } else {
    // PROD envs use .tubitv.com domains
    analyticsTokenEndpoint = `https://analytics-ingestion-production.tubitv.com${analyticsTokenPath}`;
  }
}

type Environment = Readonly<{
  errLogFile: string,
  google: Readonly<{ clientID: string }>,
  vizio: Readonly<{ appKeyId: string }>,
  fqdn: string,
  gaTrackerId?: string,
  isStaging?: boolean,
  isStagingOrAlpha?: boolean,
  logFile: string,
  port: number,
  analyticsEndpoint: string,
  analyticsTokenEndpoint: string,
  datadogErrLogFile?: string,
  purpleCarpetAnalyticsEndpoint: string,
}>;

let environment: Environment;
if (__DEVELOPMENT__) {
  environment = {
    errLogFile: './error.log',
    google: { clientID: '142970037978-c85rvo3efhalv4csageer2ts1gg2ecra.apps.googleusercontent.com' },
    vizio: { appKeyId: 'tubitv-932171335d56' },
    fqdn: `${host}:3000`,
    gaTrackerId: 'UA-49139204-9',
    logFile: './debug.log',
    port: 3000,
    analyticsEndpoint,
    analyticsTokenEndpoint,
    purpleCarpetAnalyticsEndpoint: sealionAnalyticsEndpoint,
  };
} else {
  environment = {
    errLogFile: '/var/log/web/web-error.log',
    datadogErrLogFile: '/var/log/web/web-error-datadog.log',
    google: { clientID: process.env.TUBI_GOOGLE_CLIENT_ID as string },
    vizio: { appKeyId: isStaging ? process.env.TUBI_STAGING_VIZIO_APP_KEY_ID : process.env.TUBI_PROD_VIZIO_APP_KEY_ID },
    fqdn: TUBI_WEB_FQDN!, // Staging and production environments should always set TUBI_WEB_FQDN
    gaTrackerId,
    isStaging,
    isStagingOrAlpha,
    logFile: '/var/log/web/web.log',
    port: 5225,
    analyticsEndpoint,
    analyticsTokenEndpoint,
    purpleCarpetAnalyticsEndpoint: sealionAnalyticsEndpoint,
  };
}

const brazeConfig = isProd ? {
  apiKey: '5cd8f5e0-9c05-44d2-b407-9cf055e5733c',
  baseUrl: 'sdk.iad-01.braze.com',
} : {
  apiKey: '51ce2c87-4240-4f20-8a6e-728c4a540d88',
  baseUrl: 'sdk.iad-01.braze.com',
};

const PROD_API_HOST = 'production-public.tubi.io';
const STAGING_API_HOST = 'staging-public.tubi.io';

const apiHost = isProd ? PROD_API_HOST : STAGING_API_HOST;
const protocol = isProd ? 'https:' : `${stagingProtocol}`;
const socketProtocol = isProd ? 'wss' : (useHttpOnDevAndStaging ? 'ws' : 'wss');
/**
 * Rainmaker
 * ref: https://tubitv.atlassian.net/wiki/spaces/EC/pages/863273074/Rainmaker+-+Request+Parameters
 */
const rainmakerUrl = `${protocol}//rainmaker.${apiHost}`;
const rainmakerIPv4OnlyUrl = `${protocol}//rainmaker4.${apiHost}`;
const pauseAdsUrl = `${protocol}//ads.${apiHost}`;

/**
 * So we don't pollute prod data in local dev and test, we always
 * use staging in these contexts, even if USE_PROD_API is set to true
 */
const datascienceApiHost = ['testing', 'development'].indexOf(TUBI_ENV) >= 0 ? STAGING_API_HOST : apiHost;

export const datasciencePrefix = `${protocol}//uapi.${datascienceApiHost}/datascience`;

const analyticsIngestionV3Host = isProd
  ? 'analytics-ingestion-v3.main-production-custom.production.k8s.tubi.io'
  : 'analytics-ingestion-v3.main-staging-custom.staging.k8s.tubi.io';
export const analyticsIngestionV3Prefix = `${protocol}//${analyticsIngestionV3Host}/analytics-ingestion/v3/events/send`;

/**
 * Voyager
 */
const voyagerSocketUrl = `${socketProtocol}://voyager.${apiHost}/socket`;
const voyagerUrl = `${protocol}//voyager.${apiHost}`;
// @todo(Tim) figure a config situation for staging key, for now using prod
// Staging appboy Key === '51ce2c87-4240-4f20-8a6e-728c4a540d88'

const accountServicePrefix = isProd
  ? 'https://account.production-public.tubi.io'
  : 'https://account.staging-public.tubi.io';

const userTokenRoutes = {
  signingKey: `${accountServicePrefix}/device/anonymous/signing_key`,
  refreshSigningKey: `${accountServicePrefix}/device/anonymous/refresh_signing_key`,
  token: `${accountServicePrefix}/device/anonymous/token`,
  refreshToken: `${accountServicePrefix}/device/anonymous/refresh`,
};

const ga4MeasurementIdWeb = isProd ? 'G-HTBQYPEK9N' : 'G-JMQ0EQW40Q';
const ga4MeasurementIdWindows = isProd ? 'G-HT8YZ21K53' : 'G-TVX0XF9ER7';
const ga4MeasurementId = __WEBPLATFORM__ === 'WINDOWS' ? ga4MeasurementIdWindows : ga4MeasurementIdWeb;

export default {
  ...environment,
  brazeConfig,
  host,
  platform,
  platformForAnalytics,
  videoMonitoringCode,
  videoMonitoringBrand,
  sentryClientDSN: SENTRY_DSN,
  port: PORT || environment.port,
  prodHost: TUBI_WEB_FQDN ? `https://${TUBI_WEB_FQDN}` : 'https://tubitv.com',
  adServer: 'https://ads.adrise.tv',
  imageDomains: [
    '//images.adrise.tv',
    '//images02.adrise.tv',
  ],
  fbANPlacementId: '1722980957943658_1722980971276990',
  rainmakerUrl,
  pauseAdsUrl,
  rainmakerIPv4OnlyUrl,
  getAppThemeColor,
  voyagerUrl,
  voyagerSocketUrl,
  userTokenRoutes,
  ga4MeasurementId,
  datasciencePrefix,
  analyticsIngestionV3Prefix,
};
