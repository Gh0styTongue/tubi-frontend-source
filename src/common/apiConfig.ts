import { getLocalStorageData } from '@adrise/utils/lib/localStorage';

import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

const getAccountServiceEnvironment = (accountServicePrefix: string) => ({
  accountServicePrefix,
  accountServiceUserPrefix: `${accountServicePrefix}/user`,
  accountServiceDevicePrefix: `${accountServicePrefix}/device`,
  accountServiceConfigPrefix: `${accountServicePrefix}/config`,
  accountServiceUserDevicePrefix: `${accountServicePrefix}/user_device`,
  accountServiceConsent: `${accountServicePrefix}/consent`,
});

/** API config definitions to be used on both client and server.
 *  These values are extracted from src/server/config.ts
 *  canUseEnvoy - requests originating from the node server must use Envoy URls with HTTP, and requests from ApiClient must use HTTPS or risk throwing a mixed content error
 */
function getApiConfig(canUseEnvoy = false) {
  const isStaging = process.env.TUBI_ENV === 'staging';
  const isUsingProdAPI = String(process.env.USE_PROD_API) === 'true';

  // use Consul if Envoy is enabled, they two are strongly binded for us, except if on staging and prod API is enabled
  let isUsingConsul = canUseEnvoy && process.env.ENABLE_ENVOY === 'true';
  const isUsingIstio = process.env.ENABLE_ISTIO === 'true';
  if (isStaging) {
    isUsingConsul = isUsingConsul && !isUsingProdAPI;
  }

  const PUBLIC_PROD_API_HOST_DOMAIN = 'production-public.tubi.io';
  const PUBLIC_STAGING_API_HOST_DOMAIN = 'staging-public.tubi.io';

  let environment;

  let apiHost;

  let accountServicePrefix;
  let tensorPrefix;
  let crmPrefix;
  let popperPrefix;
  let configHubPrefix;
  let lishiPrefix;
  let userQueueServicePrefix;
  let contentServicePrefix;
  let epgServicePrefix;
  let searchServicePrefix;
  let autopilotPrefix;
  let failsafeSuffix = '-cdn';

  /* istanbul ignore next */
  if (__OTTPLATFORM__ === 'SONY') {
    failsafeSuffix = '';
  }

  /* istanbul ignore next */
  if (!FeatureSwitchManager.isDefault('FailsafeEndPoint')) {
    failsafeSuffix = FeatureSwitchManager.get('FailsafeEndPoint') as string;
  }

  if (__DEVELOPMENT__) {
    apiHost = isUsingProdAPI ? PUBLIC_PROD_API_HOST_DOMAIN : PUBLIC_STAGING_API_HOST_DOMAIN;
    const popperSubdomain = isUsingProdAPI ? 'popper-engine' : 'popper-engine-web';
    accountServicePrefix = `https://account.${apiHost}`;
    tensorPrefix = `https://tensor${failsafeSuffix}.${apiHost}`;
    crmPrefix = `https://crm.${apiHost}`;
    popperPrefix = `https://${popperSubdomain}.${apiHost}`;
    lishiPrefix = `https://lishi.${apiHost}/api/v2/view_history`;
    userQueueServicePrefix = `https://user-queue.${apiHost}`;
    configHubPrefix = `https://config-hub${failsafeSuffix}.${apiHost}`;
    contentServicePrefix = `https://content${failsafeSuffix}.${apiHost}`;
    epgServicePrefix = `https://epg${failsafeSuffix}.${apiHost}`;
    searchServicePrefix = `https://search.${apiHost}`;
    autopilotPrefix = `https://autopilot${failsafeSuffix}.${apiHost}`;

    environment = {
      ...getAccountServiceEnvironment(accountServicePrefix),
      lishiPrefix,
      contentServicePrefix,
      cmsPrefix: `${contentServicePrefix}/cms`,
      cmsPrefixV2: `${contentServicePrefix}/api/v2`,
      linearReminderPrefix: `${userQueueServicePrefix}/api/v1/linear_reminder`,
      searchServicePrefix,
      autopilotPrefix,
    };
  } else { // staging and production
    const useProd = !isStaging || isUsingProdAPI;
    let publicApiHost = useProd ? PUBLIC_PROD_API_HOST_DOMAIN : PUBLIC_STAGING_API_HOST_DOMAIN;
    const popperSubdomain = useProd ? 'popper-engine' : 'popper-engine-web';
    const popperConsulSubdomain = useProd ? 'popper-engine-k8s-http' : 'popper-engine-web-k8s-http';
    if (isStaging) {
      apiHost = publicApiHost;
    } else {
      apiHost = 'production-private.tubi.io';
      publicApiHost = PUBLIC_PROD_API_HOST_DOMAIN;
    }
    accountServicePrefix = isUsingConsul
      ? 'http://account-k8s-http'
      : `https://account.${publicApiHost}`;

    tensorPrefix = isUsingConsul
      ? 'http://tensor-k8s-http'
      : `https://tensor${failsafeSuffix}.${publicApiHost}`;

    crmPrefix = isUsingConsul
      ? 'http://crm-k8s-http'
      : `https://crm.${publicApiHost}`;
    popperPrefix = isUsingConsul
      ? `http://${popperConsulSubdomain}`
      : `https://${popperSubdomain}.${publicApiHost}`;
    userQueueServicePrefix = isUsingConsul
      ? 'http://user-queue-k8s-http'
      : `https://user-queue.${publicApiHost}`;

    lishiPrefix = isUsingConsul
      ? 'http://lishi-k8s-http'
      : `https://lishi.${publicApiHost}`;

    configHubPrefix = isUsingConsul
      ? 'http://config-hub-k8s-http'
      : `https://config-hub${failsafeSuffix}.${publicApiHost}`;

    contentServicePrefix = isUsingConsul
      ? 'http://content-k8s-http'
      : `https://content${failsafeSuffix}.${publicApiHost}`;

    epgServicePrefix = isUsingConsul
      ? 'http://epg-k8s-http'
      : `https://epg${failsafeSuffix}.${publicApiHost}`;

    searchServicePrefix = isUsingConsul
      ? 'http://search-k8s-http'
      : `https://search.${publicApiHost}`;

    autopilotPrefix = `https://autopilot${failsafeSuffix}.${publicApiHost}`;

    /* istanbul ignore next */
    if (isUsingIstio) {
      const envPrefix = useProd ? 'production' : 'staging';
      accountServicePrefix = `http://account-istio.${envPrefix}-ccs:8001`;
      crmPrefix = `http://crm-istio.${envPrefix}-ccs:8001`;
      popperPrefix = `http://popper-engine-istio.${envPrefix}-delphi:8001`;
      lishiPrefix = `http://lishi-istio.${envPrefix}-ccs:8001`;
      userQueueServicePrefix = `http://user-queue-istio.${envPrefix}-ccs:8001`;
      configHubPrefix = `http://config-hub-istio.${envPrefix}-ccs:8001`;
      epgServicePrefix = `http://epg-istio.${envPrefix}-ccs:8001`;
      searchServicePrefix = `http://search-istio.${envPrefix}-ccs:8001`;
      autopilotPrefix = `http://autopilot-istio.${envPrefix}-ccs:8001`;
    }

    environment = {
      ...getAccountServiceEnvironment(accountServicePrefix),
      lishiPrefix: `${lishiPrefix}/api/v2/view_history`,
      contentServicePrefix,
      cmsPrefix: `${contentServicePrefix}/cms`,
      cmsPrefixV2: `${contentServicePrefix}/api/v2`,
      linearReminderPrefix: `${userQueueServicePrefix}/api/v1/linear_reminder`,
      searchServicePrefix,
      autopilotPrefix,
    };
  }

  const config = {
    isStaging,
    isUsingConsul,
    isUsingProdAPI,
    isUsingIstio,
    PUBLIC_PROD_API_HOST_DOMAIN,
    PUBLIC_STAGING_API_HOST_DOMAIN,
    tensorPrefix: `${tensorPrefix}/api/v1`,
    tensorPrefixV2: `${tensorPrefix}/api/v2`,
    tensorPrefixV3: `${tensorPrefix}/api/v3`,
    tensorPrefixV5: `${tensorPrefix}/api/v5`,
    tensorPrefixSitemap: `${tensorPrefix}/internal/v1/sitemap`,
    crmPrefix,
    popperPrefix,
    userQueuePrefix: `${userQueueServicePrefix}/api/v2/queues`,
    configHubPrefix,
    epgServicePrefix,
    uapi: {
      /* account service routes */
      login: `${environment.accountServiceUserPrefix}/login`,
      users: `${environment.accountServiceUserDevicePrefix}/users`,
      refresh: `${environment.accountServiceUserDevicePrefix}/login/refresh`,
      loginTransfer: `${environment.accountServiceUserDevicePrefix}/login/transfer`,
      logout: `${environment.accountServiceUserDevicePrefix}/logout`,
      signUpConfirmationEmail: `${environment.accountServiceUserDevicePrefix}/signup/confirmation_email`,
      signUpConfirm: `${environment.accountServiceUserDevicePrefix}/signup/confirm`,
      userSignup: `${environment.accountServiceUserPrefix}/signup`,
      resetPassword: `${environment.accountServiceUserDevicePrefix}/password/reset`,
      changePassword: `${environment.accountServiceUserDevicePrefix}/password/change`,
      activateDevice: `${environment.accountServiceUserDevicePrefix}/code/register`,
      codeGenerate: `${environment.accountServiceUserDevicePrefix}/code/generate`,
      codeStatus: `${environment.accountServiceUserDevicePrefix}/code/status`,
      magicLink: `${environment.accountServiceDevicePrefix}/magic_link`,
      registrationLink: `${environment.accountServiceDevicePrefix}/link/registration`,
      emailAvailable: `${environment.accountServiceUserPrefix}/email_available`,
      userSettings: `${environment.accountServiceUserPrefix}/settings`,
      accountService: environment.accountServicePrefix,
      history: environment.lishiPrefix,
      linearReminder: environment.linearReminderPrefix,
    },
    ...environment,
  };

  return config;
}

const defaultPurpleCarpetScriptsPrefix = 'https://prod.player.fox.digitalvideoplatform.com/wpf/v3/3.2.5-hf3';
export const purpleCarpetScriptsPrefix = (__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__)
  ? getLocalStorageData('purpleCarpetScriptsPath') || defaultPurpleCarpetScriptsPrefix
  : defaultPurpleCarpetScriptsPrefix;

export default getApiConfig;
