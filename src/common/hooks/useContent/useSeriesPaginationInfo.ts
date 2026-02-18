import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { Season } from 'common/types/series';

import useAppDispatch from '../useAppDispatch';
import { buildSeriesPaginationInfoQueryKey, seriesPaginationInfoQueryFn } from './queryFunctions';

export interface SeriesPaginationInfo {
  seasons: Season[];
  isRecurring: boolean;
}

/**
 * Hook to fetch series episode pagination info
 *
 * Fetches SeriesEpisodesResponse from API and transforms it to Season[] format
 * for use with useContent's seasonInfo parameter.
 *
 * @param seriesId - Series ID to fetch pagination info for. Note this does NOT need the 0 prefix.
 * @param options - Query options
 * @returns Series season and episode metadata in Season[] format
 */
export const useSeriesPaginationInfo = (
  seriesId: string,
  options: Omit<UseQueryOptions<SeriesPaginationInfo>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<SeriesPaginationInfo> => {
  const dispatch = useAppDispatch();

  return useQuery<SeriesPaginationInfo>({
    queryKey: buildSeriesPaginationInfoQueryKey(seriesId),
    queryFn: () => seriesPaginationInfoQueryFn(seriesId, dispatch),
    staleTime: Infinity,
    ...options,
  });
};
