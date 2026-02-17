import type { AdDiscontinueEventData } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';

import { getAdPlayInfo } from './utils/getAdPlayInfo';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsAdDiscontinue } from '../analytics-ingestion-v3';

export function trackAdDiscontinue(data: Parameters<typeof getAdPlayInfo>[0] & AdDiscontinueEventData) {
  const adPlayInfo = getAdPlayInfo(data);
  const adDuration = convertUnitWithMathRound(adPlayInfo.duration, 1000);
  const adPosition = convertUnitWithMathRound(adPlayInfo.adPosition, 1000);
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: adPlayInfo.content_id,
    ad_id: adPlayInfo.id,
    url: adPlayInfo.url,
    is_preroll: adPlayInfo.isPreroll,
    ad_index: adPlayInfo.index,
    ad_count: adPlayInfo.count,
    reason: data.reason,
    duration: adDuration, // milliseconds
    ad_position: adPosition !== undefined ? Math.min(adPosition, 2 ** 31 - 1) : undefined, // milliseconds
    message_map: convertObjectValueToString({
      retry: adPlayInfo.retry,
      lagTime: data.lagTime,
      auto_start: data.autoStart,
    }),
  };
  playerAnalyticsAdDiscontinue(playerAnalyticsData);
}
