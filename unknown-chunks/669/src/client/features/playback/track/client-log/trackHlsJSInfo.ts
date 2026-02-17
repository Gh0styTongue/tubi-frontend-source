import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { getDisplayResolution } from 'common/utils/analytics';
import { trackLogging } from 'common/utils/track';

export function trackHlsJSInfo({
  hlsLog,
}: {
  hlsLog: string;
}) {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const { contentId, isAutoplay } = playbackInfo;
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.HLS_JS_INFO,
    message: {
      content_id: contentId,
      hlsLog,
      displayResolution: getDisplayResolution(),
      isAutoplay,
    },
  });
}
