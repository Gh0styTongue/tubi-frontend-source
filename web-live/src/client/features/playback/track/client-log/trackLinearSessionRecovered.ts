import { extractLiveStreamToken } from '@adrise/utils/lib/url';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { toFixed2 } from 'common/utils/format';
import { trackLogging } from 'common/utils/track';

export function trackLinearSessionRecovered(
  { id, source, retryTimes, wrapper }: { id: string, source: string, retryTimes?: number, wrapper: LivePlayerWrapper | null },
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LINEAR_SESSION_RECOVERED,
    message: {
      id,
      source,
      retryTimes,
      sessionStartTs: toFixed2(getLiveVideoSession()?.startTimestamp || 0),
      position: wrapper?.getPosition() || 0,
      streamToken: extractLiveStreamToken(wrapper?.url || ''),
    },
  });
}
