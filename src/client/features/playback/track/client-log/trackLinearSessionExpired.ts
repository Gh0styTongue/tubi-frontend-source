import type { ErrorEventData } from '@adrise/player';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import {
  convertErrorEventDataIntoErrorClientLog,
} from 'client/features/playback/track/client-log/utils/convertErrorEventDataIntoErrorClientLog';
import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackLinearSessionExpired(
  { id, source, error, retryTimes, wrapper }: { id: string, source: string, error: ErrorEventData, retryTimes?: number, wrapper: LivePlayerWrapper | null },
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LINEAR_SESSION_EXPIRED,
    message: {
      source,
      error: convertErrorEventDataIntoErrorClientLog(error),
      retryTimes,
      ...getLiveClientLogBaseInfo({
        contentId: id,
        wrapper,
        streamUrl: wrapper?.url,
      }),
    },
  });
}
