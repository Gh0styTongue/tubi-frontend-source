import { type PlatformLowercase, PLATFORMS } from 'common/constants/platforms';
import { ONETRUST_CONSENT } from 'common/features/gdpr/onetrust/constants';
import { OnetrustClient } from 'common/features/gdpr/onetrust/index';
import {
  ONETRUST_CONSENT_CHANGE_EVENT_NAME,
  ONETRUST_CONSENT_READY_EVENT_NAME,
} from 'common/features/gdpr/onetrust/onetrust';
import logger from 'common/helpers/logging';
import trackingManager from 'common/services/TrackingManager';
import type { ChromecastMediaInfoCustomData } from 'web/features/playback/actions/chromecast';

export const getOnetrustIdentifier = (deviceId?: string) => {
  /* istanbul ignore next */
  if (!deviceId) {
    logger.error('Missing device id when init onetrust');
  }
  const platform = PLATFORMS[(__OTTPLATFORM__ || __WEBPLATFORM__).toLowerCase() as PlatformLowercase];
  return `${platform}:${deviceId}`;
};

export const onScriptLoadError = (e: unknown) => {
  logger.error(e, 'Load OneTrust script error');
};

export const sendQueuedAnalyticsEventWhenConsentReady = (isGDPREnabled: boolean) => {
  if (!isGDPREnabled || OnetrustClient.isConsentReady) {
    // Tell Tracking Manager that it's ready to send Analytics Event
    trackingManager.onReadyToSendAnalyticsEvent();
    return;
  }
  // Onetrust load failed, we should also send queued analytics Event
  /* istanbul ignore next */
  if (!window.OneTrust && !window.oneTrustTV) {
    trackingManager.onReadyToSendAnalyticsEvent();
    return;
  }
  document.addEventListener(ONETRUST_CONSENT_READY_EVENT_NAME, () => {
    trackingManager.onReadyToSendAnalyticsEvent();
  });
  document.addEventListener(ONETRUST_CONSENT_CHANGE_EVENT_NAME, () => {
    trackingManager.sendQueueEvents();
  });
};

export const getChromecastParams = (): ChromecastMediaInfoCustomData['gdpr'] => {
  if (!__CLIENT__) {
    return undefined;
  }
  if (!window.__IS_GDPR_ENABLED__) {
    return undefined;
  }
  const { header, query } = OnetrustClient.getRainmakerParams();
  return {
    ads: {
      gdpr_analytics: 0,
      gdpr_personalized_ads: 0,
      ...query,
      tcf_string: header?.['X-Tubi-TCF-String'] || /* istanbul ignore next */ '',
    },
    consents: {
      C0002: !!OnetrustClient.getConsentStatus(ONETRUST_CONSENT.analytics),
      C0003: !!OnetrustClient.getConsentStatus(ONETRUST_CONSENT.functional),
      C0004: !!OnetrustClient.getConsentStatus(ONETRUST_CONSENT.personalized_advertising),
      C0005: !!OnetrustClient.getConsentStatus(ONETRUST_CONSENT.marketing),
    },
  } as const;
};
