import Analytics from '@tubitv/analytics';
import dayjs from 'dayjs';
import { v4 } from 'uuid';

import type { PlayerAnalyticsEventParams } from 'client/features/playback/track/analytics-ingestion-v3';
import { COOKIE_DEVICE_ID } from 'common/constants/constants';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import { getApiClient } from 'common/helpers/apiClient/default';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getCookie, getLocalData } from 'common/utils/localDataStorage';
import { getPlatform } from 'common/utils/platform';
import config from 'src/config';

import { checkIsClientEnabledByThrottle } from './remoteConfig';

export function trackAnalyticsIngestionV3<S extends string>(
  params: {
    name: string;
    message: S extends keyof PlayerAnalyticsEventParams ? PlayerAnalyticsEventParams[S] : Record<string, unknown>;
  }
): void {
  const enabledClientLogInRemote = checkIsClientEnabledByThrottle(Math.random());
  const enabledClientLog = FeatureSwitchManager.isEnabled(['Logging', 'ClientLog'])
    || (!FeatureSwitchManager.isDisabled(['Logging', 'ClientLog']) && enabledClientLogInRemote && OnetrustClient.canSendClientLog());
  if (!enabledClientLog) return;
  const baseData = Analytics.getBaseEventBody();
  const data = {
    event_name: params.name,
    event_payloads: [
      {
        client_common: {
          event_id: v4(),
          event_timestamp: dayjs().format(),
        },
        device_id: baseData.device?.device_id || getCookie(COOKIE_DEVICE_ID) || getLocalData(COOKIE_DEVICE_ID),
        platform: getPlatform(),
        version: __RELEASE_HASH__,
        ...params.message,
      },
    ],
  };
  getApiClient().create().sendBeacon(`${config.analyticsIngestionV3Prefix}`, {
    data,
  });
}

