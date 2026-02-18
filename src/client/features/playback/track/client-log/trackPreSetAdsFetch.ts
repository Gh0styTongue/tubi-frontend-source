import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

type TrackPreSetAdsFetchParams = {
  url: string;
  preRequestFrom: string;
  content_id: string;
  adCount: number;
  isSeries: boolean;
  errorMsg?: string;
};

export function trackPreSetAdsFetch({
  url,
  preRequestFrom,
  content_id,
  adCount,
  isSeries,
  errorMsg,
}: TrackPreSetAdsFetchParams) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.PRE_SET_ADS_FETCH,
    message: {
      url,
      preRequestFrom,
      content_id,
      adCount,
      isSeries,
      errorMsg,
    },
  });
}
