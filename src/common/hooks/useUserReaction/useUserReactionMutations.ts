import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location } from 'history';

import { addNewContentToContainer, invalidateContainer, removeContentFromContainer } from 'common/actions/container';
import { fetchWithToken } from 'common/actions/fetch';
import getApiConfig from 'common/apiConfig';
import { LINEAR_CONTENT_TYPE, MY_LIKES_CONTAINER_ID, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { isLoggedInSelector, tubiIdSelector } from 'common/features/authentication/selectors/auth';
import { getIsEspanolContent } from 'common/features/playback/utils/getIsEspanolContent';
import logger from 'common/helpers/logging';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Reaction, ReactionStatus } from 'common/types/userReactions';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { formatError } from 'common/utils/log';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { buildUserReactionQueryKey } from './useUserReaction';

interface PatchTitleReactionParams {
  contentId: string;
  action: 'like' | 'dislike' | 'remove-like' | 'remove-dislike';
  location: Location;
  video: Video;
}

interface PatchTitleReactionContext {
  previousReaction: ReactionStatus | undefined;
  contentId: string;
}

interface PatchMultiTitleReactionsParams {
  contentIds: { contentId: string; isSeries?: boolean }[];
  action: 'like' | 'dislike' | 'remove-like' | 'remove-dislike';
}

/**
 * Converts an action string (API) to the resulting ReactionStatus (UI)
 * @param action - The action being performed
 * @returns The optimistic reaction status
 */
export const getOptimisticReactionStatus = (
  action: PatchTitleReactionParams['action']
): ReactionStatus => {
  switch (action) {
    case 'like':
      return 'liked';
    case 'dislike':
      return 'disliked';
    case 'remove-like':
    case 'remove-dislike':
      return 'none';
    default:
      return 'none';
  }
};

/**
 * Extracts the reaction type from an action string
 * @param action - The action being performed
 * @returns The reaction type
 */
export const getReactionFromAction = (
  action: 'like' | 'dislike' | 'remove-like' | 'remove-dislike'
): Reaction => {
  if (action === 'like' || action === 'remove-like') {
    return 'like';
  }
  return 'dislike';
};

/**
 * Updates affected containers (MY_LIKES_CONTAINER_ID) when reactions change
 * This is a side effect that maintains backwards compatibility with Redux container management
 *
 * @param location - Current location for routing
 * @param contentId - Content ID being reacted to
 * @param newReaction - New reaction ('like', 'dislike', or null for removal)
 * @param isLinearContent - Whether the content is linear/live TV content
 * @param video - Video object for metadata (used for Español content detection)
 * @param dispatch - Redux dispatch function
 *
 * @todo-liam: This should be refactored when container management migrates to React Query
 */
export const updateAffectedContainerSideEffect = (
  location: Location,
  contentId: string, // zero-prefixed for series as this goes to legacy redux system
  newReaction: Reaction | null,
  isLinearContent: boolean,
  video: Video,
  dispatch: TubiThunkDispatch,
): void => {
  // Linear content (live TV) doesn't affect MY_LIKES_CONTAINER_ID
  const affectedContainerId = isLinearContent ? null : MY_LIKES_CONTAINER_ID;

  // @todo-liam: This should be refactored when container management migrates to React Query, just invalidate and refetch the container
  if (affectedContainerId) {
    // Optimistically update the container
    if (newReaction === 'like') {
      dispatch(addNewContentToContainer(contentId, affectedContainerId, getIsEspanolContent(video)));
    } else {
      dispatch(removeContentFromContainer(contentId, affectedContainerId, getIsEspanolContent(video)));
    }
    // Invalidate the container - it's no longer valid because we need a new pagination cursor
    dispatch(invalidateContainer(location, affectedContainerId));
  }
};

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Mutation function for patching a single title's reaction
 * Calls the account service API to update the user's reaction
 *
 * NOTE: The account service API expects series content IDs to have a '0' prefix (e.g., '0321' for series).
 * This function handles the conversion internally using the isSeries parameter.
 */
export const patchTitleReactionMutationFn = async (
  params: PatchTitleReactionParams,
  dispatch: TubiThunkDispatch,
): Promise<void> => {
  const { contentId, action, video } = params;
  const isSeries = video.type === SERIES_CONTENT_TYPE;
  // Prefer application layer to use true series id, though the account service API expects a '0' prefix
  const apiContentId = isSeries ? convertSeriesIdToContentId(contentId) : contentId;
  const apiConfig = getApiConfig();

  await dispatch(
    fetchWithToken<void>(`${apiConfig.accountServiceUserPrefix}/preferences/rate`, {
      method: 'patch',
      data: {
        target: 'title',
        action,
        data: [apiContentId],
      },
    })
  );
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to mutate a single title's reaction (add or remove like/dislike)
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Backwards compatible Redux action dispatches
 * - Container management side effects
 * - Race condition prevention via query cancellation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: patchReaction } = usePatchTitleReaction();
 *
 * patchReaction({
 *   contentId: '543161',
 *   action: 'like',
 *   location
 * });
 * ```
 */
export const usePatchTitleReaction = (
  options?: UseMutationOptions<void, Error, PatchTitleReactionParams, PatchTitleReactionContext>
): UseMutationResult<void, Error, PatchTitleReactionParams, PatchTitleReactionContext> => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<void, Error, PatchTitleReactionParams, PatchTitleReactionContext>({
    mutationFn: (params) => patchTitleReactionMutationFn(params, dispatch),

    onMutate: async (params) => {
      const { contentId, action, video } = params;
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const apiContentId = isSeries ? convertSeriesIdToContentId(contentId) : contentId;

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: buildUserReactionQueryKey(isLoggedIn, tubiId, apiContentId),
      });

      // Snapshot the previous value for rollback
      const previousReaction = queryClient.getQueryData<ReactionStatus>(
        buildUserReactionQueryKey(isLoggedIn, tubiId, apiContentId)
      );

      // Optimistically update the cache immediately for instant UI feedback
      const newStatus = getOptimisticReactionStatus(action);
      queryClient.setQueryData(
        buildUserReactionQueryKey(isLoggedIn, tubiId, apiContentId),
        newStatus,
      );

      // Return context for error recovery
      return { previousReaction, contentId };
    },

    onError: (err, params, context) => {
      logger.error(formatError(err), `failed to ${params.action} title`);
      const { contentId, video } = params;
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const apiContentId = isSeries ? convertSeriesIdToContentId(contentId) : contentId;

      // Rollback to previous value on error
      if (context?.previousReaction !== undefined) {
        queryClient.setQueryData(
          buildUserReactionQueryKey(isLoggedIn, tubiId, apiContentId),
          context.previousReaction,
        );
      }
    },

    onSuccess: (data, params) => {
      const { contentId, action, location, video } = params;
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const isLinearContent = video.type === LINEAR_CONTENT_TYPE;

      const reaction = getReactionFromAction(action);
      const apiContentId = isSeries ? convertSeriesIdToContentId(contentId) : contentId;

      const isRemoveAction = action === 'remove-like' || action === 'remove-dislike';

      // Update affected containers (MY_LIKES_CONTAINER_ID)
      updateAffectedContainerSideEffect(
        location,
        apiContentId,
        isRemoveAction ? null : reaction,
        isLinearContent,
        video,
        dispatch
      );
    },

    onSettled: (data, error, params) => {
      // Invalidate to refetch and ensure server state is correct
      // This is a "trust but verify" approach - marks data as stale
      // but won't refetch immediately due to staleTime configuration
      const { contentId, video } = params;
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const apiContentId = isSeries ? convertSeriesIdToContentId(contentId) : contentId;
      queryClient.invalidateQueries({
        queryKey: buildUserReactionQueryKey(isLoggedIn, tubiId, apiContentId),
      });
    },

    ...options,
  });
};

/**
 * Hook to mutate multiple titles' reactions in a single batch operation
 *
 * This is primarily used for onboarding flows where users select multiple
 * titles to like at once.
 *
 * Features:
 * - Batch API call for multiple content IDs
 * - Backwards compatible Redux action dispatches
 * - Invalidates all affected queries after mutation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: patchMultiReactions } = usePatchMultiTitleReactions();
 *
 * patchMultiReactions({
 *   contentIds: [
 *     { contentId: '543161' }, // movie ID
 *     { contentId: '300004985', isSeries: true }, // series ID (hook will convert to '0300004985')
 *     { contentId: '789', isSeries: false }
 *   ],
 *   action: 'like',
 * });
 * ```
 */
export const usePatchMultiTitleReactions = (
  options?: UseMutationOptions<void, Error, PatchMultiTitleReactionsParams>
): UseMutationResult<void, Error, PatchMultiTitleReactionsParams> => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<void, Error, PatchMultiTitleReactionsParams>({
    mutationFn: async (params: PatchMultiTitleReactionsParams) => {
      const { contentIds, action } = params;

      // Convert series IDs if needed for each content item
      const apiContentIds = contentIds.map(item => {
        if (item.isSeries) {
          return convertSeriesIdToContentId(item.contentId);
        }
        return item.contentId;
      });

      const apiConfig = getApiConfig();

      await dispatch(
        fetchWithToken<void>(`${apiConfig.accountServiceUserPrefix}/preferences/rate`, {
          method: 'patch',
          data: {
            target: 'title',
            action,
            data: apiContentIds,
          },
        })
      );
    },

    onSuccess: (data, params) => {
      const { contentIds } = params;

      // Convert series IDs to API format (with '0' prefix) for Redux and query invalidation
      const apiContentIds = contentIds.map(item => {
        if (item.isSeries) {
          return convertSeriesIdToContentId(item.contentId);
        }
        return item.contentId;
      });

      // Invalidate all affected queries using converted IDs
      apiContentIds.forEach(contentId => {
        queryClient.invalidateQueries({
          queryKey: buildUserReactionQueryKey(isLoggedIn, tubiId, contentId),
        });
      });
    },

    onError: (error, params) => {
      const { action } = params;
      logger.error(
        formatError(error),
        `failed to ${action} multiple titles`
      );
    },

    ...options,
  });
};
