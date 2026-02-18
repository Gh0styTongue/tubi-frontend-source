import type { Player } from '@adrise/player';
import { toFixed2 } from '@adrise/utils/lib/tools';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import type {
  QoSErrorCodeValues,
  QoSErrorTypeValues } from 'client/features/playback/utils/convertErrorToUnifiedEnum';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { getVODPageSession } from '../../session/VODPageSession';

export function trackErrorModalShow({
  player,
  errorMessage,
  errt,
  errc,
}: {
  player?: Player,
  errorMessage?: string;
  errt: QoSErrorTypeValues;
  errc: QoSErrorCodeValues;
}): void {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const bufferLength = toFixed2(player?.getBufferedLength?.() ?? -1);
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.ERROR_MODAL_SHOW,
    message: {
      errorMessage,
      errt,
      errc,
      stage: getVODPageSession().stage,
      features: playbackInfo.features,
      bufferLength,
      tvt: VODPlaybackSession.getInstance().updateViewTime().tvt * 1000,
      fallbackCount: playbackInfo.fallbackCount,
      track_id: playbackInfo.trackId,
    },
  });
}
