import { useQueueAndReminderQuery } from './useQueueAndReminderQuery';

interface UseIsInQueueResult {
  isInQueue: boolean;
  itemId: string | undefined;
  isFetching: boolean;
}

/**
 * Lightweight hook to check if content is in the queue
 *
 * Use this when you only need to check queue status for UI display.
 * For mutations, use `useAddToQueue()` and `useRemoveFromQueue()` separately.
 */
export const useIsInQueue = (contentId?: string): UseIsInQueueResult => {
  const { data, isFetching } = useQueueAndReminderQuery();

  // Extract queue item for this content (React Query uses real IDs, no prefix)
  const queueItem = contentId ? data?.queueItems[contentId] : undefined;
  const isInQueue = !!queueItem;
  const itemId = queueItem?.id;

  return {
    isInQueue,
    itemId,
    isFetching,
  };
};
