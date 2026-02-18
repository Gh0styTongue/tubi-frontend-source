import type { AdCompleteEventData, Player } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsAdComplete } from '../analytics-ingestion-v3';
import { getAdPlayInfo } from './utils/getAdPlayInfo';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

export function trackAdComplete(data: AdCompleteEventData & { contentId: string; player: Player }) {
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
    play_time_exclude_pause_time: Math.round(data.totalDurationExcludePause), // millisecond
    message_map: convertObjectValueToString({
      ad_type: adPlayInfo.adType,
      health_scores: adPlayInfo.healthScores,
      consecutiveCodeSkips: data.consecutiveCodeSkips,
      lastSkipReason: data.lastSkipReason,
      presetAdType: adPlayInfo.presetAdType,
    }),
  };
  playerAnalyticsAdComplete(playerAnalyticsData);
}
