/**
 * SurfaceContainers API Hooks
 *
 * We use "surfaces" as the internal naming convention for this data, even though the
 * backend API endpoint is called "apps" (/api/v1/apps). This is intentional because:
 *
 * 1. The API name is subject to change
 * 2. "Surfaces" is a clearer term that avoids confusion with other uses of "app"
 *    in the codebase (e.g., the application itself, app store, etc.), and makes it easier to
 *    change in the future
 *
 */
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import union from 'lodash/union';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { formatContainerMetaData, getTTLForContainerValidDuration } from 'common/actions/container';
import { fetchWithToken } from 'common/actions/fetch';
import { batchAddVideos } from 'common/actions/video';
import { getImageParam } from 'common/api/containers';
import getApiConfig from 'common/apiConfig';
import * as actions from 'common/constants/action-types';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { tubiIdSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { isContainersListFullyLoaded } from 'common/selectors/container';
import { isKidsModeEnabledSelector, userLanguageLocaleSelector } from 'common/selectors/ui';
import type { Container } from 'common/types/container';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { SurfaceContainersQueryParams, SurfaceContainersResponse } from 'common/types/surfaces';
import type { Video } from 'common/types/video';
import { formatError } from 'common/utils/log';
import { parseContainer } from 'common/utils/tensor';
import type { LanguageLocaleType } from 'i18n/constants';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';

const OTT_CONTENT_LIMIT = 9;

export interface FormattedSurfaceContainersData {
  containerIds: string[];
  containerIdMap: Record<string, Container>;
  containerChildrenIdMap: Record<string, string[]>;
  contents: Record<string, Video>;
  personalizationId?: string;
  validDuration?: number;
  nextGroupCursor?: number;
}

/**
 * Build the query key for the surface containers query
 */
const buildSurfaceContainersQueryKey = (
  surfaceId: string,
  tubiId: string | undefined,
  isKidsMode: boolean,
  params: SurfaceContainersQueryParams,
  contentMode: CONTENT_MODE_VALUE,
  userLanguageLocale: LanguageLocaleType,
) => {
  return ['surfaceContainers', surfaceId, tubiId, isKidsMode, params, contentMode, userLanguageLocale] as const;
};

/**
 * Build query parameters for the surface containers endpoint
 */
const buildSurfaceContainersParams = (
  params: SurfaceContainersQueryParams
): SurfaceContainersQueryParams => {
  const queryParams: SurfaceContainersQueryParams = {
    contents_limit: params.contents_limit ?? OTT_CONTENT_LIMIT,
    include_ui_customization: params.include_ui_customization ?? true,
  };

  if (params.group_start !== undefined) {
    queryParams.group_start = params.group_start;
  }

  if (params.group_size !== undefined) {
    queryParams.group_size = params.group_size;
  }

  if (params.images) {
    queryParams.images = params.images;
  } else {
    // Use default OTT image params
    queryParams.images = getImageParam(undefined, false, false, false);
  }

  if (params.user_preferences) {
    queryParams.user_preferences = params.user_preferences;
  }

  if (params.zipcode) {
    queryParams.zipcode = params.zipcode;
  }

  if (params.include?.length) {
    queryParams.include = params.include;
  }

  return queryParams;
};

/**
 * Format raw API response into usable data structure
 */
const formatSurfaceContainersResponse = (
  response: SurfaceContainersResponse,
  userLanguageLocale: LanguageLocaleType,
  contentMode: CONTENT_MODE_VALUE
): FormattedSurfaceContainersData => {
  const containerIds: string[] = [];
  const containerIdMap: Record<string, Container> = {};
  const containerChildrenIdMap: Record<string, string[]> = {};

  response.containers?.forEach((rawContainer, index) => {
    const { container } = parseContainer(rawContainer, index);
    containerIds.push(container.id);
    containerIdMap[container.id] = formatContainerMetaData(container, userLanguageLocale, contentMode);
    containerChildrenIdMap[container.id] = container.children || [];
  });

  return {
    containerIds,
    containerIdMap,
    containerChildrenIdMap,
    contents: response.contents || {},
    personalizationId: response.personalization_id,
    validDuration: response.valid_duration,
    nextGroupCursor: response.group_cursor,
  };
};

/**
 * Fetch surface containers from the /api/v1/apps/{app_id} endpoint
 */
const surfaceContainersQueryFn = async (
  surfaceId: string,
  params: SurfaceContainersQueryParams,
  userLanguageLocale: LanguageLocaleType,
  contentMode: CONTENT_MODE_VALUE,
  dispatch: TubiThunkDispatch
): Promise<FormattedSurfaceContainersData> => {
  const apiConfig = getApiConfig();

  // Using tensorPrefix for v1 API endpoint (/api/v1/apps/{app_id})
  const endpoint = `${apiConfig.tensorPrefix}/apps/${surfaceId}`;

  try {
    const queryParams = buildSurfaceContainersParams(params);

    const response = await dispatch(
      fetchWithToken<SurfaceContainersResponse>(endpoint, {
        method: 'get',
        params: queryParams as Record<string, unknown>,
        qsStringifyOptions: {
          arrayFormat: 'brackets',
        },
      })
    );

    if (!response) {
      throw new Error(`Failed to fetch surface containers for surfaceId: ${surfaceId}`);
    }

    const formattedData = formatSurfaceContainersResponse(response, userLanguageLocale, contentMode);
    // Build the load map for container loading state
    const loadMap: Record<string, { loading: boolean; loaded: boolean; cursor: unknown; ttl: unknown; }> = {};
    formattedData.containerIds.forEach((containerId) => {
      const container = formattedData.containerIdMap[containerId];
      loadMap[containerId] = {
        loading: false,
        loaded: true,
        cursor: container?.cursor,
        ttl: getTTLForContainerValidDuration(container?.valid_duration),
      };
    });

    // Dispatch container data to Redux for HomeGrid
    dispatch({
      type: actions.LOAD_CONTAINERS.SUCCESS,
      surfaceId,
      payload: {
        containerIds: formattedData.containerIds,
        idMap: formattedData.containerIdMap,
        childrenMap: formattedData.containerChildrenIdMap,
        loadMap,
        nextContainerIndexToLoad: formattedData.nextGroupCursor ?? null,
        personalizationId: formattedData.personalizationId,
        validDuration: formattedData.validDuration,
      },
    });

    // Add videos to the video store
    if (Object.keys(formattedData.contents).length > 0) {
      dispatch(batchAddVideos(Object.values(formattedData.contents)));
    }
    logger.info({ surfaceId }, '[PivotDetails] Successfully loaded and initialized surface containers');
    return formattedData;
  } catch (error: unknown) {
    logger.error(formatError(error as Error), `failed to load surface containers for surfaceId: ${surfaceId}`);
    throw error;
  }
};

/**
 * Hook to fetch containers for a specific surface using the /api/v1/apps/{app_id} endpoint
 *
 * @param surfaceId - The ID of the surface to fetch containers for
 * @param params - Optional query parameters for the request
 * @param options - React Query options
 * @returns UseQueryResult with formatted surface containers data
 */
export const useSurfaceContainers = (
  surfaceId: string,
  params: SurfaceContainersQueryParams = {},
  contentMode: CONTENT_MODE_VALUE = 'all',
  options: Omit<UseQueryOptions<FormattedSurfaceContainersData>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<FormattedSurfaceContainersData> => {
  const dispatch = useAppDispatch();
  const tubiId = useAppSelector(tubiIdSelector);
  const isKidsMode = useAppSelector(isKidsModeEnabledSelector);
  const userLanguageLocale = useAppSelector(userLanguageLocaleSelector);

  return useQuery<FormattedSurfaceContainersData>({
    queryKey: buildSurfaceContainersQueryKey(surfaceId, tubiId, isKidsMode, params, contentMode, userLanguageLocale),
    queryFn: () => surfaceContainersQueryFn(surfaceId, params, userLanguageLocale, contentMode, dispatch),
    enabled: !!surfaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - containers don't change frequently
    ...options,
  });
};

/**
 * Lazy load more containers for a surface when scrolling vertically.
 * Similar to lazyloadHomeScreen but for surface stores.
 */
export function lazyLoadSurfaceContainers({
  surfaceId,
  groupSize = null,
}: {
  surfaceId: string;
  groupSize?: number | null;
}): TubiThunkAction<ThunkAction<Promise<string | void>, StoreState, ApiClient, Action>> {
  return async (dispatch, getState) => {
    const state = getState();
    const surfaceState = state.surface[surfaceId];

    // Surface doesn't exist yet - nothing to lazy load
    if (!surfaceState) {
      return Promise.resolve('surface not initialized');
    }

    const { nextContainerIndexToLoad, isFetching } = surfaceState;

    // Already fully loaded
    if (isContainersListFullyLoaded(surfaceState)) {
      return Promise.resolve('fully loaded');
    }

    // Already fetching
    if (isFetching) {
      return Promise.resolve();
    }

    const userLanguageLocale = userLanguageLocaleSelector(state);
    const groupStart = nextContainerIndexToLoad;

    // Dispatch fetch start
    dispatch({
      type: actions.LOAD_CONTAINERS.FETCH,
      surfaceId,
    });

    try {
      const apiConfig = getApiConfig();
      const endpoint = `${apiConfig.tensorPrefix}/apps/${surfaceId}`;

      const queryParams = buildSurfaceContainersParams({
        group_start: groupStart ?? undefined,
        group_size: groupSize ?? undefined,
      });

      const response = await dispatch(
        fetchWithToken<SurfaceContainersResponse>(endpoint, {
          method: 'get',
          params: queryParams as Record<string, unknown>,
          qsStringifyOptions: {
            arrayFormat: 'brackets',
          },
        })
      );

      if (!response) {
        throw new Error(`Failed to fetch surface containers for surfaceId: ${surfaceId}`);
      }

      const formattedData = formatSurfaceContainersResponse(response, userLanguageLocale, 'all');

      // Build load map for new containers
      const loadMap: Record<string, { loading: boolean; loaded: boolean; cursor: unknown; ttl: unknown }> = {};
      formattedData.containerIds.forEach((containerId) => {
        const container = formattedData.containerIdMap[containerId];
        loadMap[containerId] = {
          loading: false,
          loaded: true,
          cursor: container?.cursor,
          ttl: getTTLForContainerValidDuration(container?.valid_duration),
        };
      });

      // Get fresh surface state after async operation
      const currentSurfaceState = getState().surface[surfaceId];

      // Defensive check to ensure surface state exists
      /* istanbul ignore next */
      if (!currentSurfaceState) {
        return;
      }

      // Merge with existing data
      dispatch({
        type: actions.LOAD_CONTAINERS.SUCCESS,
        surfaceId,
        payload: {
          containerIds: union([...currentSurfaceState.containersList, ...formattedData.containerIds]),
          idMap: {
            ...currentSurfaceState.containerIdMap,
            ...formattedData.containerIdMap,
          },
          childrenMap: {
            ...currentSurfaceState.containerChildrenIdMap,
            ...formattedData.containerChildrenIdMap,
          },
          loadMap: {
            ...currentSurfaceState.containerLoadIdMap,
            ...loadMap,
          },
          nextContainerIndexToLoad: formattedData.nextGroupCursor ?? null,
          personalizationId: formattedData.personalizationId,
          validDuration: formattedData.validDuration,
        },
      });

      // Add videos to the video store
      if (Object.keys(formattedData.contents).length > 0) {
        dispatch(batchAddVideos(Object.values(formattedData.contents)));
      }

      logger.info({ surfaceId, groupStart }, '[PivotDetails] Successfully lazy loaded more surface containers');
    } catch (error: unknown) {
      logger.error(formatError(error as Error), `failed to lazy load surface containers for surfaceId: ${surfaceId}`);
      dispatch({
        type: actions.LOAD_CONTAINERS.FAILURE,
        surfaceId,
      });
    }
  };
}
