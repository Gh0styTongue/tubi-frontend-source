import type { AdPreloadWastedBandwidthEventData } from '@adrise/player/lib';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackAdPreloadWastedBandwidth(event: AdPreloadWastedBandwidthEventData) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_PRELOAD_WASTED_BANDWIDTH,
    message: event,
  });
}
