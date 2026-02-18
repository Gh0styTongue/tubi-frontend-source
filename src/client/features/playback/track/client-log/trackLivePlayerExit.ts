import { now, timeDiffInSeconds } from '@adrise/utils/lib/time';
import pick from 'lodash/pick';

import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { trackLivePlayerExitMetrics } from 'client/features/playback/track/datadog';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { getLinearPageType } from 'common/utils/linearPageType';
import { trackLogging } from 'common/utils/track';

export function trackLivePlayerExit({
  contentId,
}: {
  contentId: string,
}) {
  const {
    stage,
    isAd,
    isPaused,
    adsCount,
    lastError,
    hasErrorModal,
    startTimestamp,
    withEPGDuration,
    previewDuration,
    fullscreenDuration,
    isFullscreen,
    pauseCause,
    errorModalResolved,
    errorModalCount,
    passiveExitCause,
    stallDuration,
    stallCount,
  } = getLiveVideoSession();
  const isValidPlayback = fullscreenDuration > 0 && fullscreenDuration > (withEPGDuration + previewDuration);
  // We don't want to log too many short video sessions
  if (!isValidPlayback) return;

  const durationSinceEnterChannel = timeDiffInSeconds(startTimestamp, now());

  let stallDurationPer100Sec;
  let stallCountPer100Sec;
  let perStallTime;

  if (stallCount > 0) {
    /**
     * Stall duration or stall count divides durationSinceEnterChannel
     * to get the result in unit per second. Then multiply 100 to
     * make it per 100 seconds
     */
    stallDurationPer100Sec = (stallDuration / 1000) / durationSinceEnterChannel * 100;
    stallCountPer100Sec = stallCount / durationSinceEnterChannel * 100;
    perStallTime = stallDuration / stallCount;
  } else {
    stallDurationPer100Sec = 0;
    stallCountPer100Sec = 0;
    perStallTime = 0;
  }

  stallDurationPer100Sec = stallDurationPer100Sec.toFixed(2);
  stallCountPer100Sec = stallCountPer100Sec.toFixed(2);
  perStallTime = perStallTime.toFixed(2);

  const message = {
    stage,
    content_id: contentId,
    isAd,
    isPaused,
    adsCount,
    lastError: lastError
      ? pick(lastError, ['type', 'code', 'message', 'details', 'fatal', 'reason'])
      : undefined,
    hasErrorModal,
    durationSinceEnterChannel,
    isValidPlayback,
    fullscreenDuration,
    isFullscreen,
    pauseCause,
    errorModalResolved,
    errorModalCount,
    passiveExitCause,
    stallCount,
    stallDuration,
    stallDurationPer100Sec,
    stallCountPer100Sec,
    perStallTime,
    pageType: getLinearPageType(),
  };
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_PLAYER_EXIT,
    message,
  });

  if (__ENABLE_PLAYER_EXIT_TO_DATADOG__) {
    trackLivePlayerExitMetrics({
      hasError: !!lastError,
      stage: message.stage,
      totalViewTime: message.durationSinceEnterChannel,
    });
  }
}
