import type { AdError } from '@adrise/player';
import Analytics from '@tubitv/analytics';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { convertAdErrorIntoErrorClientLog } from './utils/convertAdErrorIntoErrorClientLog';
import type { AdClientLogBaseInfo } from './utils/types';

type AdClientLogBaseParams = Omit<AdClientLogBaseInfo, 'content_id' | 'release'> & {
  contentId: AdClientLogBaseInfo['content_id'];
};

function getAdClientLogBaseInfo({ contentId, ...rest }: AdClientLogBaseParams): AdClientLogBaseInfo {
  return {
    content_id: contentId,
    ...rest,
    release: Analytics.getAnalyticsConfig().app_version,
  };
}

export function trackAdError(
  error: AdError,
  adInfo: AdClientLogBaseParams,
) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.AD_ERROR,
    message: {
      ...convertAdErrorIntoErrorClientLog(error),
      ...getAdClientLogBaseInfo(adInfo),
    },
  });
}
