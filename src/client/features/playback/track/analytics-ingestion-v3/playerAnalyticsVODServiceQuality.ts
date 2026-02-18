import type { ValueOf } from 'ts-essentials';

import { PLAYER_ANALYTICS_EVENT_NAME } from 'common/constants/player-analytics-event';
import { trackAnalyticsIngestionV3 } from 'common/utils/trackAnalyticsIngestionV3';

import type { VideoResourceTypeToProto, VideoResourceCodecToProto, HDCPVersionToProto } from '../client-log/utils/convertToProto';

export type PlayerAnalyticsEventQualityOfService = {
  log_version: string;
  track_id: string;
  cffd: number;
  rc: number;
  last_ss: string;
  errc: number;
  first_errc: number;
  boc: number;
  bc: number;
  tbd: number;
  sc: number;
  tsd: number;
  tvt: number;
  tcrffd: number;
  ad_ac: number;
  ad_sfc: number;
  ad_eac: number;
  ad_taffd: number;
  ad_bac: number;
  ad_tabd: number;
  ad_tvt: number;
  is_ad: boolean;
  download_speed: number;
  download_frag_bitrate: number;
  cdn: string;
  resource_type: ValueOf<typeof VideoResourceTypeToProto>;
  hdcp: ValueOf<typeof HDCPVersionToProto>;
  codec: ValueOf<typeof VideoResourceCodecToProto>;
  content_id?: string;
  ad_imp: string;
  message?: string;
  message_map?: { [key: string]: string };
};

export function playerAnalyticsVODServiceQuality(data: PlayerAnalyticsEventQualityOfService) {
  trackAnalyticsIngestionV3({
    name: PLAYER_ANALYTICS_EVENT_NAME.QUALITY_OF_SERVICES,
    message: data,
  });
}
