import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/track';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventContentStart = {
  track_id: string;
  video_id: string;
  video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  start_position: number;
  is_after_ad: boolean;
  is_from_preroll: boolean;
  is_from_autoplay: boolean;
  max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  current_video_resolution: ValueOf<typeof VideoResolutionToProto>;
};

export function playerAnalyticsContentStart(data: PlayerAnalyticsEventContentStart) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.CONTENT_START,
    message: data,
  });
}
