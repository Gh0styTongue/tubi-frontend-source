import React, { useCallback, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { loadContainer } from 'common/actions/container';
import { remove as removeFromHistory } from 'common/actions/history';
import { QUEUE_CONTAINER_ID, HISTORY_CONTAINER_ID } from 'common/constants/constants';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { useLocation } from 'common/context/ReactRouterModernContext';
import logger from 'common/helpers/logging';
import { useAppDispatch } from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { useQueueAndReminderQuery } from 'common/hooks/useQueue/useQueueAndReminderQuery';
import { useRemoveFromQueue } from 'common/hooks/useQueue/useQueueMutations';
import { useRemoveReminder } from 'common/hooks/useQueue/useReminderMutations';
import { getQueueContentType } from 'common/hooks/useQueue/utils';
import { containerLoadIdMapSelector, containerChildrenSelector } from 'common/selectors/container';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { byIdSelector } from 'common/selectors/video';
import type { FetchDataParams } from 'common/types/container';
import { removeLeadingZero } from 'common/utils/removeLeadingZero';
import DeepLinkActionPrompt from 'web/features/deepLinkActions/components/DeepLinkActionPrompt/DeepLinkActionPrompt';
import { isDeepLinkAction } from 'web/features/deepLinkActions/utils';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

import History from './History';

export const messages = defineMessages({
  watchTab: {
    description: 'user settings history page tab title with normal case',
    defaultMessage: 'Continue Watching',
  },
  queueTab: {
    description: 'user settings history page tab title with normal case',
    defaultMessage: 'My List',
  },
});

const HistoryContainer = () => {
  const { data: queueAndReminderData } = useQueueAndReminderQuery();
  const removeFromQueueMutation = useRemoveFromQueue();
  const removeReminderMutation = useRemoveReminder();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const currentDate = useCurrentDate();
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);

  const historyIdList = useAppSelector(state => containerChildrenSelector(state, { pathname: location.pathname, containerId: HISTORY_CONTAINER_ID }));
  const queueIdList = useAppSelector(state => containerChildrenSelector(state, { pathname: location.pathname, containerId: QUEUE_CONTAINER_ID }));
  const byId = useAppSelector(byIdSelector);

  const tabs = useMemo(() => [
    intl.formatMessage(messages.watchTab),
    intl.formatMessage(messages.queueTab),
  ], [intl]);

  const deleteFromQueue = useCallback((contentId: string) => {
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'myList',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }

    // Strip leading zero for queueAndReminderData lookup (React Query format)
    const contentIdWithoutLeadingZero = removeLeadingZero(contentId);

    // Check both queueItems and reminderItems - QUEUE container includes both types
    const queueItem = queueAndReminderData?.queueItems[contentIdWithoutLeadingZero];
    const reminderItem = queueAndReminderData?.reminderItems[contentIdWithoutLeadingZero];

    // Keep original contentId with leading zero for byId lookup (Redux format)
    const content = byId[contentId];

    // Content will be defined - early return for type safety
    /* istanbul ignore next */
    if (!content) {
      return;
    }

    // Use the appropriate mutation to ensure correct optimistic cache update
    // Note: Prioritize reminder over queue to handle edge cases where both exist
    if (reminderItem) {
      removeReminderMutation.mutate({
        itemId: reminderItem.id,
        contentId: contentIdWithoutLeadingZero,
        contentType: getQueueContentType(content.type),
        location,
        video: content,
      });
    } else if (queueItem) {
      removeFromQueueMutation.mutate({
        itemId: queueItem.id,
        contentId: contentIdWithoutLeadingZero,
        contentType: getQueueContentType(content.type),
        location,
      });
    }
  }, [removeFromQueueMutation, removeReminderMutation, location, queueAndReminderData, byId, isMajorEventFailsafe, dispatch, intl, currentDate, majorEventFailsafeMessages]);

  const deleteFromHistory = useCallback((contentId: string) => {
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'continueWatching',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }
    dispatch(removeFromHistory(location, contentId));
  }, [dispatch, location, isMajorEventFailsafe, intl, currentDate, majorEventFailsafeMessages]);

  const deleteAll = useCallback((tabIndex: number) => {
    const feature = tabIndex === 1 ? 'myList' : 'continueWatching';

    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature,
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }

    if (tabIndex === 1) {
      queueIdList.forEach((id) => {
        deleteFromQueue(id);
      });
    }

    // history
    if (tabIndex === 0 && historyIdList.length) {
      historyIdList.forEach((id) => {
        deleteFromHistory(id);
      });
    }
  }, [queueIdList, deleteFromQueue, deleteFromHistory, historyIdList, isMajorEventFailsafe, dispatch, intl, currentDate, majorEventFailsafeMessages]);

  return (
    <>
      <History tabs={tabs} deleteFromQueue={deleteFromQueue} deleteFromHistory={deleteFromHistory} deleteAll={deleteAll} historyIdList={historyIdList} queueIdList={queueIdList} />
      {isDeepLinkAction(location) ? <DeepLinkActionPrompt location={location} /> : null}
    </>
  );
};

/**
 * ensure queue and history containers are loaded
 */
export function fetchData({ getState, dispatch, location }: FetchDataParams<Record<string, unknown>>) {
  const promises = [];
  const containerLoadIdMap = containerLoadIdMapSelector(getState(), { pathname: location.pathname });

  const queueLoadStatus = containerLoadIdMap[QUEUE_CONTAINER_ID] || {};
  const queueContainerLoaded = queueLoadStatus.loaded && queueLoadStatus.cursor === null;
  const historyLoadStatus = containerLoadIdMap[HISTORY_CONTAINER_ID] || {};
  const historyCatLoaded = historyLoadStatus.loaded && historyLoadStatus.cursor === null;

  // @note - include very high 'limit' for loadContainer, we need all contents for queue and history
  if (!historyCatLoaded) {
    promises.push(dispatch(loadContainer({ location, id: HISTORY_CONTAINER_ID, expand: 1, limit: 500 })));
  }
  if (!queueContainerLoaded) {
    promises.push(dispatch(loadContainer({ location, id: QUEUE_CONTAINER_ID, expand: 1, limit: 500 })));
  }
  return Promise.all(promises)
    .catch((err) => {
      logger.info(err, 'Error while fetching data - History');
      return Promise.reject(err);
    });
}

HistoryContainer.fetchData = fetchData;

export default HistoryContainer;
