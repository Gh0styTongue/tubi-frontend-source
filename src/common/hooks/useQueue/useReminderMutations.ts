import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location } from 'history';

import { addToQueue, deleteFromQueue } from 'common/api/queue';
import { isLoggedInSelector, tubiIdSelector } from 'common/features/authentication/selectors/auth';
import { isLiveEvent } from 'common/features/liveEvent/utils';
import { isComingSoonContent } from 'common/features/playback/utils/isComingSoonContent';
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
  formatContentIdForRedux,
  trackReminderToggleEvent,
  updateContainersOnAddReminder,
  trackAddReminderAnalytics,
  updateContainersOnRemoveReminder,
  trackRemoveReminderAnalytics,
  type QueueAndReminderData,
} from './utils';

// ============================================================================
// Mutation Parameter Types
// ============================================================================

interface AddReminderParams {
  contentId: string; // Raw content ID without prefix (e.g., "543161" for series, "306890" for movies)
  contentType: ContentType;
  video?: Video; // Optional video object for metadata
}

interface RemoveReminderParams {
  itemId: string; // The queue item ID returned from the API
  contentId: string; // Raw content ID without prefix (e.g., "543161" for series, "306890" for movies)
  contentType: ContentType; // Type of content (needed to format ID for cache/analytics)
  location?: Location; // Optional location for OTT navigation handling
  video?: Video; // Optional video object for metadata
}

interface AddReminderContext {
  previousData: QueueAndReminderData | undefined;
  contentId: string;
}

interface RemoveReminderContext {
  previousData: QueueAndReminderData | undefined;
  contentId: string;
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Mutation function for adding a reminder
 */
export const addReminderMutationFn = async (
  params: AddReminderParams,
  dispatch: TubiThunkDispatch,
): Promise<{ id: string }> => {
  const { contentId, contentType } = params;

  // API expects raw content ID (no prefix)
  const result = await addToQueue(dispatch, {
    contentId,
    contentType,
    queueItemType: QueueItemType.REMIND_ME,
  });

  return result;
};

/**
 * Mutation function for removing a reminder
 */
export const removeReminderMutationFn = async (
  params: RemoveReminderParams,
  dispatch: TubiThunkDispatch,
): Promise<void> => {
  const { itemId } = params;
  await deleteFromQueue(dispatch, itemId);
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to add a reminder for content
 *
 * Reminders are typically used for upcoming content or live events that
 * the user wants to be notified about.
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Container management side effects for live events
 * - Race condition prevention via query cancellation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: addReminder } = useAddReminder();
 *
 * addReminder({
 *   contentId: '543161', // Raw ID without prefix
 *   contentType: 'series',
 *   video,
 * });
 * ```
 */
export const useAddReminder = (
  options?: UseMutationOptions<{ id: string }, Error, AddReminderParams, AddReminderContext>
): UseMutationResult<{ id: string }, Error, AddReminderParams, AddReminderContext> => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<{ id: string }, Error, AddReminderParams, AddReminderContext>({
    mutationFn: (params) => addReminderMutationFn(params, dispatch),

    onMutate: async (params) => {
      const { contentId, contentType, video } = params;

      // LEGACY: Format for tracking (uses '0' prefix for consistency with legacy analytics)
      const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

      // Track reminder event BEFORE API call (uses legacy ID for consistency)
      const extraCtx = {
        isUpcoming: video && isComingSoonContent(video.availability_starts),
        isLinearDetails: video && isLiveEvent(video),
      };
      trackReminderToggleEvent(legacyFormattedId, true, extraCtx);

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<QueueAndReminderData>(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId })
      );

      // Optimistically update the cache immediately for instant UI feedback (React Query uses real IDs)
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            reminderItems: {
              ...old.reminderItems,
              [contentId]: {
                id: 'optimistic-id', // Temporary ID until real one comes back
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
      logger.error(formatError(err), 'failed to add reminder');

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

      // Execute side effects (backwards compatibility and analytics)
      updateContainersOnAddReminder(dispatch, sideEffectParams);
      trackAddReminderAnalytics(sideEffectParams);

      // Update the optimistic entry with the real item ID (React Query uses real contentId)
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            reminderItems: {
              ...old.reminderItems,
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
 * Hook to remove a reminder for content
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Container management side effects for live events
 * - Race condition prevention via query cancellation
 *
 * @param options - React Query mutation options
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: removeReminder } = useRemoveReminder();
 *
 * removeReminder({
 *   itemId: '56cf8be8fa452d8b295a0db8',
 *   contentId: '543161', // Raw ID without prefix
 *   contentType: 'series',
 *   location, // Optional: only needed in OTT when viewing queue container
 *   video,
 * });
 * ```
 */
export const useRemoveReminder = (
  options?: UseMutationOptions<void, Error, RemoveReminderParams, RemoveReminderContext>
): UseMutationResult<void, Error, RemoveReminderParams, RemoveReminderContext> => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  return useMutation<void, Error, RemoveReminderParams, RemoveReminderContext>({
    mutationFn: (params) => removeReminderMutationFn(params, dispatch),

    onMutate: async (params) => {
      const { contentId, contentType, video } = params;

      // LEGACY: Format for tracking (uses '0' prefix for consistency with legacy analytics)
      const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

      // Track reminder event BEFORE API call (uses legacy ID for consistency)
      const extraCtx = {
        isUpcoming: video && isComingSoonContent(video.availability_starts),
        isLinearDetails: video && isLiveEvent(video),
      };
      trackReminderToggleEvent(legacyFormattedId, false, extraCtx);

      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<QueueAndReminderData>(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId })
      );

      // Optimistically update the cache immediately for instant UI feedback (React Query uses real IDs)
      queryClient.setQueryData(
        buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
        (old: QueueAndReminderData | undefined) => {
          if (!old) return old;
          const { [contentId]: removed, ...remainingItems } = old.reminderItems;
          return {
            ...old,
            reminderItems: remainingItems,
          };
        }
      );

      // Return context for error recovery
      return { previousData, contentId };
    },

    onError: (err, params, context) => {
      logger.error(formatError(err), 'failed to remove reminder');

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
      updateContainersOnRemoveReminder(dispatch, params);
      trackRemoveReminderAnalytics(params);
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
