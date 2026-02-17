import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import type { UapiPlatformType } from 'common/constants/platforms';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { SeriesEpisodesResponse } from 'common/types/series';
import type StoreState from 'common/types/storeState';
import type { ThumbnailSpritesBase, VideoResourceType, VideosResponseBody } from 'common/types/video';
import { trimSeriesId } from 'common/utils/dataFormatter';
import { getFailSafeHeaders } from 'common/utils/failsafe';
import { mockAirDateTimeForContent } from 'common/utils/tensorMockData';

const apiConfig = getApiConfig();

const API_VERSION = '~5.0.0';
// To get the sports event
const CAPABILITY_HEADER_FOR_SPORTS_EVENT = '{"content_types":["se"]}';

export interface LoadContentsByIdsRequestData {
  app_id: 'tubitv';
  platform: UapiPlatformType;
  user_id?: number;
  device_id?: string;
  images: Record<string, string>;
  limit_resolutions?: string[];
  video_resources?: VideoResourceType[];
  // content_ids should be string[] then converted to a comma separated string
  // ['123', '456', '789'] -> '123,456,789'
  content_ids: string;
}

export function makeLoadContentsByIdsRequest(dispatch: TubiThunkDispatch, data: LoadContentsByIdsRequestData, state: StoreState) {
  return dispatch(fetchWithToken<VideosResponseBody>(
    `${apiConfig.cmsPrefixV2}/contents`,
    {
      method: 'get',
      params: data as Record<string, any>,
      qsStringifyOptions: {
        arrayFormat: 'brackets',
      },
      headers: {
        'Accept-Version': API_VERSION,
        'x-capability': CAPABILITY_HEADER_FOR_SPORTS_EVENT,
        ...getFailSafeHeaders(state),
      },
    }
  ));
}

export interface LoadSeriesEpisodesData {
  platform: UapiPlatformType;
  seriesId: string;
}

export function makeLoadSeriesEpisodesRequest(dispatch: TubiThunkDispatch, data: LoadSeriesEpisodesData, state: StoreState) {
  const seriesId = trimSeriesId(data.seriesId);
  delete (data as any).seriesId;
  return dispatch(fetchWithToken<SeriesEpisodesResponse>(
    `${apiConfig.contentServicePrefix}/cms/series/${seriesId}/episodes`,
    {
      method: 'get',
      params: data as Record<string, any>,
      headers: getFailSafeHeaders(state),
    }
  ));
}

export interface LoadThumbnailSpritesData {
  app_id: 'tubitv';
  platform: UapiPlatformType;
  page_enabled: false;
  device_id?: string;
  type?: string;
  contentId: string;
}

export function makeLoadThumbnailSpritesRequest(dispatch: TubiThunkDispatch, data: LoadThumbnailSpritesData, state: StoreState): Promise<ThumbnailSpritesBase> {
  const content_id = data.contentId;
  delete (data as any).contentId;
  const type = data.type || '5x';
  data.type = type;

  return dispatch(fetchWithToken<ThumbnailSpritesBase>(
    `${apiConfig.cmsPrefix}/content/${content_id}/thumbnail_sprites`,
    {
      method: 'get',
      params: data as Record<string, any>,
      headers: getFailSafeHeaders(state),
    }
  ));
}

export interface LoadVideoContentByIdData {
  app_id?: 'tubitv';
  platform?: UapiPlatformType;
  content_id: string;
  include_channels?: boolean
  video_resources?: VideoResourceType[];
  limit_resolutions?: string[]
  images?: Record<string, string>;
  is_kids_mode?: boolean;
  device_id?: string;
  pagination?: {
    season: string | number;
    page_in_season: number;
    page_size_in_season: number;
    fields?: string
  }
}

export function makeLoadVideoContentById(dispatch: TubiThunkDispatch, data: LoadVideoContentByIdData, clientConfig: Record<string, any>, state: StoreState) {
  return dispatch(fetchWithToken<any>(
    `${apiConfig.cmsPrefixV2}/content`,
    {
      method: 'get',
      params: data as Record<string, any>,
      qsStringifyOptions: {
        arrayFormat: 'brackets',
      },
      headers: {
        'Accept-Version': API_VERSION,
        'x-capability': CAPABILITY_HEADER_FOR_SPORTS_EVENT,
        ...getFailSafeHeaders(state),
      },
      ...clientConfig,
    }
  )).then((result) => {
    /* istanbul ignore next */
    if (!__PRODUCTION__ || __IS_ALPHA_ENV__) {
      mockAirDateTimeForContent(result);
    }
    return result;
  });
}
