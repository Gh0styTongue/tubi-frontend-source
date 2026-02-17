import Analytics from '@tubitv/analytics';
import dayjs from 'dayjs';
import { v4 } from 'uuid';

import type { PlayerAnalyticsEventParams } from 'client/features/playback/track/analytics-ingestion-v3';
import { getCookie, getLocalData } from 'client/utils/localDataStorage';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import { getApiClient } from 'common/helpers/apiClient/default';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getPlatform } from 'common/utils/platform';
import { COOKIE_DEVICE_ID } from 'src/common/constants/constants';
import config from 'src/config';

import { checkIsClientEnabledByThrottle } from './remoteConfig';

export function trackAnalyticsIngestionV3<S extends string>(
  params: {
    name: string;
    message: S extends keyof PlayerAnalyticsEventParams ? PlayerAnalyticsEventParams[S] : Record<string, unknown>;
  }
): void {
  const enabledPlayerAnalyticsEventInRemote = checkIsClientEnabledByThrottle(Math.random(), 'player_analytics_event_enabled');
  const enablePlayerAnalyticsEventLog = FeatureSwitchManager.isEnabled(['Logging', 'PlayerAnalyticsEvent'])
    || (!FeatureSwitchManager.isDisabled(['Logging', 'PlayerAnalyticsEvent']) && __SHOULD_ENABLE_PLAYER_ANALYTICS_EVENT_LOG__ && enabledPlayerAnalyticsEventInRemote && OnetrustClient.canSendAnalyticsIngestionV3());
  if (!enablePlayerAnalyticsEventLog) return;
  const baseData = Analytics.getBaseEventBody();
  const data = {
    event_name: params.name,
    event_payloads: [
      JSON.stringify({
        client_common: {
          event_id: v4(),
          event_timestamp: dayjs().format(),
        },
        device_id: baseData.device?.device_id || getCookie(COOKIE_DEVICE_ID) || getLocalData(COOKIE_DEVICE_ID),
        platform: getPlatform(),
        version: __RELEASE_HASH__,
        ...params.message,
      }),
    ],
  };
  getApiClient().create().sendBeacon(`${config.analyticsIngestionV3Prefix}`, {
    data,
  });
}

