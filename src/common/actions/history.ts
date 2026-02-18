import { Operation } from '@tubitv/analytics/lib/genericEvents';
import camelCasify from 'camelcasify';
import type { Location } from 'history';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { batchAddVideos } from 'common/actions/video';
import type { AddHistoryRequestData, LoadByIdHistoryRequestData, LoadHistoryRequestData, LoadRecentHistoryRequestData } from 'common/api/history';
import { makeLoadByIdHistoryRequest, makeLoadRecentHistoryRequest, makeLoadHistoryRequest, makeRemoveHistoryRequest, makeAddHistoryRequest } from 'common/api/history';
import * as eventTypes from 'common/constants/event-types';
import { load as loadAuth } from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { computeCreditTime } from 'common/features/playback/utils/computeCreditTime';
import { getIsEspanolContent } from 'common/features/playback/utils/getIsEspanolContent';
import tubiHistory from 'common/history';
import type { AddToHistoryStartPayload, AddToHistorySuccessPayload } from 'common/types/history';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { buildBookmarkEventObject } from 'common/utils/analytics';
import { getNextEpisodeId } from 'common/utils/episode';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { formatHistoryContents, formatSeriesIdInHistory, getHistoryFromContentIdMap } from 'common/utils/history';
import { formatError } from 'common/utils/log';
import { getPlatform } from 'common/utils/platform';
import { isBetweenStartAndEndTime } from 'common/utils/remoteConfig';
import { trackEvent } from 'common/utils/track';

import { addNewContentToContainer, removeContentFromContainer, syncContainerForAllContentModes } from './container';
import { ensureActiveTileAvailableAfterContainerModified } from './fire';
import * as actions from '../constants/action-types';
import { HISTORY_CONTAINER_ID, SPORTS_EVENT_CONTENT_TYPE } from '../constants/constants';
import type ApiClient from '../helpers/ApiClient';
import logger from '../helpers/logging';
import type { TubiThunkAction } from '../types/reduxThunk';

const platform = getPlatform();

function addToHistoryStart(contentId: string, result: AddToHistoryStartPayload) {
  return {
    type: actions.ADD_TO_HISTORY,
    contentId,
    result,
  };
}

function addToHistorySuccess(contentId: string, result: AddToHistorySuccessPayload) {
  return {
    type: actions.ADD_TO_HISTORY_SUCCESS,
    contentId,
    result,
  };
}

function addToHistoryFail(contentId: string, error: Error) {
  return {
    type: actions.ADD_TO_HISTORY_FAIL,
    contentId,
    error,
  };
}

interface GenerateAddToHistoryStartPayloadParams {
  state: StoreState;
  contentId: string;
  contentType: string;
  position: number;
  parentId?: string | null;
}

/**
 * Before post /oz/history returns, generate an action payload on client side for computing resume info.
 * This helps instantly displaying correct resume information if user goes back to OTTDetails from player.
 */
export function generateAddToHistoryStartPayload(params: GenerateAddToHistoryStartPayloadParams): AddToHistoryStartPayload {
  const { state, contentId, contentType, position, parentId } = params;
  let payload: AddToHistoryStartPayload = {
    contentId,
    contentType,
    position,
  };
  if (parentId) {
    payload = {
      ...payload,
      contentId: parentId,
      contentType: 'series',
      position: 0,
      episodes: [{
        contentId,
        position,
      }],
    };
    // if position is in the range of postludes, video resuming should start from next episode
    const { video: { byId } } = state;
    const series = byId[`0${parentId}`] || {};
    const content = byId[contentId] || {};
    const { seasons } = series;
    const {
      duration,
      credit_cuepoints: credits,
    } = content;
    const creditTime = computeCreditTime(duration, credits);
    const nextEpisodeId = getNextEpisodeId(seasons, contentId);
    if (nextEpisodeId && position >= creditTime) {
      payload.position = 1;
      payload.episodes!.push({
        contentId: nextEpisodeId,
        position: 0,
      });
    }
  }
  return payload;
}

export interface AddParams {
  contentId: string;
  contentType: string;
  position: number;
  parentId?: string | null;
  location: Location;
}

/**
 * add content to history
 * @param contentId
 * @param contentType
 * @param position
 * @param parentId
 */
export function add({ location, contentId, contentType: defaultContentType, position, parentId }: AddParams): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return async (dispatch, getState) => {
    const itemId = parentId ? `0${parentId}` : `${contentId}`;
    let contentType = defaultContentType;

    // if position is not a number
    if (isNaN(position)) {
      const error = new Error('position should be a number');

      // @todo monitor the error, and change level to info if we can't avoid this
      logger.error(error, `position should be a number ${position}`);
      return Promise.reject(error);
    }

    // for guests there's no need to save history
    // as backend won't return history for guests
    const state = getState();
    const { video: { byId }, auth, remoteConfig: { major_event_failsafe_start, major_event_failsafe_end } } = state;
    if (isBetweenStartAndEndTime(major_event_failsafe_start, major_event_failsafe_end)) {
      return Promise.resolve();
    }

    const isLoggedIn = isLoggedInSelector(state);
    if (!isLoggedIn) {
      return Promise.resolve();
    }

    if (byId[itemId]?.type === SPORTS_EVENT_CONTENT_TYPE) {
      contentType = 'sports_event';
    }

    // at the start of sending POST /oz/history
    // generate history data on client-side for displaying correct play button status
    const payload = generateAddToHistoryStartPayload({
      state,
      contentId,
      contentType,
      position,
      parentId,
    });
    dispatch(addToHistoryStart(itemId, payload));

    const postData: AddHistoryRequestData = {
      content_id: parseInt(contentId, 10),
      content_type: contentType,
      position: Math.floor(position),
      platform,
    };

    if (parentId) {
      postData.parent_id = parentId;
    }

    /* istanbul ignore else */
    if (auth.user?.userId) {
      postData.user_id = auth.user.userId;
    } else if (auth.deviceId) {
      const deviceId = auth.deviceId;
      postData.device_id = deviceId;
    }

    let data;

    try {
      const response = await makeAddHistoryRequest(dispatch, postData);

      data = Array.isArray(response) ? response[0] : response;
      data = camelCasify(data);

      let result: AddToHistorySuccessPayload;

      /* istanbul ignore next */
      if (Array.isArray(data)) {
        result = data[0];
      } else {
        result = data as AddToHistorySuccessPayload;
      }

      dispatch(addToHistorySuccess(itemId, result));
      // we will dedupe in reducer
      dispatch(addNewContentToContainer(itemId, HISTORY_CONTAINER_ID, getIsEspanolContent(byId[contentId])));
    } catch (error) {
      // user is not authenticated
      if (error.code === 401) {
        dispatch(loadAuth(location));
      }

      dispatch(addToHistoryFail(itemId, error));
      // we intended not to return Promise.reject here
      // for cleaner Sentry records
      // otherwise Sentry would capture unwanted unhandled rejection
      // https://github.com/adRise/www/pull/2996

      /* istanbul ignore next */
      logger.error({
        error,
        data,
        user: auth.user?.userId || {},
      }, 'ERROR - /api/v2/view_history add');
    }
  };
}

/**
 * remove from history
 * @param contentId content id, could be seriesId or videoId
 */
export function remove(location: Location, contentId: string): TubiThunkAction {
  return async (dispatch, getState) => {
    const { history, video: { byId } } = getState();
    const { id: itemId } = getHistoryFromContentIdMap(history.contentIdMap, contentId) || {};

    // content is not in history
    if (!itemId) {
      return Promise.reject();
    }

    // deleting operation is already in progress
    if (history.inProgress[contentId]) {
      return Promise.resolve();
    }

    dispatch(actionWrapper(actions.REMOVE_FROM_HISTORY, { contentId }));

    try {
      await makeRemoveHistoryRequest(dispatch, itemId);

      // Send bookmark event for remove from continue watching
      const bookmarkEventObject = buildBookmarkEventObject(getCurrentPathname(), contentId, Operation.REMOVE_FROM_CONTINUE_WATCHING);
      trackEvent(eventTypes.BOOKMARK, bookmarkEventObject);

      dispatch(actionWrapper(actions.REMOVE_FROM_HISTORY_SUCCESS, { contentId }));
      dispatch(removeContentFromContainer(contentId, HISTORY_CONTAINER_ID, getIsEspanolContent(byId[contentId])));
      if (__ISOTT__) {
        dispatch(ensureActiveTileAvailableAfterContainerModified(location, HISTORY_CONTAINER_ID));
      }

      return Promise.resolve();
    } catch (error) {
      dispatch(actionWrapper(actions.REMOVE_FROM_HISTORY_FAIL, { contentId }));
      logger.error({ error, contentId }, 'ERROR - /api/v2/view_history remove');
      return Promise.reject(error);
    }
  };
}

/**
 * get dataMap from /oz/history and update history store
 */
export function loadHistory(forceUpdate?: boolean): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return async (dispatch, getState) => {
    const { history, auth } = getState();

    // resolve immediately if history is "loading" or "loaded but not force updated"
    if (history.loading || (history.loaded && !forceUpdate)) {
      return Promise.resolve();
    }

    try {
      const qsData: LoadHistoryRequestData = {
        page_enabled: false,
        expand: false,
        platform,
        deviceId: auth.deviceId,
      };
      const response = await makeLoadHistoryRequest(dispatch, qsData);
      /* istanbul ignore else */
      if (response) {
        const { dataMap } = formatSeriesIdInHistory(response);
        // place idMap in history store
        dispatch(actionWrapper(actions.LOAD_HISTORY_SUCCESS, { idMap: dataMap }));
      }

      return Promise.resolve();

    } catch (error) {
      logger.error(formatError(error), 'ERROR - /api/v2/view_history view');
      dispatch(actionWrapper(actions.LOAD_HISTORY_FAIL, { error }));
      return Promise.reject(error);
    }
  };
}

/**
 * get content details from /oz/history and add to video.byId
 */
export const DEFAULT_HISTORY_CONTENTS_LIMIT = 10;
export function loadRecentHistoryContents(limit = DEFAULT_HISTORY_CONTENTS_LIMIT): TubiThunkAction {
  return async (dispatch, getState) => {
    const { auth } = getState();
    try {
      const qsData: LoadRecentHistoryRequestData = {
        excludeFinishedEpisodes: true,
        expand: 'content',
        deviceId: auth.deviceId,
        page_enabled: true,
        per_page: limit,
        platform,
      };
      const response = await makeLoadRecentHistoryRequest(dispatch, qsData);
      /* istanbul ignore else */
      if (response) {
        dispatch(batchAddVideos(formatHistoryContents(response)));
      }
      return Promise.resolve();
    } catch (error) {
      logger.error(formatError(error), 'ERROR - /api/v2/view_history load recent');
      return Promise.reject(error);
    }
  };
}

/**
 * reset history store
 */
export function unloadHistory() {
  return {
    type: actions.UNLOAD_HISTORY,
  };
}

// only 'movie' and 'series' are supported by web. 'episode' will come later
export function loadHistoryById(contentId: string): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction>> {
  return async (dispatch, getState) => {
    const { video: { byId }, auth } = getState();
    let contentType;
    if (byId[contentId] && byId[contentId].type === SPORTS_EVENT_CONTENT_TYPE) {
      contentType = 'sports_event';
    } else {
      contentType = contentId[0] === '0' ? 'series' : 'movie';
    }

    const contentIsInHistoryOnClient = !!getState().history.contentIdMap[contentId];

    try {
      const qsData: LoadByIdHistoryRequestData = {
        contentType,
        contentId,
        deviceId: auth.deviceId,
        platform,
      };
      const response = await makeLoadByIdHistoryRequest(dispatch, qsData);
      /* istanbul ignore if */
      if (!response) return Promise.resolve();
      const [item] = response.items;
      const idMap = {
        [contentId as string]: camelCasify(item),
      };

      const contentIsInHistoryFromServer = !!idMap[contentId];
      if (contentIsInHistoryOnClient && !contentIsInHistoryFromServer) {
        // user has deleted from history on a separate app, update redux history
        dispatch(actionWrapper(actions.ITEM_REMOVED_ON_SEPARATE_DEVICE, { contentId }));
        return Promise.resolve();
      }
      dispatch(actionWrapper(actions.LOAD_HISTORY_BY_ID_SUCCESS, { idMap }));
      return Promise.resolve();
    } catch (error) {
      logger.error(formatError({ error, contentId }), 'ERROR - /api/v2/view_history single id');
      dispatch(actionWrapper(actions.LOAD_HISTORY_BY_ID_FAIL, { err: error }));

      return Promise.reject(error);
    }

  };
}

export function syncAppHistory(location: Location): TubiThunkAction {
  return (dispatch) => {
    return Promise.all([
      dispatch(loadHistory(true)),
      dispatch(syncContainerForAllContentModes(HISTORY_CONTAINER_ID, location)),
    ]).then(() => {
      if (__ISOTT__) {
        dispatch(ensureActiveTileAvailableAfterContainerModified(tubiHistory.getCurrentLocation(), HISTORY_CONTAINER_ID));
      }
    });
  };
}
