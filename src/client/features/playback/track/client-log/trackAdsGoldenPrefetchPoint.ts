import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

type TrackAdsGoldenPrefetchPointParams = {
  content_id: string;
  position: number;
  duration: number;
  remainingDuration: number;
  bufferLength: number
};

export function trackAdsGoldenPrefetchPoint({
  content_id,
  position,
  duration,
  remainingDuration,
  bufferLength,
}: TrackAdsGoldenPrefetchPointParams) {
  if (Math.random() > 0.1) {
    return;
  }
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.GOLDEN_PREFETCH_POINT,
    message: {
      content_id,
      position,
      duration,
      bufferLength,
      remainingDuration,
    },
  });
}
