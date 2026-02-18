import type { UseQueryOptions } from '@tanstack/react-query';

import type { Season } from 'common/types/series';

import { getPaginationParam } from './queryFunctions';
import { useContent, type UseContentOptions, type UseContentReturn } from './useContent';
import { type SeriesPaginationInfo, useSeriesPaginationInfo } from './useSeriesPaginationInfo';

interface UseSeriesOptions extends UseContentOptions {
  paginationInfoQueryOptions?: Omit<UseQueryOptions<SeriesPaginationInfo>, 'queryKey' | 'queryFn'>;
}

export interface UseSeriesReturn extends UseContentReturn {
  seasonsMeta: Season[] | undefined;
  isRecurring: boolean;
}

/**
 * Simplified series loading hook that automatically fetches season info
 *
 * Internally calls useSeriesPaginationInfo and passes the result to useContent.
 * Returns the useContent result directly with intelligent pagination capabilities.
 *
 * @param seriesId - Series ID to fetch (no 0 prefix needed)
 * @param options - Same options as useContent (except seasonsMeta is handled automatically)
 * @returns Same as useContent but with automatic season info integration
 */
export const useSeries = (
  seriesId: string,
  options: UseSeriesOptions = {},
): UseSeriesReturn => {
  const { paginationInfoQueryOptions = {}, ...contentOptions } = options;

  // Extract enabled from main queryOptions to control useSeriesPaginationInfo
  const isEnabled = contentOptions.queryOptions?.enabled ?? true;

  // Consumer may not know if the content id is a series id. Prefer usage like useSeries(video.series_id, { queryOptions: { enabled: !!video.series_id } })
  if (!seriesId && isEnabled) {
    throw new Error('seriesId is required in useSeries');
  }

  const shouldEnablePaginationInfo = !!isEnabled && paginationInfoQueryOptions.enabled !== false;

  const { data: paginationInfo, isLoading: isSeasonInfoLoading } = useSeriesPaginationInfo(seriesId, {
    ...paginationInfoQueryOptions,
    enabled: shouldEnablePaginationInfo,
  });

  // Pagination logic based on series type
  const { seasons, isRecurring = false } = paginationInfo || {};
  const pagination = getPaginationParam(options, isRecurring);

  // Pass season info to useContent, but wait for it to be available first
  // If seasonsMeta fails, just load all episodes with no pagination TODO
  const contentQuery = useContent(seriesId, {
    ...contentOptions,
    seasonsMeta: seasons,
    pagination,
    queryOptions: {
      ...contentOptions.queryOptions,
      enabled: !!paginationInfo, // Wait for series pagination info
    },
  });

  return {
    ...contentQuery,
    // Override loading state to include season info loading
    isLoading: isSeasonInfoLoading || contentQuery.isLoading,
    seasonsMeta: seasons,
    isRecurring,
  };
};
