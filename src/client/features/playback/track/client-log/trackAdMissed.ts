import type { AdMissedEvent } from '@adrise/player';
import { sendVASTNotUsedBeacon } from '@adrise/player';
import type { SeekType } from '@tubitv/analytics/lib/playerEvent';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsAdMissed } from '../analytics-ingestion-v3';
import { trackAdBeaconFailed } from './trackAdBeaconFailed';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

type TrackAdMissedMessage = AdMissedEvent & {
  position: number | undefined;
  bwwActive?: boolean;
  controlsActive?: boolean;
  videoResourceType?: string;
  videoCodecType?: string;
  currentVideoResolution?: string;
  contentId: string;
  lastPositionDiff?: string
  lastPosition?: number | string;
  breakEmittedAt?: number;
  seekTypeBeforeFetch?: SeekType;
  seekTypeAfterFetch?: SeekType;
};

export function trackAdMissed(data: TrackAdMissedMessage) {
  const {
    response,
    reason,
    currentBreak,
    targetBreak,
    isPreroll,
    scene,
    adSequence = 0,
    metrics,
    position,
    bwwActive,
    controlsActive,
    videoResourceType,
    videoCodecType,
    currentVideoResolution,
    contentId,
    lastPositionDiff,
    lastPosition,
    breakEmittedAt,
    seekTypeBeforeFetch,
    seekTypeAfterFetch,
  } = data;
  const { responseTime, networkResponseTime, requestQueueTime, retries = 0 } = metrics || {};
  if (!response) return;
  sendVASTNotUsedBeacon(response, scene, adSequence, (err) => {
    trackAdBeaconFailed(err, { type: 'notUsed' });
  });
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const playerAnalyticsEventData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    isPreroll,
    position: Math.round(nullishCoalescingWrapper(position, 0) * 1000),
    cue_point: Math.round(nullishCoalescingWrapper(targetBreak, 0) * 1000),
    ad_count: response.length,
    total_ads_duration: Math.round(response.reduce((prev, curr) => prev + curr.duration, 0) * 1000),
    reason,
    response_time: Math.round(nullishCoalescingWrapper(responseTime, 0) * 1000),
    video_id: nullishCoalescingWrapper(contentId, ''),
    message_map: convertObjectValueToString({
      stage: getVODPageSession().stage,
      scene,
      currentBreak,
      targetBreak,
      networkResponseTime,
      requestQueueTime,
      retries,
      bwwActive,
      controlsActive,
      videoResourceType,
      videoCodecType,
      currentVideoResolution,
      lastPositionDiff,
      lastPosition,
      breakEmittedAt,
      seekTypeBeforeFetch,
      seekTypeAfterFetch,
    }),
  };
  playerAnalyticsAdMissed(playerAnalyticsEventData);
}
