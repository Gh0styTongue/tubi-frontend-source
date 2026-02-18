// eslint-disable-next-line import/no-unused-modules
import { v4 as uuid } from 'uuid';

import type { PopperResponse } from 'common/api/popper';
import type { RemoteConfig } from 'common/api/remoteConfig';
import type { ClientErrorConfig } from 'common/helpers/apiClient/types';

import { cookies, ajax } from '../introLib/utils';

declare global {
  interface Window {
    __client_log_config_promise__?: Promise<ClientErrorConfig>;
    __remote_config_promise__?: Promise<RemoteConfig>;
    __popper_promise__?: Promise<PopperResponse>;
    __init_client_prefetch__: (config: InitOptions) => void;
  }
}

const getDeviceId = () => cookies.get('deviceId');

const setupDeviceId = () => {
  if (!getDeviceId()) {
    cookies.set('deviceId', uuid());
  }
};

const getFirstSeen = () => cookies.get('firstSeen');
const setupFirstSeen = () => {
  if (!getFirstSeen()) {
    cookies.set('firstSeen', new Date().toISOString());
  }
};

const fetchClientLogConfig = (url: string, params?: Record<string, unknown>) => {
  window.__client_log_config_promise__ = ajax.get(url, params);
};

const fetchRemoteConfig = (url: string, params: Record<string, unknown>) => {
  window.__remote_config_promise__ = ajax.get(url, {
    ...params,
    device_id: getDeviceId(),
  });
};

const fetchPopperConfig = (url: string, params: Record<string, unknown>) => {
  const passedParams = {
    'request_context.platform': (params.platform as string).toUpperCase(),
    'request_context.device_id': getDeviceId(),
    'request_context.first_seen': getFirstSeen(),
    ...params,
  } as Record<string, unknown>;
  delete passedParams.platform;
  window.__popper_promise__ = ajax.get(url, passedParams);
};

type InitOptions = {
  clientLogOption: {
    url: string;
    params?: Record<string, unknown>;
  };
  remoteConfigOption: {
    url: string;
    params: Record<string, unknown>;
  };
  popperConfigOption: {
    url: string;
    params: Record<string, unknown>;
  };
};

// This file is bundled independently and injected as a standalone script.
// We expose __init_client_prefetch__ on the global window object for external usage (e.g., embed entrypoint).
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
window.__init_client_prefetch__ = ({
  clientLogOption: { url: clientErrorConfigUrl, params: clientLogParams },
  remoteConfigOption: { url: remoteConfigUrl, params: remoteConfigParams },
  popperConfigOption: { url: popperConfigUrl, params: popperConfigParams },
}: InitOptions) => {
  setupDeviceId();
  setupFirstSeen();
  fetchClientLogConfig(clientErrorConfigUrl, clientLogParams);
  fetchRemoteConfig(remoteConfigUrl, remoteConfigParams);
  fetchPopperConfig(popperConfigUrl, popperConfigParams);
};
