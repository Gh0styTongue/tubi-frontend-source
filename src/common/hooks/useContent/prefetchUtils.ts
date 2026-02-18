/**
 * Prefetch utilities for React Query content loading
 *
 * These functions enable server-side rendering and class component integration
 * by prefetching data into the React Query cache.
 */

import type { QueryClient } from '@tanstack/react-query';

import { ottMajorPlatformsVideoResourceTagSelector } from 'common/selectors/experiments/ottMajorVideoSelector';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';

import { buildContentQueryKey, buildSeriesPaginationInfoQueryKey, contentQueryFn, seriesPaginationInfoQueryFn, type ContentQueryOptions, getPaginationParam } from './queryFunctions';

/**
 * Prefetch individual content data
 * Used in fetchData functions
 */
export const prefetchContent = (
  queryClient: QueryClient,
  contentId: string,
  options: ContentQueryOptions = {},
  dispatch: TubiThunkDispatch,
  getState: () => StoreState,
) => {
  const state = getState();
  const isKidsMode = isKidsModeEnabledSelector(state);
  const videoResourceTag = ottMajorPlatformsVideoResourceTagSelector(state);

  return queryClient.fetchInfiniteQuery({
    queryKey: buildContentQueryKey(contentId, { videoResourceTag, isKidsMode }),
    queryFn: ({ pageParam }) => contentQueryFn(contentId, { ...options, pagination: pageParam }, dispatch, getState, queryClient),
    initialPageParam: undefined, // No pagination for single content
    staleTime: Infinity, // Match hook behavior
  });
};

/**
 * Prefetch series content data with automatic pagination info handling
 * Mimics the behavior of useSeries by first fetching SeriesPaginationInfo,
 * then fetching series content with appropriate pagination settings.
 * Used in Series / episodes fetchData functions.
 */
export const prefetchSeriesContent = async (
  queryClient: QueryClient,
  seriesId: string,
  options: ContentQueryOptions = {},
  dispatch: TubiThunkDispatch,
  getState: () => StoreState,
) => {
  // First, fetch and cache the SeriesPaginationInfo
  const paginationInfo = await queryClient.fetchQuery({
    queryKey: buildSeriesPaginationInfoQueryKey(seriesId),
    queryFn: () => seriesPaginationInfoQueryFn(seriesId, dispatch),
    staleTime: Infinity, // Match hook behavior
  });

  // Apply the same pagination logic as useSeries
  const { isRecurring } = paginationInfo;
  const pagination = getPaginationParam(options, isRecurring);

  const state = getState();
  const isKidsMode = isKidsModeEnabledSelector(state);
  const videoResourceTag = ottMajorPlatformsVideoResourceTagSelector(state);

  // Now prefetch the series content with appropriate pagination
  return queryClient.fetchInfiniteQuery({
    queryKey: buildContentQueryKey(seriesId, { isKidsMode, pagination, videoResourceTag }),
    queryFn: ({ pageParam }) => contentQueryFn(seriesId, { ...options, pagination: pageParam }, dispatch, getState, queryClient),
    initialPageParam: pagination || { season: 'all', page: 1, size: undefined },
    staleTime: Infinity, // Match hook behavior
  });
};
