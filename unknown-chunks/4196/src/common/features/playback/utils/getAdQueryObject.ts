import type { QueryStringParams } from '@adrise/utils/lib/queryString';
import type { AppMode } from '@tubitv/analytics/lib/client';
import omitBy from 'lodash/omitBy';

import { getDeviceLanguage } from 'client/utils/language';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import type { DeviceDeal } from 'common/types/ottSystem';
import type { VIDEO_RESOURCE_CODEC, VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';
import { isNullishOrEmpty } from 'common/utils/isNullishOrEmpty';

import type { AdOrigin } from './adOrigin';
import { constrainNowPosition } from './constrainNowPosition';

export interface GetAdUrlOptions {
  advertiserId?: string;
  advertiserOptOut?: 0 | 1;
  adAttributes?: string;
  advertiserUSPrivacy?: string;
  contentId: string;
  deviceDeal?: DeviceDeal;
  deviceId?: string;
  isd?: string;
  mvpd?: string;
  partnerId?: string;
  position?: number;
  publisherId: string;
  query?: boolean;
  rsd?: string;
  sponExp?: string;
  userId?: number | string;
  appMode?: AppMode;
  zipcode?: string;
  resumeType?: string;
  vauth?: string;
  adCode?: string;
  origin: AdOrigin;
  containerId?: string;
  addGDPRQuery?: boolean;
  tivo_platform?: string;
  video_codec?: VIDEO_RESOURCE_CODEC;
  video_resolution?: VIDEO_RESOURCE_RESOLUTION;
}

export interface GetAdQueryParams {
  ad_attributes?: string;
  ad_code?: string;
  adv_id?: string;
  app_id: string
  app_mode?: AppMode,
  content_id: string,
  content_type: 'mp4',
  coppa_enabled?: boolean,
  device_deal?: DeviceDeal,
  device_id?: string,
  isd?: string,
  language?: string | null,
  model?: string;
  mvpd?: string,
  now_pos: number,
  opt_out?: 0 | 1,
  us_privacy?: string,
  postal_code?: string,
  pub_id: string,
  rsd?: string,
  spon_exp?: string;
  user_id?: number | string,
  origin: AdOrigin;
  container_id?: string,
  resume_from?: string;
  tivo_platform?: string,
  vauth?: string;
  video_type?: 'mp4' | 'hls',
  vpaid_enabled: false;
  video_codec?: VIDEO_RESOURCE_CODEC;
  video_resolution?: VIDEO_RESOURCE_RESOLUTION;
}

interface ExtraAdParams {
  useIPv4OnlyServer?: boolean;
  needAuth?: boolean;
}

export interface GetOTTAdUrlOptions extends ExtraAdParams, GetAdUrlOptions {
  // using an interface instead of type Foo = Bar & Baz because it is a little faster for the TS compiler
}

export const getAdQueryObject = ({
  adAttributes,
  advertiserId,
  advertiserOptOut,
  advertiserUSPrivacy,
  contentId,
  deviceDeal,
  deviceId,
  isd,
  mvpd,
  partnerId,
  position = 0,
  publisherId,
  rsd,
  sponExp,
  userId,
  zipcode,
  appMode,
  resumeType,
  vauth,
  adCode,
  origin,
  containerId,
  addGDPRQuery = true,
  tivo_platform,
  video_codec,
  video_resolution,
}: GetAdUrlOptions): QueryStringParams<GetAdQueryParams> => {

  const nowPos = constrainNowPosition(position);
  let gdprQuery = {};
  if (addGDPRQuery) {
    gdprQuery = OnetrustClient.getRainmakerParams().query;
  }

  return omitBy<GetAdQueryParams>({
    adv_id: advertiserId,
    app_id: 'tubitv',
    app_mode: appMode,
    ad_attributes: adAttributes,
    content_id: contentId,
    content_type: 'mp4',
    device_deal: deviceDeal,
    device_id: deviceId,
    isd,
    language: getDeviceLanguage(),
    model: partnerId,
    mvpd,
    now_pos: nowPos,
    opt_out: advertiserOptOut,
    us_privacy: advertiserUSPrivacy,
    postal_code: zipcode,
    pub_id: publisherId,
    rsd,
    spon_exp: sponExp,
    user_id: userId,
    vpaid_enabled: false,
    resume_from: resumeType,
    vauth,
    ad_code: adCode,
    origin,
    container_id: containerId,
    tivo_platform,
    video_codec,
    video_resolution,
    ...gdprQuery,
  }, isNullishOrEmpty) as QueryStringParams<GetAdQueryParams>;
};
