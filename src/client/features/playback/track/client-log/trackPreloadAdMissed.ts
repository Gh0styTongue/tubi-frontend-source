import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

type TrackPreloadAdMissedParams = {
  preRequestFrom: string;
  content_id: string;
  adCount: number;
  isSeries: boolean;
  totalAdDuration: number;
};

export function trackPreloadAdMissed({
  preRequestFrom,
  content_id,
  adCount,
  isSeries,
  totalAdDuration,
}: TrackPreloadAdMissedParams) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.PRELOAD_AD_MISSED,
    message: {
      preRequestFrom,
      content_id,
      adCount,
      isSeries,
      totalAdDuration,
    },
  });
}
