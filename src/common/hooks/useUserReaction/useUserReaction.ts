import type { QueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import { LOAD_SINGLE_TITLE_REACTION_SUCCESS } from 'common/constants/action-types';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { ReactionStatus } from 'common/types/userReactions';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { formatError } from 'common/utils/log';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';

interface RateSingleTitleResponse {
  status: ReactionStatus;
}

interface UserReactionParams {
  contentId: string;
  isSeries?: boolean;
}

/**
 * Build React Query key for user reactions
 */
export const buildUserReactionQueryKey = (contentId: string): [string, string] => {
  return ['userReaction', contentId];
};

/**
 * Query function for user reactions
 *
 * NOTE: The account service API expects series content IDs to have a '0' prefix (e.g., '0321' for series).
 * Currently, the application layer handles this conversion before calling the hook, so we pass contentId as-is.
 */
export const userReactionQueryFn = async (
  apiContentId: string,
  dispatch: TubiThunkDispatch,
): Promise<ReactionStatus> => {
  const apiConfig = getApiConfig();

  try {
    const response = await dispatch(
      fetchWithToken<RateSingleTitleResponse>(
        `${apiConfig.accountServiceUserPrefix}/preferences/rate/title/${apiContentId}`,
        { method: 'get' }
      )
    );

    // useQuery wrapper will expose this as an error on the UseQueryReturn
    if (!response) {
      throw new Error('Failed to fetch user reaction: response is null or undefined');
    }

    // Add to redux for backwards compatibility
    // @todo-liam Remove this after migrating all actions and consumers
    dispatch({
      type: LOAD_SINGLE_TITLE_REACTION_SUCCESS,
      contentId: apiContentId,
      status: response.status,
    });

    return response.status;
  } catch (error: any) {
    logger.error(formatError(error), 'failed to load user reaction');
    throw error;
  }
};

/**
 * Hook to fetch user reaction (like/dislike/none) for a specific content
 *
 * Automatically checks if user is logged in and not in kids mode before fetching.
 * User reactions are only available for logged-in users in non-kids mode.
 *
 * @param contentId - Content ID (either video id or series id, no '0' prefix)
 * @param isSeries - Whether the content is a series
 * @param options - Query options (can override `enabled` to add additional conditions)
 * @returns User reaction status: 'liked', 'disliked', 'none', or undefined
 */
export const useUserReaction = (
  { contentId: applicationLayerContentId, isSeries = false }: UserReactionParams,
  options: Omit<UseQueryOptions<ReactionStatus>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<ReactionStatus> => {
  // Prefer application layer to use true series id, though the account service API expects a '0' prefix
  const apiContentId = isSeries ? convertSeriesIdToContentId(applicationLayerContentId) : applicationLayerContentId;

  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeEnabledSelector);

  // Only fetch reactions if user is logged in and not in kids mode
  const shouldFetchReaction = isLoggedIn && !isKidsModeEnabled;

  return useQuery<ReactionStatus>({
    queryKey: buildUserReactionQueryKey(apiContentId),
    queryFn: () => userReactionQueryFn(apiContentId, dispatch),
    staleTime: 5 * 60 * 1000, // 5 minutes - reactions don't change frequently
    ...options,
    // Combine internal enabled logic with user-provided options
    // Must come after ...options to ensure we always respect internal logic
    enabled: shouldFetchReaction && (options.enabled !== false),
  });
};

// Used in fetchData only
export const prefetchUserReaction = async ({ contentId: applicationLayerContentId, isSeries = false }: UserReactionParams, dispatch: TubiThunkDispatch, queryClient: QueryClient) => {
  // Prefer application layer to use true series id, though the account service API expects a '0' prefix
  const apiContentId = isSeries ? convertSeriesIdToContentId(applicationLayerContentId) : applicationLayerContentId;

  // if this is already in the cache, return it
  const cachedUserReaction = queryClient.getQueryData(buildUserReactionQueryKey(apiContentId));
  if (cachedUserReaction) {
    return cachedUserReaction;
  }

  try {
    const userReaction = await userReactionQueryFn(apiContentId, dispatch);
    queryClient.setQueryData(buildUserReactionQueryKey(apiContentId), userReaction);
    return userReaction;
  } catch (error) {
    // Catch error & continue - do not let a failed prefetch block anything else
    logger.error(formatError(error), 'failed to prefetch user reaction');
  }
};
