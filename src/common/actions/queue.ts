import type { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Operation } from '@tubitv/analytics/lib/genericEvents';
import type { Location } from 'history';
import type { ThunkAction } from 'redux-thunk';
import type { ValueOf } from 'ts-essentials';

import systemApi from 'client/systemApi';
import { FIRETV_MYLIST_ACTION } from 'client/systemApi/types';
import { addNewContentToContainer, loadContainer, removeContentFromContainer } from 'common/actions/container';
import { ensureActiveTileAvailableAfterContainerModified } from 'common/actions/fire';
import { addToQueue, deleteFromQueue, getQueue } from 'common/api/queue';
import * as actions from 'common/constants/action-types';
import { CONTENT_MODES, QUEUE_CONTAINER_ID } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { getIsEspanolContent } from 'common/features/playback/utils/getIsEspanolContent';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type {
  AddToQueueAction,
  AddToQueueFailAction,
  AddToQueueSuccessAction,
  ContentType,
  Error,
  QueueAction,
  QueueItem,
  RemoveFromQueueFailAction,
  RemoveFromQueueSuccessAction,
  UnloadQueueAction } from 'common/types/queue';
import {
  QueueItemType,
} from 'common/types/queue';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { buildBookmarkEventObject } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { formatError } from 'common/utils/log';
import { trackAppboyEvent, trackEvent } from 'common/utils/track';
import { isComingSoonContent } from 'ott/features/playback/utils/isComingSoonContent';

type QueueThunk = TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, QueueAction>>;

function addToQueueStart(contentId: string): AddToQueueAction {
  return {
    type: actions.ADD_TO_QUEUE,
    contentId,
  };
}

function addToQueueSuccess(contentId: string, contentType: ContentType, result: QueueItem): AddToQueueSuccessAction {
  return {
    type: actions.ADD_TO_QUEUE_SUCCESS,
    contentId,
    contentType,
    result,
  };
}

function addToQueueFail(contentId: string, error: Error): AddToQueueFailAction {
  return {
    type: actions.ADD_TO_QUEUE_FAIL,
    contentId,
    error,
  };
}

/**
 * add content to queue
 * @param contentId  seriesId or movieId, should not be episodeId
 * @param contentType
 */
export function add(contentId: string, contentType: ContentType, componentType?: ValueOf<typeof ANALYTICS_COMPONENTS>): QueueThunk {
  return (dispatch, getState) => {
    const { video: { byId } } = getState();
    const id = contentId.startsWith('0') ? contentId.substr(1) : contentId;

    dispatch(addToQueueStart(contentId));

    return addToQueue(dispatch, {
      contentId: id,
      contentType,
      queueItemType: QueueItemType.WATCH_LATER,
    }).then((data) => {
      const content = byId[contentId];
      const isComingSoon = isComingSoonContent(content?.availability_starts);
      const extraCtx = {
        isUpcoming: isComingSoon,
      };

      dispatch(addToQueueSuccess(contentId, contentType, data));
      // Don't manually add the coming soon content into MyList after successfully adding it to My List from the backend.
      // It should not appear in My List until it becomes available, which should be controlled by the backend.
      if (!isComingSoon) {
        dispatch(addNewContentToContainer(contentId, QUEUE_CONTAINER_ID, getIsEspanolContent(content)));
        if (__OTTPLATFORM__ === 'FIRETV_HYB') {
          systemApi.updateMyListTitleOnDevice(FIRETV_MYLIST_ACTION.ADD, contentId);
        }
      }

      const bookmarkEventObject = buildBookmarkEventObject(getCurrentPathname(), contentId, Operation.ADD_TO_QUEUE, componentType, extraCtx);
      trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
      trackAppboyEvent(eventTypes.APPBOY_ADD_BOOKMARK);
    }).catch((error: Error) => {
      dispatch(addToQueueFail(contentId, error));
      logger.error({ error, contentId }, 'add to queue action fail');
    });
  };
}

/**
 * remove content from container store, containerChildrenIdMap, videos
 * @param contentId
 * @returns action
 */
function removeFromQueueSuccess(contentId: string): RemoveFromQueueSuccessAction {
  return {
    type: actions.REMOVE_FROM_QUEUE_SUCCESS,
    contentId,
  };
}

function removeFromQueueFail(contentId: string, error: Error): RemoveFromQueueFailAction {
  return {
    type: actions.REMOVE_FROM_QUEUE_FAIL,
    contentId,
    error,
  };
}

/**
 * remove from queue
 * @param itemId id returned from the api instead of the video/series id
 * @param contentId
 * @returns function
 */
export function remove(itemId: string, contentId: string, location: Location, componentType?: ValueOf<typeof ANALYTICS_COMPONENTS>): QueueThunk {
  return (dispatch, getState) => {
    return deleteFromQueue(dispatch, itemId)
      .then(() => {
        const { video: { byId } } = getState();
        const content = byId[contentId];
        const extraCtx = {
          isUpcoming: isComingSoonContent(content?.availability_starts),
        };
        dispatch(removeFromQueueSuccess(contentId));
        dispatch(removeContentFromContainer(contentId, QUEUE_CONTAINER_ID, getIsEspanolContent(byId[contentId])));
        if (__OTTPLATFORM__ === 'FIRETV_HYB') {
          systemApi.updateMyListTitleOnDevice(FIRETV_MYLIST_ACTION.REMOVE, contentId);
        }
        if (__ISOTT__) {
          dispatch(ensureActiveTileAvailableAfterContainerModified(location, QUEUE_CONTAINER_ID));
        }
        const bookmarkEventObject = buildBookmarkEventObject(getCurrentPathname(), contentId, Operation.REMOVE_FROM_QUEUE, componentType, extraCtx);
        trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
      })
      .catch((error: Error) => {
        dispatch(removeFromQueueFail(contentId, error));
        logger.error({ error, contentId }, 'remove from queue fail');
      });
  };
}

export function loadQueue(location: Location, forcedUpdate?: boolean): QueueThunk {
  // For Amazon, when loading the queue items
  // we need to get the in policy items via tensor in order to sync the user's my list with Amazon
  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    return (dispatch) => {
      return Promise.all([
        dispatch(loadQueueExec(forcedUpdate)),
        dispatch(loadContainer({ location, id: QUEUE_CONTAINER_ID, limit: 20, contentMode: CONTENT_MODES.all })),
      ])
        .then(() => {
          systemApi.syncMyListOnDevice();
        })
        .catch((error) => {
          logger.error('Error fetching queue and container queue', error);
          return Promise.resolve();
        });
    };
  }
  return loadQueueExec(forcedUpdate);
}

// get dataMap and place on state
export function loadQueueExec(forceUpdate?: boolean): QueueThunk {
  return (dispatch, getState) => {
    const state = getState();
    const { queue } = state;

    // if loading, resolve immediately
    if (queue.loading) {
      return Promise.resolve();
    }

    if (queue.loaded && !forceUpdate) {
      return Promise.resolve();
    }

    return getQueue(dispatch).then((data) => {
      /* istanbul ignore else */
      if (data) {
        const { dataMap } = data;
        // place idMap in queue store
        dispatch(actionWrapper(actions.LOAD_QUEUE_SUCCESS, { idMap: dataMap }));
      }
      return Promise.resolve();
    }).catch((error: Error) => {
      logger.error(formatError(error as unknown as Parameters<typeof formatError>[0]), 'failed to load queue');
      dispatch(actionWrapper(actions.LOAD_QUEUE_FAIL, { error }));
      return Promise.reject(error);
    });
  };
}

/**
 * reset queue store
 */
export function unloadQueue(): UnloadQueueAction {
  return {
    type: actions.UNLOAD_QUEUE,
  };
}
