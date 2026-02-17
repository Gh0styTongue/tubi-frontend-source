import Cookie from 'react-cookie';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import systemApi from 'client/systemApi';
import type {
  FetchContainerResolvedValue,
  GetContainerRequestOptionsParams,
  FormattedHomescreenResult,
} from 'common/actions/container';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import {
  CONTENT_MODES,
  HOMESCREEN_USER_PREFERENCES_PARAM,
  HISTORY_CONTAINER_ID,
  QUEUE_CONTAINER_ID,
} from 'common/constants/constants';
import { COOKIE_ADVERTISER_ID } from 'common/constants/cookies';
import { TENSOR_OTT_HOMESCREEN_FIELDS } from 'common/constants/tensor';
import { SAMSUNG_HOMESCREEN_CONTENT_COUNT, getConfig as getConfigOfContentLimit } from 'common/experiments/config/ottSamsungHomescreenContentCount';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import type { ApiClientMethodOptions } from 'common/helpers/ApiClient';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { Container } from 'common/types/container';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getFailSafeHeaders } from 'common/utils/failsafe';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { mockWatchInFullHDData } from 'common/utils/mockWatchFullHdData';
import type { RawContainer } from 'common/utils/tensor';
import { parseContainer, formatContainerData } from 'common/utils/tensor';
import { mockPurpleCarpetDataForContainer } from 'common/utils/tensorMockData';
import { processVideoResourceQuery } from 'common/utils/video';

const INCLUDE_CHANNELS = true;

type HomescreenParams = {
  include_channels?: boolean; // this is removed in homescreen v4
  content_mode?: string;
  contents_limit?: number;
  excluded_containers?: string[];
  fields?: string[];
  gn_fields?: string;
  group_size?: number;
  group_start?: number;
  idfa?: string;
  images?: Record<string, string>;
  include_browser_list?: boolean;
  include_empty_containers?: boolean;
  include_empty_history?: boolean;
  include_empty_queue?: boolean;
  include_sponsorships?: boolean;
  include_withheld_containers?: string[];
  include?: string[];
  is_kids_mode?: boolean;
  user_preferences?: string;
  utm_campaign_config?: string;
  zipcode?: string;
  limit_resolutions?: string[];
  video_resources?: string[];
};

type RawHomescreenResult = Parameters<typeof formatContainerData>[0];

const getHomescreenParams = ({
  params: {
    contentMode,
    userPreferences,
    groupStart: uncheckedGroupStart,
    groupSize: uncheckedGroupSize,
    limit,
    zipcode,
    isKidsModeEnabled,
    includeComingSoon,
    includeWithheldContainers,
    isMobile,
    largerPoster,
    useArtTitle,
    limit_resolutions,
    video_resources,
  } = {},
  isGuestUser,
  state,
} : { params: GetContainerRequestOptionsParams['params'], isGuestUser: boolean, state: StoreState }) => {
  const OTT_CONTENT_LIMIT = popperExperimentsSelector(state, {
    ...SAMSUNG_HOMESCREEN_CONTENT_COUNT,
    config: getConfigOfContentLimit(),
  });
  const WEB_CONTENT_LIMIT = 10;

  const params: HomescreenParams = {
    include_channels: INCLUDE_CHANNELS,
    contents_limit: __ISOTT__ ? OTT_CONTENT_LIMIT : WEB_CONTENT_LIMIT,
    // Continue Watching should be hidden from Web guest user
    include_empty_history: __ISOTT__ || !isGuestUser,
    include_empty_queue: !isGuestUser,
    include_browser_list: true,
    include_sponsorships: true,
  };

  if (contentMode !== CONTENT_MODES.myStuff) {
    params.content_mode = contentMode;
  }

  if (__ISOTT__) {
    params.fields = TENSOR_OTT_HOMESCREEN_FIELDS;
  }

  let groupStart: number | undefined;
  let groupSize: number | undefined;
  if (uncheckedGroupStart || uncheckedGroupSize) {
    groupStart = Number(uncheckedGroupStart);
    groupSize = Number(uncheckedGroupSize);
    params.group_start = Number.isNaN(groupStart) ? 0 : groupStart;
    params.group_size = Number.isNaN(groupSize) || groupSize === 0 ? -1 : groupSize;
  }

  if (limit) {
    params.contents_limit = limit;
  }

  if (zipcode) {
    params.zipcode = zipcode;
  }

  if (userPreferences) {
    params.user_preferences = userPreferences;
  }

  const userPreferencesCookie = Cookie.load(HOMESCREEN_USER_PREFERENCES_PARAM);

  if (userPreferencesCookie) {
    params.user_preferences = userPreferencesCookie;
  }

  // Use the kids mode value from client, if not always set to false
  params.is_kids_mode = isKidsModeEnabled || false;

  params.images = getImageQueryFromParams({
    isMobile,
    largerPoster,
    useArtTitle,
  });

  processVideoResourceQuery({ limit_resolutions, video_resources }, params);

  if (includeComingSoon) {
    params.include = ['coming_soon_in_browser_list'];
  }

  if (typeof includeWithheldContainers === 'string') {
    params.include_withheld_containers = [includeWithheldContainers];
  } else if (Array.isArray(includeWithheldContainers)) {
    params.include_withheld_containers = includeWithheldContainers;
  }

  const idfa = Cookie.load(COOKIE_ADVERTISER_ID) || systemApi.getAdvertiserId();
  if (idfa) {
    params.idfa = idfa;
  }

  return params;
};

// previously /oz/containers
export const fetchHomescreenContainers =
  (
    params?: GetContainerRequestOptionsParams['params'],
    options?: ApiClientMethodOptions
  ): TubiThunkAction<ThunkAction<Promise<FormattedHomescreenResult>, StoreState, ApiClient, AnyAction>> =>
    async (dispatch, getState) => {
      const state = getState();
      const apiConfig = getConfig();
      const tensorBaseUrl = apiConfig.tensorPrefixV5;
      const allParams = getHomescreenParams({ params, state, isGuestUser: !isLoggedInSelector(state) });
      const body = await dispatch(
        fetchWithToken<RawHomescreenResult>(`${tensorBaseUrl}/homescreen`, {
          ...options,
          params: allParams,
          qsStringifyOptions: {
            arrayFormat: 'brackets',
          },
          headers: getFailSafeHeaders(state, allParams.content_mode || CONTENT_MODES.all),
        })
      );

      /* istanbul ignore next */
      if ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && FeatureSwitchManager.isEnabled('MockWatchInFullHDData') && params?.groupStart === 0) {
        mockWatchInFullHDData(body);
      }

      return formatContainerData(body);
    };

export const getContentByContainerIdOptions = (
  initialParams: GetContainerRequestOptionsParams['params'] = {}
): ApiClientMethodOptions => {
  const { limit = 9, cursor, isKidsModeEnabled = false, contentMode, zipcode, expanded, limit_resolutions, video_resources } = initialParams;

  const params: ApiClientMethodOptions['params'] = {
    contents_limit: limit,
    cursor,
    images: getImageQueryFromParams(initialParams),
    include_channels: true,
    include_browser_list: true,
    include_sponsorships: true,
    is_kids_mode: isKidsModeEnabled,
  };
  // TODO UPDATE CONTENT MODES THAT ARE VALID FOR TENSOR ENDPOINT @cbengtson
  /* istanbul ignore next */
  if (contentMode && !([CONTENT_MODES.myStuff] as string[]).includes(contentMode as string)) {
    params.content_mode = contentMode;
  }

  if (zipcode) {
    params.zipcode = zipcode;
  }

  processVideoResourceQuery({ limit_resolutions, video_resources }, params);

  if (expanded) {
    params.expanded = true;
  }

  return {
    method: 'get',
    params,
    qsStringifyOptions: {
      arrayFormat: 'brackets',
    },
  };
};

const getContentByContainerIdCRMOptions = (
  deviceId: string | undefined,
  initialParams: NonNullable<GetContainerRequestOptionsParams['params']>
): ApiClientMethodOptions => {
  const { limit = 40, cursor } = initialParams;
  const params = {
    contents_limit: limit,
    images: getImageQueryFromParams(initialParams),
    device_id: deviceId,
    cursor,
  };

  return { params };
};

type FetchContentByContainerIdResponse = {
  container: RawContainer;
  contents: Record<string, Video>;
};

// previously: /oz/containers/:containerId/content
export const fetchContentByContainerId = (
  containerId: string,
  options: GetContainerRequestOptionsParams
): TubiThunkAction<ThunkAction<Promise<FetchContainerResolvedValue | void>, StoreState, ApiClient, AnyAction>> => {
  return async (dispatch, getState, client) => {
    try {
      const { params = {} } = options;
      const { isCRM } = params;

      const apiConfig = getConfig();
      const tensorBaseUrl = apiConfig.tensorPrefixV5;
      const url = isCRM
        ? `${apiConfig.crmPrefix}/api/v1/collection/${containerId}`
        : `${tensorBaseUrl}/containers/${containerId}`;

      const requestOptions = isCRM
        ? getContentByContainerIdCRMOptions(getState().auth?.deviceId, params)
        : getContentByContainerIdOptions(params);

      const response = await dispatch(fetchWithToken<FetchContentByContainerIdResponse>(url, {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          ...getFailSafeHeaders(getState(), params.contentMode || CONTENT_MODES.all),
        },
      }));
      // failsafe some container is blocked by remote_config
      /* istanbul ignore if */
      if (!response) return Promise.resolve();

      mockPurpleCarpetDataForContainer(response);
      const { container, subContainersHash } = parseContainer(response.container);

      const hash: ReturnType<typeof parseContainer>['subContainersHash'] = {
        [containerId]: container,
        ...subContainersHash,
      };

      return {
        containersHash: hash,
        contents: response.contents,
      };
    } catch (err) {
      const state = getState();
      client.sendBeacon('/oz/log', {
        data: {
          error: err,
          errorMessage: err.message,
          containerId,
          customLogMessage: 'Error in fetchContentByContainerId',
          deviceId: state.auth?.deviceId,
          isLoggedIn: isLoggedInSelector(state),
          userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
          pageUrl: typeof window !== 'undefined' && window.location?.href,
        },
      });

      const isQueueOrHistory = [HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID].includes(containerId);
      if (err.httpCode === 404 && isQueueOrHistory) {
        return {
          containersHash: {},
          contents: {},
        };
      }

      return Promise.reject(err);
    }
  };
};

export type PmrBody = {
  container: Container;
  contents: Record<string, Video>;
  valid_duration: number;
  personalization_id: string;
};

// previously /oz/containers/pmr
export const fetchPmr =
  ({ limit = 20 }: { limit?: number } = {}): TubiThunkAction<
    ThunkAction<Promise<PmrBody>, StoreState, ApiClient, AnyAction>
  > =>
    (dispatch, getState) => {
      const params = {
        contents_limit: limit,
        device_id: getState().auth.deviceId,
      };
      return dispatch(
        fetchWithToken<PmrBody>(`${getConfig().tensorPrefix}/pmr`, {
          params,
          qsStringifyOptions: { arrayFormat: 'brackets' },
        })
      );
    };
