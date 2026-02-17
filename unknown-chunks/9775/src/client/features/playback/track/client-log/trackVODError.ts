import { PLAYER_ERROR_DETAILS } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { getDisplayResolution } from 'common/utils/analytics';
import { trackLogging } from 'common/utils/track';

import { callbackBatcherFactory } from './utils/callbackBatcher';
import { convertErrorEventDataIntoErrorClientLog } from './utils/convertErrorEventDataIntoErrorClientLog';
import { getVODClientLogBaseInfo } from './utils/getVODClientLogBaseInfo';
import type { VODClientLogBaseParams } from './utils/types';
import { getVODPageSession } from '../../session/VODPageSession';

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

  const loggingCallback = (count: number) => trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.CONTENT_ERROR,
    message: {
      batchedErrorCount: count,
      ...convertErrorEventDataIntoErrorClientLog(error),
      ...getVODClientLogBaseInfo(VODInfo),
      stage: getVODPageSession().stage,
      features: playbackInfo.features,
      tvt: VODPlaybackSession.getInstance().updateViewTime().tvt * 1000,
      fallbackCount: playbackInfo.fallbackCount,
      track_id: playbackInfo.trackId,
      display_resolution: getDisplayResolution(),
      decoded_frames: totalVideoFrames,
      nudge_count: playbackInfo.nudgeCount,
    },
  });

  if (__OTTPLATFORM__ === 'XBOXONE') {
    rateLimitedScheduler(`${error.fatal}_${error.code}_${error.message}`, loggingCallback);
  } else {
    loggingCallback(1);
  }
}
