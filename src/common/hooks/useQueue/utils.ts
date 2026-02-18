import { Operation } from '@tubitv/analytics/lib/genericEvents';
import type { Location } from 'history';

import { getSystemApi } from 'client/systemApi/default';
import { addNewContentToContainer, removeContentFromContainer } from 'common/actions/container';
import { QUEUE_CONTAINER_ID, SERIES_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { isLiveEvent } from 'common/features/liveEvent/utils';
import { getIsEspanolContent } from 'common/features/playback/utils/getIsEspanolContent';
import { isComingSoonContent } from 'common/features/playback/utils/isComingSoonContent';
import type { ContentIdMap, ContentType } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Video } from 'common/types/video';
import type { AnalyticsComponentValueType, PageTypeExtraCtx } from 'common/utils/analytics';
import { buildBookmarkEventObject, buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { removeLeadingZero } from 'common/utils/removeLeadingZero';
import { trackAppboyEvent, trackEvent } from 'common/utils/track';
import { ensureActiveTileAvailableAfterContainerModified } from 'ott/features/container/actions/ensureActiveTileAvailableAfterContainerModified';

/**
 * LEGACY: Formats contentId with '0' prefix for Redux/containers/analytics
 *
 * This maintains backwards compatibility with the legacy Redux pattern.
 * React Query code should NOT use this - it uses real IDs without prefix.
 * Only use this when writing to Redux or legacy systems.
 *
 * @param contentId - Raw content ID without prefix (e.g., "543161")
 * @param contentType - Type of content ("series" | "movie" | "sports_event")
 * @returns Formatted ID with '0' prefix for series (e.g., "0543161"), unchanged for others
 */
export const formatContentIdForRedux = (contentId: string, contentType: ContentType): string => {
  return contentType === 'series' ? `0${contentId}` : contentId;
};

/**
 * Represents the combined queue and reminder data structure
 * Both queue and reminder items are returned from the same API endpoint
 */
export interface QueueAndReminderData {
  queueItems: ContentIdMap;
  reminderItems: ContentIdMap;
}

/**
 * Maps content.type value to ContentType for queue/reminder API
 * @param contentType - The content type from Video object (e.g., 's', 'v', 'se')
 * @returns Queue ContentType ('series', 'movie', or 'sports_event')
 */
export const getQueueContentType = (contentType: Video['type']): ContentType => {
  if (contentType === SERIES_CONTENT_TYPE) {
    return 'series';
  }
  if (contentType === SPORTS_EVENT_CONTENT_TYPE) {
    return 'sports_event';
  }
  return 'movie';
};

// ============================================================================
// Queue Side Effects
// ============================================================================

interface AddToQueueSideEffectParams {
  contentId: string;
  contentType: ContentType;
  video?: Video;
  componentType?: AnalyticsComponentValueType;
  itemId: string;
}

/**
 * Update containers when adding to queue
 */
export const updateContainersOnAddToQueue = (
  dispatch: TubiThunkDispatch,
  params: AddToQueueSideEffectParams
) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);
  const isComingSoon = video && isComingSoonContent(video.availability_starts);

  if (!isComingSoon) {
    dispatch(
      addNewContentToContainer(
        legacyFormattedId,
        QUEUE_CONTAINER_ID,
        video ? getIsEspanolContent(video) : false
      )
    );
  }
};

/**
 * Sync queue to FireTV device
 */
export const syncAddToQueueToFireTV = (params: AddToQueueSideEffectParams) => {
  if (__OTTPLATFORM__ !== 'FIRETV_HYB') return;

  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);
  const isComingSoon = video && isComingSoonContent(video.availability_starts);

  if (!isComingSoon) {
    getSystemApi().updateMyListTitleOnDevice('Add', legacyFormattedId);
  }
};

/**
 * Track analytics for adding to queue
 */
export const trackAddToQueueAnalytics = (params: AddToQueueSideEffectParams) => {
  const { contentId, contentType, video, componentType } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);
  const isComingSoon = video ? isComingSoonContent(video.availability_starts) : false;

  const extraCtx = {
    isUpcoming: isComingSoon,
  };

  const bookmarkEventObject = buildBookmarkEventObject(
    getCurrentPathname(),
    legacyFormattedId,
    Operation.ADD_TO_QUEUE,
    componentType,
    extraCtx
  );

  trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
  trackAppboyEvent(eventTypes.APPBOY_ADD_BOOKMARK);
};

interface RemoveFromQueueSideEffectParams {
  contentId: string;
  contentType: ContentType;
  video?: Video;
  componentType?: AnalyticsComponentValueType;
  location?: Location;
}

/**
 * Update containers when removing from queue
 */
export const updateContainersOnRemoveFromQueue = (
  dispatch: TubiThunkDispatch,
  params: RemoveFromQueueSideEffectParams
) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  dispatch(
    removeContentFromContainer(
      legacyFormattedId,
      QUEUE_CONTAINER_ID,
      video ? getIsEspanolContent(video) : false
    )
  );
};

/**
 * Sync queue removal to FireTV device
 */
export const syncRemoveFromQueueToFireTV = (params: RemoveFromQueueSideEffectParams) => {
  if (__OTTPLATFORM__ !== 'FIRETV_HYB') return;

  const { contentId, contentType } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  getSystemApi().updateMyListTitleOnDevice('Remove', legacyFormattedId);
};

/**
 * Ensure active tile is available after removing from queue (OTT only)
 */
export const ensureActiveTileAfterRemoveFromQueue = (
  dispatch: TubiThunkDispatch,
  params: RemoveFromQueueSideEffectParams
) => {
  const { location } = params;

  if (__ISOTT__ && location) {
    dispatch(ensureActiveTileAvailableAfterContainerModified(location, QUEUE_CONTAINER_ID));
  }
};

/**
 * Track analytics for removing from queue
 */
export const trackRemoveFromQueueAnalytics = (params: RemoveFromQueueSideEffectParams) => {
  const { contentId, contentType, video, componentType } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  const extraCtx = {
    isUpcoming: video ? isComingSoonContent(video.availability_starts) : false,
  };

  const bookmarkEventObject = buildBookmarkEventObject(
    getCurrentPathname(),
    legacyFormattedId,
    Operation.REMOVE_FROM_QUEUE,
    componentType,
    extraCtx
  );

  trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
};

// ============================================================================
// Reminder Side Effects
// ============================================================================

interface AddReminderSideEffectParams {
  contentId: string;
  contentType: ContentType;
  video?: Video;
  itemId: string;
}

/**
 * Track reminder event BEFORE API call
 */
export const trackReminderToggleEvent = (
  contentId: string,
  isSetReminder: boolean,
  extraCtx?: PageTypeExtraCtx
) => {
  const reminderEventObject = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: isSetReminder ? 'TOGGLE_ON' : 'TOGGLE_OFF',
    component: 'REMINDER',
    section: Number(contentId),
    extraCtx,
  });

  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, reminderEventObject);
};

/**
 * Update containers when adding reminder (for all content types)
 */
export const updateContainersOnAddReminder = (
  dispatch: TubiThunkDispatch,
  params: AddReminderSideEffectParams
) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  if (video) {
    dispatch(addNewContentToContainer(legacyFormattedId, QUEUE_CONTAINER_ID, getIsEspanolContent(video)));
  }
};

/**
 * Track analytics for adding reminder
 */
export const trackAddReminderAnalytics = (params: AddReminderSideEffectParams) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  const extraCtx = {
    isUpcoming: video ? isComingSoonContent(video.availability_starts) : false,
    isLinearDetails: video ? isLiveEvent(video) : false,
  };

  const bookmarkEventObject = buildBookmarkEventObject(
    getCurrentPathname(),
    legacyFormattedId,
    Operation.ADD_TO_QUEUE, // Note: uses ADD_TO_QUEUE operation for reminders too
    undefined,
    extraCtx
  );

  trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
  trackAppboyEvent(eventTypes.APPBOY_ADD_BOOKMARK);
};

interface RemoveReminderSideEffectParams {
  contentId: string;
  contentType: ContentType;
  video?: Video;
  location?: Location;
}

/**
 * Update containers when removing reminder
 *
 * QUEUE container includes both queue items and reminders, so we always need
 * to remove the item from the container regardless of content type
 */
export const updateContainersOnRemoveReminder = (
  dispatch: TubiThunkDispatch,
  params: RemoveReminderSideEffectParams
) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  dispatch(removeContentFromContainer(legacyFormattedId, QUEUE_CONTAINER_ID, video ? getIsEspanolContent(video) : false));
};

/**
 * Ensure active tile is available after removing reminder (OTT only)
 *
 * On OTT platforms, when removing a reminder from the queue container,
 * ensure the active tile is still available after the container is modified
 */
export const ensureActiveTileAfterRemoveReminder = (
  dispatch: TubiThunkDispatch,
  params: RemoveReminderSideEffectParams
) => {
  const { location } = params;

  if (__ISOTT__ && location) {
    dispatch(ensureActiveTileAvailableAfterContainerModified(location, QUEUE_CONTAINER_ID));
  }
};

/**
 * Track analytics for removing reminder
 */
export const trackRemoveReminderAnalytics = (params: RemoveReminderSideEffectParams) => {
  const { contentId, contentType, video } = params;
  const legacyFormattedId = formatContentIdForRedux(contentId, contentType);

  const extraCtx = {
    isUpcoming: video ? isComingSoonContent(video.availability_starts) : false,
    isLinearDetails: video ? isLiveEvent(video) : false,
  };

  const bookmarkEventObject = buildBookmarkEventObject(
    getCurrentPathname(),
    legacyFormattedId,
    Operation.REMOVE_FROM_QUEUE, // Note: uses REMOVE_FROM_QUEUE operation for reminders too
    undefined,
    extraCtx
  );

  trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
};

// ============================================================================
// FireTV My List Payload Builder
// ============================================================================

/**
 * Represents a single item in the FireTV My List sync payload
 */
export interface MyListPayloadItem {
  amznContentId: string;
  profileId: number;
  timeStampMs: number;
}

/**
 * Parameters for building the FireTV My List payload
 */
export interface BuildMyListPayloadParams {
  /** Queue items from React Query data (keyed by content ID) */
  queueItems: ContentIdMap | undefined;
  /** Container children IDs (from either regular or content mode containers) */
  containerChildrenIds: string[];
  /** User's profile ID */
  profileId: number | undefined;
}

/**
 * Build the FireTV watchlist payload from queue data and container children
 *
 * Pure function that transforms queue data into the format expected by FireTV's
 * syncMyListOnDevice API. Only includes items that exist in both the queue data
 * AND the container children list.
 *
 * @returns Array of payload items, or empty array if missing required data
 */
export const buildMyListPayload = ({
  queueItems,
  containerChildrenIds,
  profileId,
}: BuildMyListPayloadParams): MyListPayloadItem[] => {
  // Early return if missing required data
  if (!queueItems || !profileId) {
    return [];
  }

  // No container children means no items to sync
  if (!containerChildrenIds.length) {
    return [];
  }

  return containerChildrenIds.reduce<MyListPayloadItem[]>((items, contentId) => {
    // Container IDs use legacy '0' prefix for series, but queueItems uses raw IDs
    const normalizedId = removeLeadingZero(contentId);
    const queueItem = queueItems[normalizedId];
    if (queueItem) {
      items.push({
        amznContentId: contentId,
        profileId,
        timeStampMs: queueItem.dateAddedInMs || Date.now(),
      });
    }
    return items;
  }, []);
};
