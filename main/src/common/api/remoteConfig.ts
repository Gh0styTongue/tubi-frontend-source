import getConfig from 'common/apiConfig';
import type { UapiPlatformType } from 'common/constants/platforms';
import type ApiClient from 'common/helpers/ApiClient';
import FeatureSwitchManager, { DEFAULT_VALUE } from 'common/services/FeatureSwitchManager';
import type StoreState from 'common/types/storeState';
import { getFailSafeHeaders } from 'common/utils/failsafe';
import type { SUPPORTED_COUNTRY } from 'i18n/constants';

export type RemoteConfigParams = {
  platform: UapiPlatformType;
  device_id: string;
  fakeCountry?: string;
};

export type RemoteConfig = {
  auth_comcast_email_prefill_enabled?: boolean;
  auth_google_onetap_enabled?: boolean;
  auth_login_with_amazon_enabled?: boolean;
  auth_magic_link_enabled?: boolean;
  auth_vizio_email_prefill_enabled?: boolean;
  blocked_analytics_events_mapping: Record<string, string[]>;
  blocked_analytics_events: string[];
  client_log_enabled: number;
  player_analytics_event_enabled: number;
  country: string;
  enable_kidsmode: boolean;
  enable_movie_mode: boolean;
  enable_parental_control: boolean;
  enable_tv_mode: boolean;
  intro_action_video_ids: number[];
  intro_comedy_video_ids: number[];
  intro_drama_video_ids: number[];
  intro_horror_video_ids: number[];
  intro_kids_video_ids: number[];
  intro_landscape_hibpr: string;
  intro_landscape_lowbpr: string;
  intro_portrait_hibpr_all_devices: string;
  intro_portrait_hibpr_exclusive: string;
  intro_portrait_hibpr_largest: string;
  intro_portrait_hibpr: string;
  intro_portrait_lowbpr: string;
  intro_romance_video_ids: number[];
  is_in_blocked_country: boolean;
  live_performance_metric_enabled: number;
  livetv: boolean;
  privacy_policy_qr_code_url: string;
  privacy_policy_url: string;
  rainmaker_enabled: number;
  ratings_limit: string[];
  server_time: number;
  terms_of_use_qr_code_url: string;
  terms_of_use_url: string;
  vod_performance_metric_enabled: number;
  vpaid_old_url: string;
  vpaid_url: string;
  youbora_enabled: number;
  youbora: { vod: number; preview: number; linear: number; trailer: number };
};

export const fetchRemoteConfig = (
  client: ApiClient,
  platform: UapiPlatformType,
  deviceId: string,
  state: StoreState
): Promise<RemoteConfig> => {
  const params: RemoteConfigParams = {
    platform,
    device_id: deviceId,
  };

  if (__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__) {
    const fakeCountry = FeatureSwitchManager.get('Country') as SUPPORTED_COUNTRY | typeof DEFAULT_VALUE;
    if (fakeCountry && fakeCountry !== DEFAULT_VALUE) {
      params.fakeCountry = fakeCountry;
    }
  }

  return client.get(`${getConfig().configHubPrefix}/api/v1/remote_config/${platform}`, { params, headers: getFailSafeHeaders(state) });
};
