import type { AdStallEventData } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';

import { playerAnalyticsAdStart } from '../analytics-ingestion-v3';
import { getAdPlayInfo } from './utils/getAdPlayInfo';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { getVODPageSession } from '../../session/VODPageSession';

export function trackAdStart(data: Exclude<Parameters<typeof getAdPlayInfo>[0], AdStallEventData>) {
  const adPlayInfo = getAdPlayInfo(data);
  const { playbackSourceType } = getVODPageSession();
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: adPlayInfo.content_id,
    ad_id: adPlayInfo.id,
    url: adPlayInfo.url,
    is_preroll: adPlayInfo.isPreroll,
    ad_index: adPlayInfo.index,
    ad_count: adPlayInfo.count,
    duration: convertUnitWithMathRound(adPlayInfo.duration, 1000), // millisecond
    message_map: convertObjectValueToString({
      ad_type: adPlayInfo.adType,
      consecutiveCodeSkips: data.consecutiveCodeSkips,
      lastSkipReason: data.lastSkipReason,
      presetAdType: adPlayInfo.presetAdType,
      sourceType: playbackSourceType,
      isSeries: playbackInfo.isSeries,
      isAutoplay: playbackInfo.isAutoplay,
    }),
  };
  playerAnalyticsAdStart(playerAnalyticsData);
}
