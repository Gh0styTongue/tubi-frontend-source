import systemApi from 'client/systemApi';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import type { PlayerSource } from 'common/constants/player';
import { trackLogging } from 'common/utils/track';

export async function trackBackgroundPlayback({
  source,
  duration,
  condition,
  interaction,
  suspiciousDuration,
}: {
  source: PlayerSource;
  duration: number;
  condition: 'HDMI' | 'visibility';
  interaction: number;
  suspiciousDuration: number;
}) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.BACKGROUND_PLAYBACK,
    message: {
      source,
      duration,
      condition,
      interaction,
      suspiciousDuration,
      device: systemApi.getDeviceType(),
      info: condition === 'HDMI' ? {
        value: await systemApi.isHDMIConnected(),
        api: await systemApi.getHDMIState(),
      } : undefined,
    },
  });
}
