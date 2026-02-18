import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackDestroyTimeout(message?: string) {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const { contentId, codec, resourceType } = playbackInfo;
  if (__OTTPLATFORM__ === 'COMCAST') {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.DESTROY_TIMEOUT,
      message: {
        content_id: contentId,
        message,
        codec,
        playback_resource_type: resourceType,
      },
    });
  }

}
