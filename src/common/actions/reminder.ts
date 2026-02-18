import { Operation } from '@tubitv/analytics/lib/genericEvents';
import type { Location } from 'history';
import type { ThunkAction } from 'redux-thunk';

import { ensureActiveTileAvailableAfterContainerModified } from 'common/actions/fire';
import { addToQueue, deleteFromQueue, getQueue } from 'common/api/queue';
import * as actions from 'common/constants/action-types';
import { QUEUE_CONTAINER_ID } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { isPurpleCarpetContentSelector } from 'common/features/purpleCarpet/selector';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { QueueItemType } from 'common/types/queue';
import type { ContentType, ReminderActionRF } from 'common/types/reminder';
import type { StoreState } from 'common/types/storeState';
import type { PageTypeExtraCtx } from 'common/utils/analytics';
import { buildBookmarkEventObject, buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackAppboyEvent, trackEvent } from 'common/utils/track';
import { isComingSoonContent } from 'ott/features/playback/utils/isComingSoonContent';

export type ReminderThunk = ThunkAction<any, StoreState, ApiClient, ReminderActionRF>;

function trackReminderEvent(videoId: string, isSetReminder: boolean, extraCtx?: PageTypeExtraCtx) {
  const reminderEventObject = buildComponentInteractionEvent({
    pathname: getCurrentPathname(),
    userInteraction: isSetReminder ? 'TOGGLE_ON' : 'TOGGLE_OFF',
    component: 'REMINDER',
    section: +videoId,
    extraCtx,
  });
  trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, reminderEventObject);
}

export function add(contentId: string, contentType: ContentType): ReminderThunk {
  return (dispatch, getState) => {
    const id = contentId.startsWith('0') ? contentId.substr(1) : contentId;
    const { video: { byId } } = getState();
    const content = byId[contentId];
    const extraCtx = {
      isUpcoming: isComingSoonContent(content?.availability_starts),
      isLinearDetails: isPurpleCarpetContentSelector(getState(), id),
    };

    trackReminderEvent(contentId, true, extraCtx);
    return dispatch({
      type: actions.ADD_TO_REMINDER,
      contentId,
      payload: () => addToQueue(dispatch, {
        contentId: id,
        contentType,
        queueItemType: QueueItemType.REMIND_ME,
      }).then((data) => {
        // use the Operation.ADD_TO_QUEUE here since they are the same and no individual ADD_REMINDER in Operation
        const bookmarkEventObject = buildBookmarkEventObject(getCurrentPathname(), contentId, Operation.ADD_TO_QUEUE, undefined, extraCtx);
        trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
        trackAppboyEvent(eventTypes.APPBOY_ADD_BOOKMARK);
        return data;
      }).catch((error) => {
        logger.error({ error, contentId }, 'add to reminder action fail');
      }),
    });
  };
}

export function remove(itemId: string, contentId: string, location: Location): ReminderThunk {
  return (dispatch, getState) => {
    const { byId } = getState().video;
    const content = byId[contentId];
    const extraCtx = {
      isUpcoming: isComingSoonContent(content?.availability_starts),
      isLinearDetails: isPurpleCarpetContentSelector(getState(), contentId),
    };
    trackReminderEvent(contentId, false, extraCtx);
    return dispatch({
      type: actions.REMOVE_FROM_REMINDER,
      contentId,
      payload: () => deleteFromQueue(dispatch, itemId).then((data) => {
        if (__ISOTT__) {
          dispatch(ensureActiveTileAvailableAfterContainerModified(location, QUEUE_CONTAINER_ID));
        }
        const bookmarkEventObject = buildBookmarkEventObject(getCurrentPathname(), contentId, Operation.REMOVE_FROM_QUEUE, undefined, extraCtx);
        trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);
        return data;
      }).catch((error) => {
        logger.error({ error, contentId, itemId }, 'remove from reminder action fail');
      }),
    });
  };
}

export function loadReminder(): ReminderThunk {
  return (dispatch, getState) => {
    const { reminder } = getState();

    if (reminder.loading || reminder.loaded) {
      return Promise.resolve();
    }

    return dispatch({
      type: actions.LOAD_REMINDER,
      payload: () => getQueue(dispatch).catch((error) => {
        logger.error({ error }, 'fail to load reminder');
        return Promise.reject(error);
      }),
    });
  };
}
