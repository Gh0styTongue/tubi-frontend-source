import type { UseInfiniteQueryOptions, InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';

import { EPISODE_PAGINATION_PAGE_SIZE } from 'common/constants/constants';
import { shouldFetchArtTitleSelector } from 'common/selectors/artTitle';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { ottMajorPlatformsVideoResourceTagSelector } from 'common/selectors/experiments/ottMajorVideoSelector';
import { enable4KSelector, enableHEVCSelector } from 'common/selectors/fire';
import { isKidsModeEnabledSelector, uiSelector } from 'common/selectors/ui';
import type { Season } from 'common/types/series';
import type { Video } from 'common/types/video';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { buildContentQueryKey, contentQueryFn, isContentExpired, mergeVideoQueryData, type ContentQueryOptions, type SeriesPaginationState } from './queryFunctions';

export interface UseContentOptions extends ContentQueryOptions {
  // External season meta (from useSeriesPaginationInfo) to inform canLoadMore logic
  seasonsMeta?: Season[];
  // Query options for infinite queries (exclude select since we handle merging ourselves)
  queryOptions?: Omit<UseInfiniteQueryOptions<Video>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'select'>;
}

export type UseContentReturn = Omit<UseInfiniteQueryResult<InfiniteData<Video, unknown>, Error>, 'data'> & {
  data: Video | undefined; // Always returns the merged/single content
  refreshIfExpired: () => boolean;
  forceRefresh: () => void;
  isExpired: boolean;
  canLoadMore: (seasonNumber: string | number) => boolean;
  loadMore: (season?: string | number) => Promise<void>;
  infiniteData: InfiniteData<Video, unknown> | undefined;
  pages: Video[];
};

export const useContent = (
  contentId: string,
  options: UseContentOptions = {},
): UseContentReturn => {
  const { queryOptions = {}, seasonsMeta, ...contentOptions } = options;

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const isEnabled = queryOptions?.enabled ?? true;
  // The contentId may be undefined in some cases. Prefer usage like useContent(episodeId, { queryOptions: { enabled: !!episodeId } })
  if (!contentId && isEnabled) {
    throw new Error('contentId is required in useContent');
  }

  // Get all the selector values that the query function needs (with safe defaults)
  const deviceId = useAppSelector(deviceIdSelector);
  const { isMobile } = useAppSelector(uiSelector);
  const enableHEVC = useAppSelector(enableHEVCSelector);
  const enable4K = useAppSelector(enable4KSelector);
  const shouldFetchArtTitle = useAppSelector(shouldFetchArtTitleSelector);
  const isKidsMode = useAppSelector(isKidsModeEnabledSelector);
  const videoResourceTag = useAppSelector(ottMajorPlatformsVideoResourceTagSelector);

  // Create a state object with the values the query function needs (with safe defaults)
  const stateValues = {
    deviceId: deviceId || 'unknown',
    isMobile,
    enableHEVC, // Don't convert undefined to false - let getVideoResourceQueryParameters handle it
    enable4K, // Don't convert undefined to false - let getVideoResourceQueryParameters handle it
    shouldFetchArtTitle,
    isKidsMode,
    videoResourceTag,
  };

  // Determine if this is a series with pagination
  const hasPagination = Boolean(contentOptions.pagination);

  const queryKey = buildContentQueryKey(contentId, {
    isKidsMode,
    videoResourceTag,
    // Include pagination flag in the key to align with prefetch keys
    pagination: contentOptions.pagination,
  });

  const initialPageParam = (() => {
    // if any pagination option is provided, use it with defaults for missing values
    if (contentOptions.pagination) {
      return {
        season: contentOptions.pagination.season || 'all',
        page: contentOptions.pagination.page || 1,
        size: contentOptions.pagination.size,
      } as SeriesPaginationState;
    }

    return undefined;
  })();

  // Use ref for manual pagination control (for loadMore method)
  // This is needed because React Query's getNextPageParam is pure but loadMore(season) needs user input
  const pendingPageParam = useRef<SeriesPaginationState | null>(null);

  const query = useInfiniteQuery<Video>({
    queryKey,
    initialPageParam,
    queryFn: ({ pageParam }) =>
      contentQueryFn(contentId, {
        ...contentOptions,
        pagination: pageParam as SeriesPaginationState,
      }, dispatch, stateValues, queryClient),
    getNextPageParam: () => {
      // For movies, never fetch more pages
      if (!hasPagination) {
        return undefined;
      }

      // For series, use manual control via loadMore() method
      if (pendingPageParam.current) {
        const nextParam = pendingPageParam.current;
        // Don't clear immediately - let React Query finish the fetch cycle first
        return nextParam;
      }

      return undefined; // No automatic pagination
    },
    staleTime: Infinity, // Never auto-refetch - matches Redux behavior
    ...queryOptions,
  });

  // Backward compatible data access - merge series data for single content interface
  // Memoized to prevent unnecessary re-merging on every render
  const data = useMemo(() => {
    return query.data ? mergeVideoQueryData(query.data as InfiniteData<Video, unknown>) : undefined;
  }, [query.data]);

  // TTL expiration check
  const isExpired = isContentExpired(data);

  // Manual refresh capability (replaces force: true pattern)
  const refreshIfExpired = useCallback(() => {
    if (isContentExpired(data)) {
      queryClient.invalidateQueries({ queryKey });
      return true; // Was expired and refreshed
    }
    return false; // Still valid
  }, [queryClient, queryKey, data]);

  // Force refresh (direct replacement for force: true)
  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Series-specific methods
  const canLoadMore = useCallback((seasonNumber: string | number) => {
    if (!hasPagination || !seasonsMeta) return false;

    // Check specific season
    const seasonKey = seasonNumber.toString();
    const availableSeason = seasonsMeta.find(s => s.number === seasonKey);
    if (!availableSeason) return false;

    // Check if we've loaded all episodes for this season
    const loadedEpisodes = data?.seasons?.find(s => s.number === seasonKey)?.episodes || [];
    return loadedEpisodes.length < availableSeason.episodes.length;
  }, [hasPagination, seasonsMeta, data]);

  const loadMore = useCallback(async (season?: string | number) => {
    if (!hasPagination) {
      return;
    }

    const currentPagination = contentOptions.pagination!;

    // Determine which season to load more from
    const targetSeason = season?.toString() || currentPagination.season?.toString() || 'all';

    // Use original page size or default to EPISODE_PAGINATION_PAGE_SIZE
    const pageSize = currentPagination.size || EPISODE_PAGINATION_PAGE_SIZE;

    // Calculate next page based on currently loaded episodes for this season
    let nextPage = 1;
    if (data?.seasons && targetSeason !== 'all') {
      const loadedSeason = data.seasons.find(s => s.number === targetSeason);
      const loadedEpisodeCount = loadedSeason?.episodes?.length || 0;
      nextPage = Math.floor(loadedEpisodeCount / pageSize) + 1;
    } else if (targetSeason === 'all') {
      // For 'all' seasons, use total loaded episodes across all seasons
      const totalLoadedEpisodes = data?.seasons?.reduce((total, season) => {
        return total + (season.episodes?.length || 0);
      }, 0) || 0;
      nextPage = Math.floor(totalLoadedEpisodes / pageSize) + 1;
    }

    const nextPageParam: SeriesPaginationState = {
      season: targetSeason,
      page: nextPage,
      size: pageSize,
    };

    // Set the pending page param so getNextPageParam will return it
    pendingPageParam.current = nextPageParam;

    // Trigger fetchNextPage
    await query.fetchNextPage();

    // Clear pending param only after fetch is complete
    pendingPageParam.current = null;
  }, [hasPagination, contentOptions.pagination, data, query]);

  return {
    ...query,
    data,
    refreshIfExpired,
    forceRefresh,
    isExpired,
    canLoadMore,
    loadMore,
    infiniteData: query.data as InfiniteData<Video, unknown> | undefined,
    pages: (query.data?.pages || []) as Video[],
  };
};
