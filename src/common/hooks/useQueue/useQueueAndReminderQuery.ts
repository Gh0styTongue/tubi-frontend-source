import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { getQueueWithTypes } from 'common/api/queue';
import { isLoggedInSelector, tubiIdSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import type { ContentIdMap } from 'common/types/queue';
import { QueueItemType } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { formatError } from 'common/utils/log';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { useSyncFiretvHybMyList } from './useSyncFiretvHybMyList';
import type { QueueAndReminderData } from './utils';

export type { QueueAndReminderData };

interface QueueQueryKeyParams {
  isLoggedIn: boolean;
  tubiId: string | undefined;
}

/**
 * Build React Query key for queue and reminder API data
 */
export const buildQueueAndReminderQueryKey = ({
  isLoggedIn,
  tubiId,
}: QueueQueryKeyParams): [string, boolean, string | undefined] => {
  return ['queueAndReminder', isLoggedIn, tubiId];
};

/**
 * Query function for fetching queue and reminder data
 *
 * Both queue and reminder items come from the same API endpoint.
 * They are differentiated by the 'type' field:
 * - QueueItemType.WATCH_LATER = queue items (My List)
 * - QueueItemType.REMIND_ME = reminder items (Remind Me)
 */
export const queueAndReminderQueryFn = async (
  dispatch: TubiThunkDispatch,
): Promise<QueueAndReminderData> => {
  try {
    const items = await getQueueWithTypes(dispatch);

    if (!items) {
      throw new Error('Failed to fetch queue and reminder data: response is null or undefined');
    }

    const queueItems: ContentIdMap = {};
    const reminderItems: ContentIdMap = {};

    items.forEach((item) => {
      const { content_id: contentId, id: itemId, content_type: contentType, type } = item;
      // Use real content ID (no '0' prefix) - breaking from legacy Redux pattern
      const realContentId = `${contentId}`;

      // Parse date, fallback to Date.now() for missing or invalid dates
      let dateAddedInMs = Date.now();
      if (item.updated_at) {
        const parsedDate = Date.parse(item.updated_at);
        // Date.parse returns NaN for invalid dates
        dateAddedInMs = isNaN(parsedDate) ? Date.now() : parsedDate;
      }

      const queueContent = {
        id: itemId,
        contentType,
        dateAddedInMs,
      };

      // Separate by type
      if (type === QueueItemType.REMIND_ME) {
        reminderItems[realContentId] = queueContent;
      } else {
        // Default to queue items (WATCH_LATER or undefined)
        queueItems[realContentId] = queueContent;
      }
    });

    return {
      queueItems,
      reminderItems,
    };
  } catch (error: any) {
    logger.error(formatError(error), 'failed to load queue and reminder data');
    throw error;
  }
};

/**
 * Hook to fetch all queue and reminder data for the current user
 * Automatically prevents fetching for unauthenticated users
 *
 * @param options - Query options (note: `enabled` will be merged with auth check)
 * @returns Combined queue and reminder data
 */
export const useQueueAndReminderQuery = (
  options: Omit<UseQueryOptions<QueueAndReminderData>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<QueueAndReminderData> => {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const tubiId = useAppSelector(tubiIdSelector);

  // Disable the query for unauthenticated users
  const baseEnabled = isLoggedIn;
  const { enabled: callerEnabled = true, ...restOptions } = options;

  const result = useQuery<QueueAndReminderData>({
    queryKey: buildQueueAndReminderQueryKey({ isLoggedIn, tubiId }),
    queryFn: () => queueAndReminderQueryFn(dispatch),
    staleTime: 5 * 60 * 1000, // 5 minutes - queue/reminder data doesn't change frequently. adjust as needed
    enabled: baseEnabled && callerEnabled,
    ...restOptions,
  });

  // Match legacy Redux behavior: sync FireTV My List on successful load
  useSyncFiretvHybMyList(result);

  return result;
};
