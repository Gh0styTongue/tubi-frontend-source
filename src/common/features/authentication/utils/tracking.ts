import { TRACK_LOGGING } from 'common/constants/error-types';
import type { PlatformUppercase } from 'common/constants/platforms';
import { trackLogging } from 'common/utils/track';

interface TrackRequestTimeParams {
  startTime: number;
  endpoint: string;
  sampleRate?: number;
  platform: PlatformUppercase;
}

export const trackRequestTime = ({ platform, startTime, endpoint, sampleRate = 0.2 }: TrackRequestTimeParams) => {
  if (__OTTPLATFORM__ !== platform || Math.random() > sampleRate) {
    return;
  }

  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: 'trackRequestTime',
    message: {
      endpoint,
      time: Date.now() - startTime,
    },
  });
};
