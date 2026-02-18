import { isAppHidden } from 'client/systemApi/utils';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import type { PlayerSource } from 'common/constants/player';
import { VODPlaybackSession } from 'common/playback/VODPlaybackSession';
import { trackLogging } from 'common/utils/track';

// TODO: need to sample this later
export function trackOnHDMIConnected(source: PlayerSource, isHdmiConnected: boolean) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.ON_HDMI_CONNECTED,
    message: {
      source,
      isHdmiConnected: isHdmiConnected ? 'connected' : 'disconnected',
      isAppHidden: isAppHidden(),
      ...(source === 'video' ? { track_id: VODPlaybackSession.getVODPlaybackInfo().trackId } : {}),
    },
  });
}
