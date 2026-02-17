import getApiConfig from 'common/apiConfig';
import type { ClientErrorConfig, RequestAttributes, StatusCodes } from 'common/helpers/apiClient/types';
import config from 'src/config';

import { retryBlacklist } from './constants';

export const getHostName = (url: string): string => new URL(url).hostname;
const apiConfig = getApiConfig();

export const getHttpMethod = (apiClientFnName: 'get' | 'put' | 'post' | 'patch' | 'del') => {
  if (apiClientFnName === 'del') {
    return 'DELETE';
  }
  return apiClientFnName.toUpperCase() as Uppercase<`${typeof apiClientFnName}`>;
};

const serviceMap = {
  [getHostName(apiConfig.accountServicePrefix)]: 'account',
  [getHostName(config.datasciencePrefix)]: 'datascience',
  [getHostName(config.analyticsEndpoint)]: 'analytics',
  [getHostName(config.analyticsIngestionV3Prefix)]: 'analytics',
  [getHostName(apiConfig.lishiPrefix)]: 'lishi',
  [getHostName(apiConfig.tensorPrefix)]: 'tensor',
  [getHostName(config.pauseAdsUrl)]: 'ads',
  [getHostName(apiConfig.autopilotPrefix)]: 'autopilot',
  [getHostName(apiConfig.configHubPrefix)]: 'config_hub',
  [getHostName(apiConfig.contentServicePrefix)]: 'content',
  [getHostName(apiConfig.crmPrefix)]: 'crm',
  [getHostName(apiConfig.popperPrefix)]: 'popper',
  [getHostName(config.rainmakerUrl)]: 'rainmaker',
  [getHostName(config.rainmakerIPv4OnlyUrl)]: 'rainmaker',
  [getHostName(apiConfig.searchServicePrefix)]: 'search',
  [getHostName(apiConfig.userQueuePrefix)]: 'user_queue',
  [getHostName(apiConfig.epgServicePrefix)]: 'epg',
};

export const isLegalRetryStrategy = (strategy: ClientErrorConfig['retry_strategies'][string]): strategy is Required<ClientErrorConfig['retry_strategies'][string]> => {
  return strategy.retry_base_millis !== undefined && strategy.retry_exponent !== undefined && strategy.retry_cap_millis !== undefined && strategy.retry_jitter_ratio !== undefined;
};

export const getRetryDelay = (strategy: Required<ClientErrorConfig['retry_strategies'][string]>, attempt: number) => {
  const rawVal = strategy.retry_exponent ** attempt * strategy.retry_base_millis;
  const maxVal = Math.min(rawVal, strategy.retry_cap_millis);
  const minVal = maxVal * (1 - strategy.retry_jitter_ratio);
  return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
};

const getResponseAttributes = (status: number, requestAttributes?: RequestAttributes) => {
  return requestAttributes?.status_codes?.[status] ?? requestAttributes?.errors?.default;
};

export const isInBlacklist = (hostname: string, pathname: string, method: ReturnType<typeof getHttpMethod>) => {
  return retryBlacklist.some(({ hostname: blacklistedHostname, pathname: blacklistedPathname, methods }) => {
    return hostname === blacklistedHostname && (!blacklistedPathname || pathname === blacklistedPathname) && (!methods || methods.includes(method));
  });
};

export const getRetryStrategy = ({
  hostname,
  method,
  pathname,
  status,
  clientErrorConfig,
  responseCode,
}: {
  hostname: string;
  pathname: string;
  method: ReturnType<typeof getHttpMethod>;
  status: number;
  clientErrorConfig: ClientErrorConfig;
  responseCode?: string
}) => {
  let retryStrategy: string | undefined;
  if (isInBlacklist(hostname, pathname, method)) {
    return undefined;
  }

  const serviceKey = serviceMap[hostname];
  const serviceConfig = serviceKey ? clientErrorConfig.services[serviceKey] : null;

  const routeMethodResponseAttributes = getResponseAttributes(status, serviceConfig?.routes?.[pathname]?.[method]);
  const routeResponseAttributes = getResponseAttributes(status, serviceConfig?.routes?.[pathname]);
  const defaultResponseAttributes = getResponseAttributes(status, clientErrorConfig.default);

  const responseAttributes = routeMethodResponseAttributes ?? routeResponseAttributes ?? defaultResponseAttributes;

  if (responseAttributes) {
    const { conditions } = responseAttributes as StatusCodes[string];
    if (conditions) {
      conditions.some(condition => {
        const condConfig = clientErrorConfig.conditions[condition];
        if (condConfig?.response_code === responseCode) {
          retryStrategy = condConfig.retry_strategy;
          return true;
        }
        return false;
      });
    }
    if (!retryStrategy) {
      retryStrategy = responseAttributes.retry_strategy;
    }
  }
  return retryStrategy ? clientErrorConfig.retry_strategies[retryStrategy] : undefined;
};
