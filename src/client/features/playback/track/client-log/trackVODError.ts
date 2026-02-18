import { PLAYER_ERROR_DETAILS } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import logger from 'common/helpers/logging';
import { getDisplayResolution } from 'common/utils/analytics';
import { convertUnitWithMathRound } from 'common/utils/convertUnitWithMathRound';
import { convertObjectValueToString } from 'common/utils/format';

import { callbackBatcherFactory } from './utils/callbackBatcher';
import { convertErrorEventDataIntoErrorClientLog } from './utils/convertErrorEventDataIntoErrorClientLog';
import { getVODClientLogBaseInfo } from './utils/getVODClientLogBaseInfo';
import { PLAYER_ANALYTICS_EVENT_VERSION, type VODClientLogBaseParams } from './utils/types';
import { getVODPageSession } from '../../session/VODPageSession';
import { convertErrorToUnifiedEnum } from '../../utils/convertErrorToUnifiedEnum';
import { type PlayerAnalyticsEventVODErrors, playerAnalyticsVODErrors } from '../analytics-ingestion-v3/playerAnalyticsVODErrors';

const vizioProblematicDevicesFragments = [
  'FW/1.511.8.5-1',
  'FW/3.511.8.5-1',
  'FW/5.511.9.3-1',
];

const errorMessageBlockMap: {
  [p in OTTPLATFORM]?: {
    [error: string]: string[] | number,
  };
} = {
  VIZIO: {
    [PLAYER_ERROR_DETAILS.BUFFER_APPEND_ERROR]: vizioProblematicDevicesFragments,
    [PLAYER_ERROR_DETAILS.BUFFER_APPENDING_ERROR]: vizioProblematicDevicesFragments,
  },
};

const errorBlockCounts: { [error: string]: number } = {};

/* istanbul ignore next */
function shouldBlockVodError(error: ErrorEventData): boolean {
  const message = error.message ?? '';
  const fragments = errorMessageBlockMap[__OTTPLATFORM__]?.[message];
  if (Array.isArray(fragments)) {
    for (const fragment of fragments) {
      if (window.navigator.userAgent.includes(fragment)) {
        errorBlockCounts[message] = (errorBlockCounts[message] ?? 0) + 1;
        return errorBlockCounts[message] % 1000 !== 0;
      }
    }
  }
  return false;
}

// This class instance lives in a global scope as it needs to be re-used
// across trackVODError calls
const [rateLimitedScheduler] = callbackBatcherFactory({ maxTokens: 5, tokenRate: 5000 });

export function trackVODError(
  error: ErrorEventData,
  VODInfo: VODClientLogBaseParams,
) {
  if (shouldBlockVodError(error)) {
    return;
  }

  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const { totalVideoFrames } = VODInfo.playerInstance?.getVideoPlaybackQuality?.() ?? {};
  const { stage, totalContents } = getVODPageSession();

  const clientLogBaseInfo = getVODClientLogBaseInfo(VODInfo);
  const { position, content_id, ...otherClientLogBaseInfo } = clientLogBaseInfo;
  const positionWithMs = typeof position === 'number' && position >= 0 ? convertUnitWithMathRound(position, 1000) as number : -1;
  const convertErrorEventData = convertErrorEventDataIntoErrorClientLog(error);
  const { fatal, ...otherErrorEventData } = convertErrorEventData;
  const { errorCode } = convertErrorToUnifiedEnum(error);
  const loggingCallback = (count: number) => {
    const playerAnalyticsVODErrorData: PlayerAnalyticsEventVODErrors = {
      log_version: PLAYER_ANALYTICS_EVENT_VERSION,
      track_id: playbackInfo.trackId,
      position: Math.min(positionWithMs, 2 ** 31 - 1),
      tvt: playbackInfo.playbackViewTime * 1000,
      error_code: errorCode,
      error_details: error.details,
      fatal,
      video_id: content_id,
      message_map: convertObjectValueToString({
        batchedErrorCount: count,
        ...otherClientLogBaseInfo,
        ...otherErrorEventData,
        stage,
        total_content_counts: totalContents,
        features: playbackInfo.features,
        fallbackCount: playbackInfo.fallbackCount,
        display_resolution: getDisplayResolution(),
        decoded_frames: totalVideoFrames,
        nudge_count: playbackInfo.nudgeCount,
        device_model: playbackInfo.deviceModel,
        isAutoplay: playbackInfo.isAutoplay,
        app_version: playbackInfo.appVersion,
      }),
    };
    playerAnalyticsVODErrors(playerAnalyticsVODErrorData);
  };
  /* istanbul ignore next */
  if (__OTTPLATFORM__ === 'TIZEN' && error.code === 'MEDIA_ERR_DECODE') {
    logger.error(error.err);
  }

  if (__OTTPLATFORM__ === 'XBOXONE') {
    rateLimitedScheduler(`${error.fatal}_${error.code}_${error.message}`, loggingCallback);
  } else {
    loggingCallback(1);
  }
}
