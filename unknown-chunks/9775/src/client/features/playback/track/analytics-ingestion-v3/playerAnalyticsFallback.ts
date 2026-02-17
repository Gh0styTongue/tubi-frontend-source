import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/track';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto, HDCPVersionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventFallback = {
  track_id: string;
  video_id: string;
  type: string;
  failed_video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  failed_video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  failed_hdcp_version: ValueOf<typeof HDCPVersionToProto>;
  failed_max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  failed_url: string;
  fallback_video_resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  fallback_video_codec_type: ValueOf<typeof VideoResourceCodecToProto>;
  fallback_hdcp_version: ValueOf<typeof HDCPVersionToProto>;
  fallback_max_video_resolution: ValueOf<typeof VideoResolutionToProto>;
  fallback_url: string;
};

export function playerAnalyticsFallback(data: PlayerAnalyticsEventFallback) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.FALLBACK,
    message: data,
  });
}
