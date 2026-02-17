import type { Player } from '@adrise/player';
import { getClosestBufferedRanges } from '@adrise/player/lib/utils/tools';
import { now, timeDiffInSeconds } from '@adrise/utils/lib/time';
import pick from 'lodash/pick';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { getClientLogInfoForVideoDetail } from 'client/features/playback/track/client-log/utils/getClientLogInfoForVideoDetail';
import { isAppHidden } from 'client/systemApi/utils';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { getFormatResolution } from 'common/features/playback/utils/getFormatResolution';
import logger from 'common/helpers/logging';
import type { VideoResource } from 'common/types/video';
import { getDisplayResolution } from 'common/utils/analytics';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { toFixed2 } from 'common/utils/format';
import { trackLogging } from 'common/utils/track';

import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsPlayerPageExit } from '../analytics-ingestion-v3';
import { trackPlayerPageExitMetrics, type PlayerExitMetricsParam } from '../datadog';

export function trackPlayerPageExit({
  contentId,
  videoResource,
  player,
}: {
  contentId: string;
  videoResource?: VideoResource;
  player?: Player;
}) {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const {
    isAd,
    isPaused,
    isAdStalled,
    ads: adCountSinceEnterPlayerPage,
    contents: contentCountSinceEnterPlayerPage,
    lastError,
    lastAdError,
    hasErrorModal,
    startTs,
    lastAdTs,
    titleStartTs,
    stage,
    totalViewTime,
    cause,
    doubts,
    lastFeedback,
    utmSource,
    isAPPLaunchedFromDeepLink,
    hdmiConnectionStatus,
    pauseActionLevel,
  } = getVODPageSession();

  const adLagTime = player?.getAdLagTime?.() || -1;
  const contentBwEstimate = toFixed2(player?.getBandwidthEstimate?.() ?? -1);
  const bufferLength = toFixed2(player?.getBufferedLength?.() ?? -1);
  const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = player?.getQualityLevel?.() ?? {};
  const levels = (player?.getLevels?.() ?? []).reverse();
  const { width: minResolutionWidth = 0, height: minResolutionHeight = 0 } = levels[0] ?? {};
  const sdkInfo = player?.getSDKInfo?.();
  if (__OTTPLATFORM__ === 'COMCAST' && cause?.type === 'AD_NO_BUFFER' && sdkInfo && !sdkInfo.isStable) {
    logger.error('AD_NO_BUFFER');
  }
  const duration = player?.getDuration?.();
  const position = isAd ? player?.getAdPosition?.() : player?.getPosition?.();
  const positionWithMs = convertUnitWithMathRound(position, 1000);
  const videoBufferedArray = player?.getBufferedVideoRange?.() ?? [];
  const audioBufferedArray = player?.getBufferedAudioRange?.() ?? [];
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    feedback: lastFeedback,
    has_error_modal: hasErrorModal,
    content_counts: contentCountSinceEnterPlayerPage,
    ad_counts: adCountSinceEnterPlayerPage,
    is_ad: isAd,
    is_buffering: playbackInfo.isBuffering,
    stage,
    doubts,
    content_duration: convertUnitWithMathRound(duration, 1000), // millisecond
    current_position: positionWithMs !== undefined ? Math.min(positionWithMs, 2 ** 31 - 1) : undefined, // millisecond
  };
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.PLAYER_PAGE_EXIT,
    message: {
      ...playerAnalyticsData,
      cause,
      content_id: contentId,
      contentBwEstimate,
      playback_type: videoResource?.type,
      playback_codec: videoResource?.codec,
      max_video_resolution: videoResource?.resolution,
      min_video_resolution: getFormatResolution(minResolutionWidth, minResolutionHeight),
      current_video_resolution: getFormatResolution(currentResolutionWidth, currentResolutionHeight),
      hdcp_type: videoResource?.license_server?.hdcp_version,
      isPaused,
      pauseActionLevel,
      isAdStalled,
      lastError: lastError
        ? pick(lastError, ['type', 'code', 'message', 'details', 'fatal', 'reason'])
        : undefined,
      lastAdError: lastAdError
        ? pick(lastAdError, ['name', 'code', 'message', 'fatal', 'vastErrorCode'])
        : undefined,
      durationSinceEnterPlayerPage: timeDiffInSeconds(startTs, now()),
      ...(lastAdTs !== -1 && { durationToLastAd: timeDiffInSeconds(lastAdTs, now()) }),
      ...(titleStartTs !== -1 && { durationToStart: timeDiffInSeconds(titleStartTs, now()) }),
      ...(playbackInfo.bufferingTs !== -1 && ({ stalledDuration: timeDiffInSeconds(playbackInfo.isBuffering ? playbackInfo.bufferingTs : 0, now()) })),
      ...(playbackInfo.seekingTs !== -1 && ({ seekingDuration: timeDiffInSeconds(playbackInfo.isSeeking ? playbackInfo.seekingTs : 0, now()) })),
      ...(adLagTime !== -1 && ({ adLagTime })),
      ...getClientLogInfoForVideoDetail({
        videoResource,
        player,
      }),
      bufferedArrayNum: [videoBufferedArray.length, audioBufferedArray.length],
      closestVideoBufferedArray: getClosestBufferedRanges(videoBufferedArray, position ?? -1),
      closestAudioBufferedArray: getClosestBufferedRanges(audioBufferedArray, position ?? -1),
      bufferLength,
      utmSource,
      isAPPLaunchedFromDeepLink,
      hdmiConnectionStatus,
      isAppHidden: isAppHidden(),
      features: playbackInfo.features,
      app_version: playbackInfo.appVersion,
      cdn: playbackInfo.cdn,
      fallbackCount: playbackInfo.fallbackCount,
      displayResolution: getDisplayResolution(),
      sdk: sdkInfo,
      isAutoplay: playbackInfo.isAutoplay,
    },
  });
  playerAnalyticsPlayerPageExit({
    ...playerAnalyticsData,
    cause: cause?.type,
  });
  if (__ENABLE_PLAYER_EXIT_TO_DATADOG__) {
    const reportStageMap = {
      IN_STREAM: 'IN_STREAM',
    };
    const playerExitMetricsParam: PlayerExitMetricsParam = {
      hasError: !!lastError,
      stage: reportStageMap[stage],
      totalViewTime,
    };
    trackPlayerPageExitMetrics(playerExitMetricsParam);
  }
}
