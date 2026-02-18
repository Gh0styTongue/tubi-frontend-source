import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { Location } from 'history';
import type { ValueOf } from 'ts-essentials';

import { addToQueue, deleteFromQueue } from 'common/api/queue';
import { isLoggedInSelector, tubiIdSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import type { ContentType } from 'common/types/queue';
import { QueueItemType } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Video } from 'common/types/video';
import { formatError } from 'common/utils/log';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { buildQueueAndReminderQueryKey } from './useQueueAndReminderQuery';
import {
  updateContainersOnAddToQueue,
  syncAddToQueueToFireTV,
  trackAddToQueueAnalytics,
  updateContainersOnRemoveFromQueue,
  syncRemoveFromQueueToFireTV,
  trackRemoveFromQueueAnalytics,
  type QueueAndReminderData,
} from './utils';

// ============================================================================
// Mutation Parameter Types
// ============================================================================

interface AddToQueueParams {
  contentId: string; // Raw content ID without prefix (e.g., "543161" for series, "306890" for movies)
  contentType: ContentType;
  video?: Video; // Optional video object for metadata
  componentType?: ValueOf<typeof ANALYTICS_COMPONENTS>; // Optional analytics component context
}

interface RemoveFromQueueParams {
  itemId: string; // The queue item ID returned from the API
  contentId: string; // Raw content ID without prefix (e.g., "543161" for series, "306890" for movies)
  contentType: ContentType; // Type of content (needed to format ID for cache/analytics)
  location?: Location; // Optional location for OTT navigation handling
  video?: Video; // Optional video object for metadata
  componentType?: ValueOf<typeof ANALYTICS_COMPONENTS>; // Optional analytics component context
}

interface AddToQueueContext {
  previousData: QueueAndReminderData | undefined;
  contentId: string;
}

interface RemoveFromQueueContext {
  previousData: QueueAndReminderData | undefined;
  contentId: string;
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Mutation function for adding content to queue
 */
export const addToQueueMutationFn = async (
  params: AddToQueueParams,
  dispatch: TubiThunkDispatch,
): Promise<{ id: string }> => {
  const { contentId, contentType } = params;

  // API expects raw content ID (no prefix)
  const result = await addToQueue(dispatch, {
    contentId,
    contentType,
    queueItemType: QueueItemType.WATCH_LATER,
  });

  return result;
};

/**
 * Mutation function for removing content from queue
 */
export const removeFromQueueMutationFn = async (
  params: RemoveFromQueueParams,
  dispatch: TubiThunkDispatch,
): Promise<void> => {
  const { itemId } = params;
  await deleteFromQueue(dispatch, itemId);
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to add content to queue (My List)
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Container management side effects
 * - Race condition prevention via query cancellation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: addToQueue } = useAddToQueue();
 *
 * addToQueue({
 *   contentId: '543161', // Raw ID without prefix
 *   contentType: 'series',
 * });
 * ```
 */
export const useAddToQueue = (
  options?: UseMutationOptions<{ id: string }, Error, AddToQueueParams, AddToQueueContext>
): UseMutationResult<{ id: string }, Error, AddToQueueParams, AddToQueueContext> => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<{ id: string }, Error, AddToQueueParams, AddToQueueContext>({
    mutationFn: (params) => addToQueueMutationFn(params, dispatch),

    onMutate: async (params) => {
      const { contentId, contentType } = params;
      // Use real content ID (no prefix) for React Query cache

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<QueueAndReminderData>(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId })
      );

      // Optimistically update the cache immediately for instant UI feedback
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            queueItems: {
              ...old.queueItems,
              [contentId]: {
                id: `${contentId}-optimistic-id`, // Temporary ID until real one comes back
                contentType,
                dateAddedInMs: Date.now(),
              },
            },
          };
        }
      );

      // Return context for error recovery
      return { previousData, contentId };
    },

    onError: (err, params, context) => {
      logger.error(formatError(err), 'failed to add to queue');

      // Rollback to previous value on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
          context.previousData
        );
      }
    },

    onSuccess: (data, params) => {
      const { contentId, contentType } = params;
      const sideEffectParams = { ...params, itemId: data.id };

      // Execute side effects
      updateContainersOnAddToQueue(dispatch, sideEffectParams);
      syncAddToQueueToFireTV(sideEffectParams);
      trackAddToQueueAnalytics(sideEffectParams);

      // Update the optimistic entry with the real item ID (React Query uses real contentId)
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            queueItems: {
              ...old.queueItems,
              [contentId]: {
                id: data.id,
                contentType,
                dateAddedInMs: Date.now(),
              },
            },
          };
        }
      );
    },

    onSettled: () => {
      // Invalidate to refetch and ensure server state is correct
      queryClient.invalidateQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });
    },

    ...options,
  });
};

/**
 * Hook to remove content from queue (My List)
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Container management side effects
 * - Race condition prevention via query cancellation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: removeFromQueue } = useRemoveFromQueue();
 *
 * removeFromQueue({
 *   itemId: '56cf8be8fa452d8b295a0db8',
 *   contentId: '543161', // Raw ID without prefix
 *   contentType: 'series',
 *   location, // Optional: only needed in OTT when viewing queue container
 * });
 * ```
 */
export const useRemoveFromQueue = (
  options?: UseMutationOptions<void, Error, RemoveFromQueueParams, RemoveFromQueueContext>
): UseMutationResult<void, Error, RemoveFromQueueParams, RemoveFromQueueContext> => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<void, Error, RemoveFromQueueParams, RemoveFromQueueContext>({
    mutationFn: (params) => removeFromQueueMutationFn(params, dispatch),

    onMutate: async (params) => {
      const { contentId } = params;
      // Use real content ID (no prefix) for React Query cache

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<QueueAndReminderData>(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId })
      );

      // Optimistically update the cache immediately for instant UI feedback
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          const { [contentId]: removed, ...remainingItems } = old.queueItems;
          return {
            ...old,
            queueItems: remainingItems,
          };
        }
      );

      // Return context for error recovery
      return { previousData, contentId };
    },

    onError: (err, params, context) => {
      logger.error(formatError(err), 'failed to remove from queue');

      // Rollback to previous value on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
          context.previousData
        );
      }
    },

    onSuccess: (data, params) => {
      // Execute side effects
      updateContainersOnRemoveFromQueue(dispatch, params);
      syncRemoveFromQueueToFireTV(params);
      trackRemoveFromQueueAnalytics(params);
    },

    onSettled: () => {
      // Invalidate to refetch and ensure server state is correct
      queryClient.invalidateQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });
    },

    ...options,
  });
};
