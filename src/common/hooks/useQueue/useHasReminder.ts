import { useQueueAndReminderQuery } from './useQueueAndReminderQuery';

interface UseHasReminderResult {
  hasReminder: boolean;
  itemId: string | undefined;
  isFetching: boolean;
}

/**
 * Lightweight hook to check if a reminder is set for content
 *
 * Use this when you only need to check reminder status for UI display.
 * For mutations, use `useAddReminder()` and `useRemoveReminder()` separately.
 */
export const useHasReminder = (contentId?: string): UseHasReminderResult => {
  const { data, isFetching } = useQueueAndReminderQuery();

  // Extract reminder item for this content (React Query uses real IDs, no prefix)
  const reminderItem = contentId ? data?.reminderItems[contentId] : undefined;
  const hasReminder = Boolean(contentId && reminderItem);
  const itemId = reminderItem?.id;

  return {
    hasReminder,
    itemId,
    isFetching,
  };
};
