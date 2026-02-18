import type {
  Player,
  FragDownloadInfo,
} from '@adrise/player';
import {
  MAX_BUFFER_HOLE_TO_SKIP,
} from '@adrise/player/lib/constants';
import {
  getClosestBufferedRanges,
  getBufferedInfo,
} from '@adrise/player/lib/utils/tools';
import { getFormatResolution } from '@adrise/utils/lib/getFormatResolution';
import { now, timeDiffInSeconds } from '@adrise/utils/lib/time';
import { toFixed2 } from '@adrise/utils/lib/tools';
import pick from 'lodash/pick';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { isAppHidden } from 'client/systemApi/utils';
import type { VideoResource } from 'common/types/video';
import { getDisplayResolution } from 'common/utils/analytics';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';

import { playerAnalyticsPlayerPageExit } from '../analytics-ingestion-v3';
import { trackPlayerPageExitMetrics, type PlayerExitMetricsParam } from '../datadog';
import { getPlayerDisplayType } from './utils/getPlayerDisplayType';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

const HIGH_EXIT_ERROR_THRESHOLD = 30;

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
    isPaused,
    isAdStalled,
    ads: adCountSinceEnterPlayerPage,
    contents: contentCountSinceEnterPlayerPage,
    lastError,
    lastAdError,
    hasErrorModal,
    startTs,
    stage,
    subStage,
    totalViewTime,
    cause,
    doubts,
    lastFeedback,
    utmSource,
    isAPPLaunchedFromDeepLink,
    hdmiConnectionStatus,
    pauseActionLevel,
    adPauseInfo,
    playbackSourceType,
    isExtensionReady,
    isAd,
    isPrefetchAds,
  } = getVODPageSession();

  const isAdPlayer = player?.isAd?.() ?? false;
  const adLagTime = player?.getAdLagTime?.() || -1;
  const contentBwEstimate = toFixed2(player?.getBandwidthEstimate?.() ?? -1);
  const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = player?.getQualityLevel?.() ?? {};
  const levels = (player?.getLevels?.() ?? []).reverse();
  const { width: minResolutionWidth = 0, height: minResolutionHeight = 0 } = levels[0] ?? {};
  const sdkInfo = player?.getSDKInfo?.();
  const duration = player?.getDuration?.();
  const adDuration = player?.getAdDuration?.();
  const position = isAdPlayer ? player?.getAdPosition?.() : player?.getPosition?.();
  const positionWithMs = convertUnitWithMathRound(position, 1000);
  const videoBufferedArray = player?.getBufferedVideoRange?.() ?? [];
  const audioBufferedArray = player?.getBufferedAudioRange?.() ?? [];
  const noFragsLoading = (videoResource?.type === 'hlsv3' ? ['video'] : ['video', 'audio']).every((type) => {
    const fragDownloadInfo = player?.getFragDownloadInfo?.();
    const fragList = fragDownloadInfo?.[type as keyof FragDownloadInfo];
    return fragList && fragList.length > 0 && fragList.every(item => item.downloadDuration !== -1);
  });
  const bufferedInfo = !isAdPlayer && player && position !== undefined ? getBufferedInfo(
    player.getBufferedRange(),
    position,
    0,
  ) : undefined;
  const isBufferHole = playbackInfo.isBuffering && bufferedInfo?.bufferHole !== undefined && bufferedInfo.bufferHole <= MAX_BUFFER_HOLE_TO_SKIP;
  const isHighExitError = lastError?.fatal && lastError?.recv_time && (now() - lastError?.recv_time <= HIGH_EXIT_ERROR_THRESHOLD);
  const lastErrorWithHighExitFlag = lastError ? { ...lastError, isHighExitError: !!isHighExitError } : undefined;
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    feedback: lastFeedback,
    has_error_modal: hasErrorModal,
    content_counts: contentCountSinceEnterPlayerPage,
    ad_counts: adCountSinceEnterPlayerPage,
    is_ad: isAd,
    is_buffering: isAd ? playbackInfo.isAdBuffering : playbackInfo.isBuffering,
    stage,
    doubts,
    content_duration: convertUnitWithMathRound(duration, 1000), // millisecond
    current_position: positionWithMs !== undefined ? Math.min(positionWithMs, 2 ** 31 - 1) : undefined, // millisecond
    cause: cause?.type,
    message_map: convertObjectValueToString({
      content_id: contentId,
      subStage,
      contentBwEstimate,
      playback_type: videoResource?.type,
      playback_codec: videoResource?.codec,
      hdcp_type: videoResource?.license_server?.hdcp_version,
      max_video_resolution: videoResource?.resolution,
      min_video_resolution: getFormatResolution(minResolutionWidth, minResolutionHeight),
      current_video_resolution: getFormatResolution(currentResolutionWidth, currentResolutionHeight),
      isPaused,
      pauseActionLevel,
      causeMessage: cause?.message,
      isAdStalled,
      lastError: lastErrorWithHighExitFlag
        ? pick(lastErrorWithHighExitFlag, ['type', 'code', 'message', 'details', 'fatal', 'reason', 'isHighExitError'])
        : undefined,
      lastAdError: lastAdError
        ? pick(lastAdError, ['name', 'code', 'message', 'fatal', 'vastErrorCode'])
        : undefined,
      ...(isAdPlayer && { ad_duration: adDuration }),
      durationSinceEnterPlayerPage: timeDiffInSeconds(startTs, now()),
      ...(playbackInfo.bufferingTs !== -1 && ({ stalledDuration: timeDiffInSeconds(playbackInfo.isBuffering ? playbackInfo.bufferingTs : 0, now()) })),
      ...(playbackInfo.currentSeekInfo && ({ seekingDuration: timeDiffInSeconds(playbackInfo.currentSeekInfo.startTime, now()) })),
      ...(adLagTime !== -1 && ({ adLagTime })),
      closestVideoBufferedArray: getClosestBufferedRanges(videoBufferedArray, position ?? -1),
      closestAudioBufferedArray: getClosestBufferedRanges(audioBufferedArray, position ?? -1),
      ...(playbackInfo.isBuffering && { bufferingType: playbackInfo.bufferingType }),
      ...(playbackInfo.isBuffering && { bufferingDataState: playbackInfo.bufferingDataState }),
      isBufferHole,
      noFragsLoading,
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
      adPauseInfo,
      playbackSourceType,
      bwwPeekRowImpressionCount: getVODPageSession().bwwPeekRowImpressionCount,
      bwwOpenCount: getVODPageSession().bwwOpenCount,
      bwwConvertCount: getVODPageSession().bwwConvertCount,
      isExtensionReady,
      player_type: getPlayerDisplayType(playbackInfo.playerDisplayMode),
      isPrefetchAds,
    }),
  };
  playerAnalyticsPlayerPageExit(playerAnalyticsData);
  if (__ENABLE_PLAYER_EXIT_TO_DATADOG__) {
    const reportStageMap: Record<string, string> = {
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
