/**
 * Track startup and in-stream experience for live playback
 * @author Leo Fu
 */

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getLiveClientLogBaseInfo } from 'client/features/playback/track/client-log/utils/getLiveClientLogBaseInfo';
import { trackLiveBufferRatio } from 'client/features/playback/track/datadog';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import type {
  LivePlaybackQualityManager,
} from 'common/features/playback/services/LivePlaybackQualityManager';
import { trackLogging } from 'common/utils/track';

export const trackLivePlayerServiceQuality = ({
  player,
  contentId,
  serviceQualityManager,
}: {
  player: LivePlayerWrapper,
  contentId: string;
  serviceQualityManager?: LivePlaybackQualityManager
}) => {
  if (!serviceQualityManager) {
    return;
  }
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_PLAYER_SERVICE_QUALITY,
    message: {
      ...serviceQualityManager.getQuality(),
      ...getLiveClientLogBaseInfo({ contentId, wrapper: player, qualityManager: serviceQualityManager }),
    },
  });
  trackLiveBufferRatio(serviceQualityManager.getQuality()?.bufferRatio ?? 0);
};
