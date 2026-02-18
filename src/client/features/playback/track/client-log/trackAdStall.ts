import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { getAdPlayInfo } from './utils/getAdPlayInfo';

export function trackAdStall(data: Parameters<typeof getAdPlayInfo>[0]) {
  const adPlayInfo = getAdPlayInfo(data);
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_STALL,
    message: adPlayInfo,
  });
}
