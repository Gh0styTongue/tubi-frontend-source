// Restart the App
// For Hybrid App(Android TV and Fire tv)
// We call a jsBridge and native will restart the app
// Other app will just call location.reload
// Currently it's only used for GDPR - when user changes their consent
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';

import { getLocationOrigin } from 'client/utils/location';
import { PERSISTED_QUERY_PARAMS_NAMESPACE } from 'common/features/authentication/constants/persistedQueryParams';
import logger from 'common/helpers/logging';
import { isSamsung2018 } from 'common/utils/tizenTools';

import { getBridge, setupDsBridgeForDevEnv } from './clientTools';

export function restartApp(persistedQueryParams: Record<string, unknown>) {
  /* istanbul ignore next */
  if (__DEVELOPMENT__) {
    setupDsBridgeForDevEnv({
      restartApp: () => false,
    });
  }
  try {
    if (__OTTPLATFORM__ === 'ANDROIDTV' || __OTTPLATFORM__ === 'FIRETV_HYB') {
      /* istanbul ignore next */
      const bridge = getBridge({ debug: !__PRODUCTION__ || __IS_ALPHA_ENV__ });
      return bridge.callHandler('restartApp');
    }
    // There're two ways to restart the app on Tizen
    // 1. location.href = 'file:///index.html#'
    // 2. Use Tizen API to restart the app
    // 1 Only works on older samsung devices(e.g 2016 and before)
    // 2 Only works on newer samsung devices(e.g 2017 and after)
    // So we need to use both ways to restart the app
    if (__OTTPLATFORM__ === 'TIZEN') {
      location.href = addQueryStringToUrl('file:///index.html#/', {
        [PERSISTED_QUERY_PARAMS_NAMESPACE]: JSON.stringify(persistedQueryParams),
      });
      window.tizen.application.launch(window.tizen.application.getAppInfo().id);
      if (isSamsung2018()) {
        location.href = 'file:///index.html';
      }
      return;
    }
    const redirectUrl = getLocationOrigin();
    // add persisted query params
    // can get from persistedQueryParamsSelector
    location.href = addQueryStringToUrl(`${redirectUrl}/`, {
      [PERSISTED_QUERY_PARAMS_NAMESPACE]: JSON.stringify(persistedQueryParams),
    });
  } catch (e) {
    logger.error('Can not restart app', e);
    return false;
  }
}
