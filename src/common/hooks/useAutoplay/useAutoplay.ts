import { type UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query';

import useAppDispatch from 'common/hooks/useAppDispatch';
import { shouldFetchArtTitleSelector } from 'common/selectors/artTitle';
import { enable4KSelector, enableHEVCSelector } from 'common/selectors/fire';
import { isKidsModeSelector } from 'common/selectors/ui';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import type { AutoplayQueryData } from 'common/types/video';

import { DEFAULT_AUTOPLAY_LIMIT, buildAutoplayContentsQueryKey, fetchAutoplayContentsData, processAutoplayContentsResponse } from './utils';
import useAppSelector from '../useAppSelector';

interface UseAutoplayParams {
  contentId: string;
  isAutoPlayVideo?: boolean;
  videoResourceTag?: string;
  limit?: number;
  queryOptions?: Omit<UseQueryOptions<AutoplayQueryData>, 'queryKey' | 'queryFn'>;
}

/**
 * UseQuery hook to fetch & cache autoplay data
 * The queryFn will format the response to Video type and cache the full episode data for series response types
 */
export const useAutoplay = ({
  contentId,
  isAutoPlayVideo = false,
  limit = DEFAULT_AUTOPLAY_LIMIT,
  videoResourceTag,
  queryOptions,
}: UseAutoplayParams) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const parentalRating = useAppSelector(parentalRatingSelector);
  const enableHEVC = useAppSelector(enableHEVCSelector);
  const enable4K = useAppSelector(enable4KSelector);
  const shouldFetchArtTitle = useAppSelector(shouldFetchArtTitleSelector);

  const queryKey = buildAutoplayContentsQueryKey({
    contentId,
    isAutoPlayVideo,
    videoResourceTag,
    limit,
    parentalRating,
    isKidsModeEnabled,
    enableHEVC,
    enable4K,
    shouldFetchArtTitle,
  });

  return useQuery<AutoplayQueryData>({
    queryKey,
    queryFn: async () => {
      const response = await fetchAutoplayContentsData(contentId, dispatch, {
        isAutoPlayVideo,
        videoResourceTag,
        limit,
        parentalRating,
        isKidsModeEnabled,
        enableHEVC,
        enable4K,
        shouldFetchArtTitle,
      });
      // This will format the response to Video type and cache the full episode data for series response types
      return processAutoplayContentsResponse({ response, sourceContentId: contentId, queryClient });
    },
    ...queryOptions,
  });
};
