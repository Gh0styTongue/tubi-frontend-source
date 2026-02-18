import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventLiveContentStartupPerformance = {
  track_id: string;
  video_id?: string;
  video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  manifest_loaded_time?: number; // milliseconds
  variant_loaded_time?: number; // milliseconds
  first_frame_time?: number; // milliseconds
  frag_loaded_time?: number; // milliseconds
  player_type: number; // 0: UNSPECIFIED, 1: DEFAULT, 2: BANNER
  ssai_version: number; // 0: UNSPECIFIED, 1: APOLLO, 2: YOUSPACE
  max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  current_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  network_type?: string;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsLiveContentStartupPerformance(data: PlayerAnalyticsEventLiveContentStartupPerformance) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.LIVE_CONTENT_STARTUP_PERFORMANCE,
    message: data,
  });
}
