import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';

import { getSystemApi } from 'client/systemApi/default';
import { loadContainer } from 'common/actions/container';
import { CONTENT_MODES, QUEUE_CONTAINER_ID } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { userSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import { isContainerLoadedSelector } from 'common/selectors/container';
import { formatError } from 'common/utils/log';

import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { buildMyListPayload, type QueueAndReminderData } from './utils';

/**
 * FireTV sync side effect hook
 *
 * Matches legacy Redux behavior: waits for both queue data AND queue container
 * to be loaded before calling syncMyListOnDevice() on FireTV Hybrid platform.
 *
 * Tracks sync status per user ID to handle account switching within the same session.
 */
export const useSyncFiretvHybMyList = (result: UseQueryResult<QueueAndReminderData>) => {
  // Track all per-user state in a single ref to ensure consistent reset on user change
  const userStateRef = useRef<{
    syncedUserId: number | undefined;
    hasDispatchedContainer: boolean;
  }>({
    syncedUserId: undefined,
    hasDispatchedContainer: false,
  });

  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector(userSelector);
  const userId = user?.userId;

  // Reset all per-user state when user changes
  useEffect(() => {
    if (userStateRef.current.syncedUserId !== userId) {
      userStateRef.current = {
        syncedUserId: undefined,
        hasDispatchedContainer: false,
      };
    }
  }, [userId]);
  const containerChildrenIdMap = useAppSelector((state) => state.container.containerChildrenIdMap);
  const contentModeContainerChildrenIdMap = useAppSelector((state) =>
    state.contentMode.myStuff.containerChildrenIdMap
  );
  const isQueueContainerLoaded = useAppSelector((state) =>
    isContainerLoadedSelector(state, { pathname: '/', containerId: QUEUE_CONTAINER_ID })
  );

  // Get container children IDs (prefer regular container, fall back to content mode)
  const containerChildrenIds = useMemo(() => {
    const regularChildren = containerChildrenIdMap[QUEUE_CONTAINER_ID];
    if (regularChildren && regularChildren.length > 0) {
      return regularChildren;
    }
    return contentModeContainerChildrenIdMap[QUEUE_CONTAINER_ID] || [];
  }, [containerChildrenIdMap, contentModeContainerChildrenIdMap]);

  // Build the FireTV watchlist payload from queue data and container children
  const myListPayload = useMemo(
    () =>
      buildMyListPayload({
        queueItems: result.data?.queueItems,
        containerChildrenIds,
        profileId: user?.userId,
      }),
    [result.data?.queueItems, containerChildrenIds, user?.userId]
  );

  // For FireTV Hybrid: if queue container is not loaded, dispatch loadContainer once per user
  useEffect(() => {
    if (__OTTPLATFORM__ === 'FIRETV_HYB' && !isQueueContainerLoaded && !userStateRef.current.hasDispatchedContainer) {
      userStateRef.current.hasDispatchedContainer = true;
      dispatch(loadContainer({ location, id: QUEUE_CONTAINER_ID, limit: 20, contentMode: CONTENT_MODES.all }))
        .catch((error) => {
          logger.error('Error fetching container queue for FireTV sync', error);
        });
    }
  }, [isQueueContainerLoaded, dispatch, location]);

  // Once both queue and container are loaded, sync the my list on device
  // Track by user ID to handle account switching within the same session
  const needsSync = __OTTPLATFORM__ === 'FIRETV_HYB' && result.isSuccess && result.data && isQueueContainerLoaded && userId && userStateRef.current.syncedUserId !== userId;
  useEffect(() => {
    if (needsSync) {
      // userId is guaranteed to exist when needsSync is true
      userStateRef.current.syncedUserId = userId;
      try {
        getSystemApi().syncMyListOnDevice(myListPayload);
      } catch (error) {
        logger.error(formatError(error), 'failed to sync FireTV My List on device');
      }
    }
  }, [needsSync, myListPayload, userId]);
};
