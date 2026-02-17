import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';
import { trackLogging } from 'common/utils/track';

import { getAdPlayInfo } from './utils/getAdPlayInfo';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsAdComplete } from '../analytics-ingestion-v3';

export function trackAdComplete(data: Parameters<typeof getAdPlayInfo>[0]) {
  const adPlayInfo = getAdPlayInfo(data);
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: adPlayInfo.content_id,
    ad_id: nullishCoalescingWrapper(adPlayInfo.id, ''),
    url: nullishCoalescingWrapper(adPlayInfo.url, ''),
    is_preroll: adPlayInfo.isPreroll,
    ad_index: adPlayInfo.index,
    ad_count: adPlayInfo.count,
    duration: convertUnitWithMathRound(adPlayInfo.duration, 1000), // millisecond
  };
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_COMPLETE,
    message: {
      ...playerAnalyticsData,
      ad_type: adPlayInfo.adType,
      health_scores: adPlayInfo.healthScores,
    },
  });
  playerAnalyticsAdComplete({
    ...playerAnalyticsData,
  });
}
