import type { PLAYER_EVENTS, AdError, PlayerListeners } from '@adrise/player';
import Analytics from '@tubitv/analytics';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { callbackBatcherFactory } from './utils/callbackBatcher';

const [rateLimitedScheduler] = callbackBatcherFactory({ maxTokens: 5, tokenRate: 5000 });

export function trackAdBeaconFailed(error: AdError, data: Parameters<PlayerListeners[PLAYER_EVENTS.adBeaconFail]>[1]) {
  rateLimitedScheduler(`${data.type}-${error.code}`, (count: number) => {
    trackLogging({
      type: TRACK_LOGGING.adInfo,
      subtype: LOG_SUB_TYPE.AD.AD_BEACON_FAILED,
      message: {
        batchedErrorCount: count,
        ...error,
        ...data,
        release: Analytics.getAnalyticsConfig().app_version,
      },
    });
  });
}
