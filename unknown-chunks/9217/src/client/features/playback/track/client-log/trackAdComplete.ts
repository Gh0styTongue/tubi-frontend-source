import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

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
    message_map: convertObjectValueToString({
      ad_type: adPlayInfo.adType,
      health_scores: adPlayInfo.healthScores,
    }),
  };
  playerAnalyticsAdComplete(playerAnalyticsData);
}
