import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import type { ContainerType, CONTENT_MODE_VALUE } from 'common/constants/constants';
import type { Sponsorship } from 'common/types/container';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { ReactionStatus } from 'common/types/userReactions';

const apiConfig = getApiConfig();

export interface BrowseListRequestParams {
  is_kids_mode?: boolean;
  include?: string[];
  content_mode?: CONTENT_MODE_VALUE;
  idfa?: string;
  excluded_containers?: string[];
}

export interface BrowseListContainer {
  description: string;
  id: string;
  logo: string | null;
  reaction: ReactionStatus;
  slug: string;
  tags: string[] | [];
  thumbnail: string;
  title: string;
  type: ContainerType;
  sponsorship: Sponsorship | null;
}

export interface BrowseListResponse {
  containers: BrowseListContainer[];
  personalization_id: string;
  valid_duration: number;
  }

export function makeBrowseListRequest(dispatch: TubiThunkDispatch, params: BrowseListRequestParams) {
  return dispatch(fetchWithToken<BrowseListResponse>(
    `${apiConfig.tensorPrefix}/browse_list`,
    {
      method: 'get',
      params: params as Record<string, any>,
      retryCount: 1,
      qsStringifyOptions: {
        arrayFormat: 'brackets',
      },
    },
  ));
}
