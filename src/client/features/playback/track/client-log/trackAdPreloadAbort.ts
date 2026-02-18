import type { AdPreloadEventData } from '@adrise/player/lib';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { parseAWSHeaders } from '../../utils/parseAWSHeaders';

export function trackAdPreloadAbort(event: AdPreloadEventData) {
  const { responseHeaders = {} } = event;
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_PRELOAD_ABORT,
    message: {
      ...event,
      responseHeaders: undefined,
      awsHeader: parseAWSHeaders(responseHeaders),
    },
  });
}
