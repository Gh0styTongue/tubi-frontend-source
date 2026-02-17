import { ONE_DAY } from '@adrise/utils/lib/time';
import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import type { SentryRate, RemoteConfigState } from 'common/constants/constants';
import { DEVICE_SAMPLE_RATE, DEFAULT_SENTRY_RATE } from 'common/constants/sample-devices';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export function getDefaultSentryRate() {
  let result: SentryRate = DEFAULT_SENTRY_RATE;
  if (__OTTPLATFORM__) {
    result = DEVICE_SAMPLE_RATE[__OTTPLATFORM__]?.sentry;
  } else if (__WEBPLATFORM__) {
    result = DEVICE_SAMPLE_RATE[__WEBPLATFORM__]?.sentry;
  }
  if (typeof result === 'undefined') {
    result = DEFAULT_SENTRY_RATE;
  }
  return result;
}

const defaultSentryRate = getDefaultSentryRate();

export const initialState: RemoteConfigState = {
  blockedAnalyticsEvents: {},
  blockedLocalData: {},
  // We have fallback values for the urls and QR code images
  // in case the request failed
  privacyPolicyQrCodeUrl: 'https://mcdn.tubitv.com/tubitv-assets/img/gdpr/privacy.png',
  privacyPolicyUrl: 'https://tubitv.com/static/privacy',
  termsOfUseQrCodeUrl: 'https://mcdn.tubitv.com/tubitv-assets/img/gdpr/terms.png',
  termsOfUseUrl: 'https://tubitv.com/static/terms',
  youbora: {
    vod: false,
    preview: false,
    linear: false,
    trailer: false,
  },
  sentryRate: defaultSentryRate,
  country: 'US',
  isInBlockedCountry: false,
  isLiveAvailableInCountry: false,
  isRecommendedChannelsEnabledInCountry: false,
};

export default function remoteConfig(state: RemoteConfigState = initialState, action: AnyAction): RemoteConfigState {
  switch (action.type) {
    case actions.LOAD_REMOTE_CONFIG.SUCCESS: {
      const {
        blocked_analytics_events_mapping: blockedAnalyticsEvents,
        blocked_local_data: blockedLocalData,
        privacy_policy_qr_code_url: privacyPolicyQrCodeUrl,
        terms_of_use_qr_code_url: termsOfUseQrCodeUrl,
        terms_of_use_url: termsOfUseUrl,
        privacy_policy_url: privacyPolicyUrl,
        youbora = {},
        sentry_rate: sentryRate = defaultSentryRate,
        is_in_blocked_country: isInBlockedCountry,
        web_ott_linear_enabled: isLiveAvailableInCountry,
        web_ott_recommended_channels_enabled: isRecommendedChannelsEnabledInCountry,
        ...rest
      } = action.payload;
      const updatedState = {
        ...state,
        blockedAnalyticsEvents,
        blockedLocalData,
        privacyPolicyQrCodeUrl,
        privacyPolicyUrl,
        termsOfUseUrl,
        termsOfUseQrCodeUrl,
        youbora: {
          vod: youbora.vod === 1,
          preview: youbora.preview === 1,
          linear: youbora.linear === 1,
          trailer: youbora.trailer === 1,
        },
        sentryRate,
        isInBlockedCountry,
        isLiveAvailableInCountry,
        isRecommendedChannelsEnabledInCountry,
        ...rest,
      };
      /* istanbul ignore next */
      if (FeatureSwitchManager.isEnabled('ForceMajorEventOnboarding')) {
        return {
          ...updatedState,
          major_event_onboarding_start: new Date(Date.now() - ONE_DAY).toISOString(),
          major_event_onboarding_end: new Date(Date.now() + ONE_DAY).toISOString(),
        };
      }
      return updatedState;
    }
    default: {
      return state;
    }
  }
}
