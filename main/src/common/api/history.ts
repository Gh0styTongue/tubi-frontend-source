import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import type { UapiPlatformType } from 'common/constants/platforms';
import type { HistoryResponseBody, HistoryResponseBodyContent } from 'common/types/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

const apiConfig = getApiConfig();

export interface AddHistoryRequestData {
  content_id: number;
  content_type: string;
  position: number;
  platform: UapiPlatformType;
  parent_id?: string;
  user_id?: number;
  device_id?: string;
}

export function makeAddHistoryRequest(dispatch: TubiThunkDispatch, data: AddHistoryRequestData) {
  return dispatch(fetchWithToken(
    apiConfig.uapi.history,
    {
      method: 'post',
      data: data as Record<string, any>,
    }
  ));
}

export function makeRemoveHistoryRequest(dispatch: TubiThunkDispatch, contentId: string) {
  return dispatch(fetchWithToken(
    `${apiConfig.uapi.history}/${contentId}`,
    {
      method: 'del',
    }
  ));
}

export interface LoadHistoryRequestData {
  page_enabled: boolean;
  expand: boolean;
  platform: UapiPlatformType;
  deviceId?: string;
}

export function makeLoadHistoryRequest(dispatch: TubiThunkDispatch, data: LoadHistoryRequestData) {
  return dispatch(fetchWithToken<HistoryResponseBody>(
    apiConfig.uapi.history,
    {
      method: 'get',
      params: data as unknown as Record<string, any>,
      retryCount: 1,
    }
  ));
}

export interface LoadRecentHistoryRequestData {
  excludeFinishedEpisodes: boolean;
  expand: 'content';
  page_enabled: boolean;
  per_page: number;
  platform: UapiPlatformType;
  deviceId?: string;
}

export function makeLoadRecentHistoryRequest(dispatch: TubiThunkDispatch, data: LoadRecentHistoryRequestData) {
  return dispatch(fetchWithToken<HistoryResponseBodyContent>(
    apiConfig.uapi.history,
    {
      method: 'get',
      params: data as unknown as Record<string, any>,
      retryCount: 1,
    }
  ));
}

export interface LoadByIdHistoryRequestData {
  contentType: string,
  contentId: string,
  platform: UapiPlatformType;
  deviceId?: string,
}

export function makeLoadByIdHistoryRequest(dispatch: TubiThunkDispatch, data: LoadByIdHistoryRequestData) {
  return dispatch(fetchWithToken<HistoryResponseBodyContent>(
    apiConfig.uapi.history,
    {
      method: 'get',
      params: data as unknown as Record<string, any>,
      retryCount: 1,
    }
  ));
}
