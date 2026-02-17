import type { RelatedVideoContentResponse } from 'client/utils/clientDataRequest';
import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import type { UAPIAutoplayMode } from 'common/constants/autoplay';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { getFailSafeHeaders } from 'common/utils/failsafe';

const apiConfig = getApiConfig();

const API_VERSION_FOR_AUTOPLAY_EXPERIMENT = '6.0.0';
const API_VERSION = '~5.0.0';

export interface LoadRelatedContentsRequestData {
  content_id: string;
  limit: number;
  is_kids_mode?: boolean;
  images: Record<string, string>;
  limit_resolutions?: string[];
  video_resources?: string[];
  video_resource_tag?: string;
}

export function makeLoadRelatedContentsRequest(dispatch: TubiThunkDispatch, data: LoadRelatedContentsRequestData, state: StoreState) {
  return dispatch(fetchWithToken<RelatedVideoContentResponse>(
    `${apiConfig.autopilotPrefix}/api/v1/related`,
    {
      method: 'get',
      params: data as Record<string, any>,
      qsStringifyOptions: {
        arrayFormat: 'brackets',
      },
      headers: {
        'Accept-Version': API_VERSION,
        ...getFailSafeHeaders(state),
      },
    }
  ));
}

export interface LoadAutoPlayContentsRequestData {
  content_id: string;
  limit: number;
  mode: UAPIAutoplayMode.AUTOPLAY | UAPIAutoplayMode.NON_AUTOPLAY
  is_kids_mode?: boolean;
  images: Record<string, string>;
  limit_resolutions?: string[];
  video_resources?: string[];
  video_resource_tag?: string;
  include_series?: boolean;
}

export function makeLoadAutoPlayContentsRequest(dispatch: TubiThunkDispatch, data: LoadAutoPlayContentsRequestData, state: StoreState) {
  return dispatch(fetchWithToken(
    `${apiConfig.autopilotPrefix}/api/v3/autoplay`,
    {
      method: 'get',
      params: data as Record<string, any>,
      qsStringifyOptions: {
        arrayFormat: 'brackets',
      },
      headers: {
        'Accept-Version': API_VERSION_FOR_AUTOPLAY_EXPERIMENT,
        ...getFailSafeHeaders(state),
      },
      retryCount: 2,
    }
  ));
}
