import type { CapLevelOnFPSDropEventData, Player } from '@adrise/player/lib';

import { getClientLogInfoForVideoDetail } from 'client/features/playback/track/client-log/utils/getClientLogInfoForVideoDetail';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import type { VideoResource } from 'common/types/video';
import { trackLogging } from 'common/utils/track';

export function trackCapLevelOnFPSDrop({
  contentId,
  videoResource,
  player,
  data,
}: {
  contentId: string;
  videoResource: VideoResource | undefined;
  player: Player;
  data: CapLevelOnFPSDropEventData,
}) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.CAP_LEVEL_ON_FPS_DROP,
    message: {
      content_id: contentId,
      SDKVersion: player.SDKVersion,
      ...data,
      ...getClientLogInfoForVideoDetail({
        videoResource,
        player,
        customizedName: {
          type: 'playbackType',
          codec: 'playbackCodec',
          resolution: 'playbackResolution',
        },
      }),
    },
  });
}
