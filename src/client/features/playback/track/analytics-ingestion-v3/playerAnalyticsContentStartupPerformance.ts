import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventContentStartupPerformance = {
  track_id: string;
  video_id: string;
  video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  start_position: number;
  is_after_ad: boolean;
  is_from_preroll: boolean;
  first_frame_time: number;
  frag_loaded_time: number;
  variant_loaded_time: number;
  manifest_loaded_time: number;
  max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  current_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsContentStartupPerformance(data: PlayerAnalyticsEventContentStartupPerformance) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.CONTENT_STARTUP_PERFORMANCE,
    message: data,
  });
}
