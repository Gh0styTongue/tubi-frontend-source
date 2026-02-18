import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventLiveContentStart = {
  track_id: string;
  video_id?: string;
  video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  current_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  player_type: number; // 0: UNSPECIFIED, 1: DEFAULT, 2: BANNER
  ssai_version: number; // 0: UNSPECIFIED, 1: APOLLO, 2: YOUSPACE
  network_type?: string;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsLiveContentStart(data: PlayerAnalyticsEventLiveContentStart) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.LIVE_CONTENT_START,
    message: data,
  });
}
