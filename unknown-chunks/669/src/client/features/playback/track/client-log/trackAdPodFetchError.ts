import type { AdPodFetchError } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { convertAdErrorIntoErrorClientLog } from './utils/convertAdErrorIntoErrorClientLog';

export function trackAdPodFetchError(
  error: AdPodFetchError,
) {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_POD_FETCH_FAILED,
    message: {
      ...convertAdErrorIntoErrorClientLog(error),
      retries: error.retries ?? 0,
      overlapping_requests: error.overlappingRequests ?? 0,
      overlapping_request_hash: error.overlappingRequestHash ?? '',
      track_id: playbackInfo.trackId,
    },
  });
}
