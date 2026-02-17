import type { AdPreloadEventData } from '@adrise/player/lib';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { parseAWSHeaders } from '../../utils/parseAWSHeaders';

export function trackAdPreloadTimeout(event: AdPreloadEventData) {
  const { responseHeaders = {} } = event;
  delete event.responseHeaders; // Avoid the headers too large
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_PRELOAD_TIMEOUT,
    message: {
      ...event,
      awsHeader: parseAWSHeaders(responseHeaders),
    },
  });
}
