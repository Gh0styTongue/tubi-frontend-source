import type { ErrorEventData } from '@adrise/player';

import { isFatalError } from 'client/features/playback/error/isFatalError';
import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { trackLiveFatalError } from 'client/features/playback/track/datadog';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import type { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import { trackLogging } from 'common/utils/track';

import { convertErrorEventDataIntoErrorClientLog } from './utils/convertErrorEventDataIntoErrorClientLog';
import type { LivePlayerWrapper } from '../../live/LivePlayerWrapper';

export function trackLiveError(
  error: ErrorEventData,
  { contentId, wrapper, qualityManager, streamUrl }: { contentId: string, wrapper: LivePlayerWrapper, qualityManager?: LivePlaybackQualityManager, streamUrl?: string },
) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_ERROR,
    message: {
      ...getLiveClientLogBaseInfo({ contentId, wrapper, qualityManager, streamUrl }),
      ...convertErrorEventDataIntoErrorClientLog(error),
    },
  });

  if (isFatalError(error)) {
    trackLiveFatalError();
  }
}
