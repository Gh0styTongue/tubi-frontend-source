import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventLiveQualityOfServices = {
  track_id: string;
  cffd?: number; // content_first_frame_duration, milliseconds
  last_ss?: string; // last_start_step
  errc?: number; // error_code
  first_errc?: number; // first_error_code
  boc?: number; // break_off_count
  bc?: number; // buffering_count
  tbd?: number; // total_buffering_duration, milliseconds
  tvt?: number; // total_view_time, milliseconds
  download_speed?: number; // kbps
  download_frag_bitrate?: number; // kbps
  cdn?: string;
  resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  codec: ValueOf<typeof VideoResourceCodecToProto>;
  content_id?: string;
  player_type: number; // 0: UNSPECIFIED, 1: DEFAULT, 2: BANNER
  ssai_version: number; // 0: UNSPECIFIED, 1: APOLLO, 2: YOUSPACE
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsLiveQualityOfServices(data: PlayerAnalyticsEventLiveQualityOfServices) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.LIVE_QUALITY_OF_SERVICES,
    message: data,
  });
}
