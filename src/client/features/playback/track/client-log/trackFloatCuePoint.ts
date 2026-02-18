import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackFloatCuePoint(data: {
  contentId: string;
  cuePointList: readonly number[];
  isFromAutoplay: boolean;
  isDeeplink: boolean;
  isFromVideoPreview?: boolean;
}) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.FLOAT_CUE_POINT,
    message: {
      ...data,
      track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    },
  });
}
