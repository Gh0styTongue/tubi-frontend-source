import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import type { TrackVideoErrorParam } from './utils/types';
import { wrapBaseVideoErrorMessage } from './utils/wrapBaseVideoErrorMessage';

export function trackLiveErrorReload(
  info: TrackVideoErrorParam & { manuallyReload: boolean, hasReattached: boolean, wrapper: LivePlayerWrapper, retryCount: number },
): void {
  const { manuallyReload, hasReattached } = info;
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_ERROR_RELOAD,
    message: {
      ...wrapBaseVideoErrorMessage(info),
      manuallyReload,
      hasReattached,
      ...getLiveClientLogBaseInfo({
        contentId: info.contentId || '',
        wrapper: info.wrapper,
        streamUrl: info.videoUrl,
      }),
      retryCount: info.retryCount,
    },
  });
}
