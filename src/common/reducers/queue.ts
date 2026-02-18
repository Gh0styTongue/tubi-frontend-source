import {
  LOAD_QUEUE_SUCCESS,
  LOAD_QUEUE_FAIL,
  ADD_TO_QUEUE,
  ADD_TO_QUEUE_SUCCESS,
  ADD_TO_QUEUE_FAIL,
  REMOVE_FROM_QUEUE_SUCCESS,
  REMOVE_FROM_QUEUE_FAIL,
  UNLOAD_QUEUE,
} from 'common/constants/action-types';
import type {
  AddToQueueSuccessAction,
  LoadQueueFailAction,
  LoadQueueSuccessAction,
  QueueAction,
  QueueState,
} from 'common/types/queue';

const actions = {
  LOAD_QUEUE_SUCCESS,
  LOAD_QUEUE_FAIL,
  ADD_TO_QUEUE,
  ADD_TO_QUEUE_SUCCESS,
  ADD_TO_QUEUE_FAIL,
  REMOVE_FROM_QUEUE_SUCCESS,
  REMOVE_FROM_QUEUE_FAIL,
  UNLOAD_QUEUE,
};

/**
 * store schema
 * {
 *   "inProgress": {},
 *   "contentIdMap": {
 *     "61": {
 *       "id": "56cf8be8fa452d8b295a0db8",
 *       "contentType": "series"
 *     },
 *     "168": {
 *       "id": "56d7459983127be752ece3c5",
 *       "contentType": "series"
 *     },
 *     "221": {
 *       "id": "56cf89fbfa452d8b295a0db6",
 *       "contentType": "series"
 *     },
 *     "306890": {
 *       "id": "56cddebd1df90277416c8181",
 *       "contentType": "movie"
 *     },
 *   },
 *   err: { status: 400, message: '' },
 * }
 *
 */
export const initialState = {
  loaded: false,
  loading: false,
  inProgress: {},
  contentIdMap: {},
} as unknown as QueueState;

export default function Queue(state: QueueState = initialState, action: QueueAction) {
  let contentId = '';
  if ('contentId' in action) {
    contentId = action.contentId;
  }

  switch (action.type) {
    case actions.LOAD_QUEUE_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        contentIdMap: {
          ...(action as LoadQueueSuccessAction).idMap,
        },
      };
    case actions.LOAD_QUEUE_FAIL:
      return {
        ...state,
        loaded: false,
        loading: false,
        err: (action as LoadQueueFailAction).error,
      };
    case actions.ADD_TO_QUEUE:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: true,
        },
      };
    case actions.ADD_TO_QUEUE_SUCCESS:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: {
            id: (action as AddToQueueSuccessAction).result.id,
            contentType: (action as AddToQueueSuccessAction).contentType,
          },
        },
      };
    case actions.ADD_TO_QUEUE_FAIL:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        err: (action as LoadQueueFailAction).error,
      };
    case actions.REMOVE_FROM_QUEUE_SUCCESS:
      if (!state.contentIdMap[contentId]) return state;

      delete state.contentIdMap[contentId];

      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
      };
    case actions.REMOVE_FROM_QUEUE_FAIL:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        err: (action as LoadQueueFailAction).error,
      };
    case actions.UNLOAD_QUEUE:
      return initialState;
    default:
      return state;
  }
}
