import { secs, years } from '@adrise/utils/lib/time';

import { getCookie, setCookie } from 'client/utils/localDataStorage';
import { DEBUGGER_LAUNCHER_URL } from 'common/constants/constants';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import ApiClient from '../helpers/ApiClient';

/**
 * @note this function is only meant for debugging, do not use in prod
 * check server logs for output, useful for OTT debugging
 */
export function serverLog(...data: any[]) {
  const apiClient = new ApiClient();
  apiClient.post('/oz/log', {
    data: {
      ...data,
      timestamp: Date.now(),
    },
  });
}

/**
 * custom console.log
 * @param prefix
 */
export const getDebugLog = (prefix: string, logMethod?: typeof serverLog) => {
  return (...args: any[]) => {
    // don't log in production
    if (__PRODUCTION__ && !__IS_ALPHA_ENV__ && !__STAGING__) return;

    let log: typeof serverLog;
    if (typeof logMethod !== 'undefined') {
      log = logMethod;
    } else {
      // eslint-disable-next-line no-console
      if ((!(__STAGING__ || __IS_ALPHA_ENV__) || FeatureSwitchManager.isDefault(['Logging', 'Debug'])) && typeof console.log === 'function') {
        // eslint-disable-next-line no-console
        log = console.log.bind(console);
      } else {
        log = serverLog;
      }
    }
    log(...[
      `[${prefix}]`,
      ...args,
    ]);
  };
};

export const REMOTE_DEBUGGER_COOKIE_NAME = '$TubiRD';
export const getRemoteDebuggerStatus = () => {
  return getCookie(REMOTE_DEBUGGER_COOKIE_NAME) === '1';
};
export const setRemoteDebuggerStatus = (enable: boolean) => {
  const cookieValue = enable ? '1' : '0';
  try {
    setCookie(REMOTE_DEBUGGER_COOKIE_NAME, cookieValue, years(10) / secs(1));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error writing cookie value of "${REMOTE_DEBUGGER_COOKIE_NAME}=${cookieValue}".`);
  }
};

export function toggleRemoteDebugger() {
  /* istanbul ignore if */
  if (typeof window === 'undefined') return;
  if (window.remoteDebuggerLauncher) {
    window.remoteDebuggerLauncher.toggle();
    return;
  }
  // We have not load the remote debugger yet.
  if (__OTTPLATFORM__ === 'TIZEN') {
    // Samsung doesn't support window reload
    const script = document.createElement('script');
    script.src = DEBUGGER_LAUNCHER_URL;
    document.body.appendChild(script);
  } else {
    window.location.reload();
  }
}
