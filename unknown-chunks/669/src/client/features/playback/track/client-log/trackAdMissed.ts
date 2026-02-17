import type { AdMissedEvent } from '@adrise/player';
import { sendVASTNotUsedBeacon } from '@adrise/player';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { trackAdBeaconFailed } from './trackAdBeaconFailed';

export enum AdMissedReason {
  AUTOPLAY = 'autoPlay',
  SEEKING = 'seeking',
  EXIT_BEFORE_RESPONSE = 'exitBeforeResponse',
  EXIT_BEFORE_PLAYBACK = 'exitBeforePlayback',
  EXIT_DURING_PLAYBACK = 'exitDuringPlayback',
}

type TrackAdMissedMessage = AdMissedEvent & {
  position: number | undefined;
};

export function trackAdMissed(data: TrackAdMissedMessage) {
  const { response, reason, currentBreak, targetBreak, detail, adSequence = 0, metrics, position } = data;
  const { responseTime, networkResponseTime, requestQueueTime, retries = 0 } = metrics || {};
  if (!response) return;
  sendVASTNotUsedBeacon(response, reason, adSequence, (err) => {
    trackAdBeaconFailed(err, { type: 'notUsed' });
  });
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.AD.AD_MISSED,
    message: {
      position: position || 0,
      reason,
      adCount: response.length,
      duration: response.reduce((prev, curr) => prev + curr.duration, 0),
      stage: getVODPageSession().stage,
      detail,
      currentBreak,
      targetBreak,
      responseTime,
      networkResponseTime,
      requestQueueTime,
      retries,
    },
  });
}
