/**
 * React Query hook for creator surface data
 * Transforms surface containers data for creator landing page UI
 */

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import useAppDispatch from 'common/hooks/useAppDispatch';
import { fetchSurfaceWithDispatch } from 'common/hooks/useSurfaces/useSurfaceContainers';
import type { AppMetadata, SurfaceContainersQueryParams } from 'common/types/surfaces';
import { transformContainers } from 'common/utils/creatorverse';
import type { CreatorContainerWithUrl } from 'common/utils/creatorverse';

/**
 * Transformed creator data for UI consumption
 */
export interface CreatorData {
  app: AppMetadata;
  containers: CreatorContainerWithUrl[];
}

/**
 * Fetch and transform creator surface data using React Query
 *
 * @param surfaceId - The creator app ID (e.g., 'tubitv_creator_watcher')
 * @param params - Optional query parameters for the surface containers API
 * @returns React Query result with transformed creator data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCreatorData(appId, {
 *   contents_limit: 9,
 * });
 *
 * if (error) throw error;
 * if (!data) return <Spinner />;
 *
 * return <CreatorHero {...data.app} />;
 * ```
 */
export function useCreatorData(
  surfaceId: string,
  params: SurfaceContainersQueryParams = { contents_limit: 9 }
): UseQueryResult<CreatorData> {
  const dispatch = useAppDispatch();

  // Fetch and transform data using React Query
  return useQuery({
    queryKey: ['creatorSurface', surfaceId, params],
    queryFn: async () => {
      const response = await fetchSurfaceWithDispatch(surfaceId, params, dispatch);

      if (!response.app) {
        throw new Error(`Failed to fetch creator surface: app data is missing for ${surfaceId}`);
      }

      // Transform containers to add detailsUrl and filter empty ones
      const transformedContainers = transformContainers(
        response.containers || [],
        response.contents || {}
      );

      return {
        app: response.app,
        containers: transformedContainers,
      };
    },
    enabled: !!surfaceId,
    staleTime: 5 * 60 * 1000,
  });
}
