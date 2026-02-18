import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackNativeAdsFallback(
  data: {
    errorMsg?: string,
    adsCount: number
  }
) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.NATIVE_ADS_FALLBACK,
    message: {
      errorMsg: data.errorMsg,
      adsCount: data.adsCount,
    },
  });
}
