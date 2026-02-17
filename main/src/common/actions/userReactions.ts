import type { Location } from 'history';
import type { ThunkAction } from 'redux-thunk';

import type { InvalidateContainerAction } from 'common/actions/container';
import { addNewContentToContainer, removeContentFromContainer, invalidateContainer } from 'common/actions/container';
import { ensureActiveTileAvailableAfterContainerModified } from 'common/actions/fire';
import getApiConfig from 'common/apiConfig';
import {
  LOAD_SINGLE_TITLE_REACTION_SUCCESS,
  ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS,
  ADD_REACTION_FOR_MULTI_TITLES_SUCCESS,
  REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS,
} from 'common/constants/action-types';
import { LINEAR_CONTENT_TYPE, MY_LIKES_CONTAINER_ID } from 'common/constants/constants';
import { getIsEspanolContent } from 'common/features/playback/utils/getIsEspanolContent';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Reaction, ReactionStatus } from 'common/types/userReactions';
import { formatError } from 'common/utils/log';

import { fetchWithToken } from './fetch';

interface LoadSingleTitleReactionSuccessAction {
  type: typeof LOAD_SINGLE_TITLE_REACTION_SUCCESS,
  contentId: string,
  status: ReactionStatus,
}

export interface AddReactionForSingleTitleSuccessAction {
  type: typeof ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS,
  contentId: string,
  reaction: Reaction,
}

export interface AddReactionForMultiTitlesSuccessAction {
  type: typeof ADD_REACTION_FOR_MULTI_TITLES_SUCCESS,
  contentIds: string[],
  reaction: Reaction,
}

export interface RemoveReactionForSingleTitleSuccessAction {
  type: typeof REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS,
  contentId: string,
  reaction: Reaction,
}

export type UserReactionsAction = LoadSingleTitleReactionSuccessAction
  | AddReactionForSingleTitleSuccessAction
  | AddReactionForMultiTitlesSuccessAction
  | RemoveReactionForSingleTitleSuccessAction
  | InvalidateContainerAction;

interface RateSingleTitleResponse {
  status: ReactionStatus;
}

/**
 * Given a content id (either video id or series id starting with "0") load the
 * user reaction for that title into the store
 * @param contentId - e.g. '0300004985' or '543161'
 * @returns an async thunk action
 */
export function loadSingleTitleReaction(contentId: string)
  : ThunkAction<Promise<void>, StoreState, ApiClient, UserReactionsAction> {
  return (dispatch, getState, apiClient) => {
    const apiConfig = getApiConfig();
    return fetchWithToken<RateSingleTitleResponse>(
      `${apiConfig.accountServiceUserPrefix}/preferences/rate/title/${contentId}`, { method: 'get' }
    )(dispatch, getState, apiClient)
      .then((res: RateSingleTitleResponse) => {
        /* istanbul ignore else */
        if (res) {
          dispatch({
            type: LOAD_SINGLE_TITLE_REACTION_SUCCESS,
            contentId,
            status: res.status,
          });
        }
      })
      .catch((err) => {
        logger.error(formatError(err), 'failed to load single title reaction');
        return Promise.reject(err);
      });
  };
}

function patchTitle(
  apiClient: ApiClient,
  dispatch: TubiThunkDispatch<UserReactionsAction>,
  getState: () => StoreState,
  contentId: string | string[],
  action: 'like' | 'dislike' | 'remove-like' | 'remove-dislike',
): Promise<void> {
  const apiConfig = getApiConfig();
  return fetchWithToken<void>(`${apiConfig.accountServiceUserPrefix}/preferences/rate`, {
    method: 'patch',
    data: {
      target: 'title',
      action,
      data: Array.isArray(contentId) ? contentId : [contentId],
    },
  })(dispatch, getState, apiClient);
}

const isLinearContent = (contentId: string, state: StoreState): boolean => {
  const video = state.video.byId[contentId];
  return video.type === LINEAR_CONTENT_TYPE;
};

const updateAffectedContainer = (location: Location, contentId: string, newReaction: Reaction | null): TubiThunkAction<ThunkAction<void, StoreState, ApiClient, UserReactionsAction>> =>
  (dispatch, getState) => {
    const state = getState();
    const video = state.video.byId[contentId];
    // TODO: @ssorensen - when we add favorite channels to my stuff, we'll update that container for linear content rating updates
    const affectedContainerId = isLinearContent(contentId, state) ? null : MY_LIKES_CONTAINER_ID;
    if (affectedContainerId) {
      // optimistically update the container
      if (newReaction === 'like') {
        dispatch(addNewContentToContainer(contentId, affectedContainerId, getIsEspanolContent(video)));
      } else {
        dispatch(removeContentFromContainer(contentId, affectedContainerId, getIsEspanolContent(video)));
        dispatch(ensureActiveTileAvailableAfterContainerModified(location, affectedContainerId));
      }
      // invalidate the container - it's no longer valid because we need a new
      // pagination cursor
      dispatch(invalidateContainer(location, affectedContainerId));
    }
  };

/**
 * Mark multi movies or series as liked or disliked
 * @param contentIds - e.g. ['0300004985'] or ['543161']
 * @param reaction - either 'like' or 'dislike'
 * @returns an async thunk action
 */
export function addReactionForMultiTitles(
  contentIds: string[],
  reaction: Reaction
): ThunkAction<Promise<void>, StoreState, ApiClient, UserReactionsAction> {
  return (dispatch, getState, apiClient) =>
    patchTitle(apiClient, dispatch, getState, contentIds, reaction)
      .then(() => {
        dispatch({
          type: ADD_REACTION_FOR_MULTI_TITLES_SUCCESS,
          contentIds,
          reaction,
        });
      })
      .catch((err) => {
        logger.error(formatError(err), `failed to ${reaction} multi titles`);
        return Promise.reject(err);
      });
}

/**
 * Mark a movie or series as liked or disliked
 * @param contentId - e.g. '0300004985' or '543161'
 * @param reaction - either 'like' or 'dislike'
 * @returns an async thunk action
 */
export function addReactionForSingleTitle(location: Location, contentId: string, reaction: Reaction)
  : ThunkAction<Promise<void>, StoreState, ApiClient, UserReactionsAction> {
  return (dispatch, getState, apiClient) =>
    patchTitle(apiClient, dispatch, getState, contentId, reaction)
      .then(() => {
        dispatch({
          type: ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS,
          contentId,
          reaction,
        });
        dispatch(updateAffectedContainer(location, contentId, reaction));
      })
      .catch((err) => {
        logger.error(formatError(err), `failed to ${reaction} single title`);
        return Promise.reject(err);
      });
}

/**
 * Remove reaction for a movie or series
 * @param contentId - e.g. '0300004985' or '543161'
 * @param reaction - either 'like' or 'dislike'
 * @returns an async thunk action
 */
export function removeReactionForSingleTitle(location: Location, contentId: string, reaction: Reaction)
  : ThunkAction<Promise<void>, StoreState, ApiClient, UserReactionsAction> {
  return (dispatch, getState, apiClient) =>
    patchTitle(apiClient, dispatch, getState, contentId, `remove-${reaction}`)
      .then(() => {
        dispatch({
          type: REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS,
          contentId,
          reaction,
        });
        dispatch(updateAffectedContainer(location, contentId, null));
      })
      .catch((err) => {
        logger.error(formatError(err), `failed to remove ${reaction} for single title`);
        return Promise.reject(err);
      });
}
