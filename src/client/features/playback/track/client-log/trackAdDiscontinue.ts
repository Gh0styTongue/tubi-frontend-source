import type { AdDiscontinueEventData } from '@adrise/player';
import { getArrayLastItem } from '@adrise/utils/lib/tools';

import { START_STEP, VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';

import { playerAnalyticsAdDiscontinue } from '../analytics-ingestion-v3';
import { getAdPlayInfo } from './utils/getAdPlayInfo';
import { getPlayerDisplayType } from './utils/getPlayerDisplayType';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

export function trackAdDiscontinue(data: Parameters<typeof getAdPlayInfo>[0] & AdDiscontinueEventData) {
  const adPlayInfo = getAdPlayInfo(data);
  const adDuration = convertUnitWithMathRound(adPlayInfo.duration, 1000);
  const adPosition = convertUnitWithMathRound(adPlayInfo.adPosition, 1000);
  const vodPlaybackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const currentAdStartStep = getArrayLastItem(getArrayLastItem(vodPlaybackInfo.adStartSteps) || []);
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: vodPlaybackInfo.trackId,
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
      estimated_time_cost: adPlayInfo.healthScores?.estimatedTimeCost,
      health_score: adPlayInfo.healthScores?.total,
      // We will fire the ad impression event when we receive the first time update event, even it is zero.
      imp_fired: vodPlaybackInfo.currentAdImpressionFired,
      // The user has viewed the first frame of the ad. We rely on canplay event and loadeddata event for this.
      first_frame_viewed: currentAdStartStep >= START_STEP.VIEWED_FIRST_FRAME,
      // This mean we receive a legal timeupdate event bigger than 0.5s.
      play_started: currentAdStartStep >= START_STEP.PLAY_STARTED,
      consecutiveCodeSkips: data.consecutiveCodeSkips,
      lastSkipReason: data.lastSkipReason,
      bufferedArray: data.bufferedArray,
      videoPaused: data.videoPaused,
      player_type: getPlayerDisplayType(vodPlaybackInfo.playerDisplayMode),
      pendingPlay: data.pendingPlay,
    }),
  };
  playerAnalyticsAdDiscontinue(playerAnalyticsData);
}
