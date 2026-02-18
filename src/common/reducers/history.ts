import isEqual from 'lodash/isEqual';

import type { HistoryAction, HistoryState } from 'common/types/history';

import * as actions from '../constants/action-types';

/**
 * store schema
 * {
 *   "loaded": true,
 *   "loading: false,
 *   "inProgress": {},
 *   "contentIdMap": {
 *     "0271": {
 *       "userId": 1463822,
 *       "contentId": 271,
 *       "contentType": "series",
 *       "position": 1,
 *       "episodes": {
 *         "0": {
 *           "contentId": 225311,
 *           "position": 120,
 *           "updatedAt": "2016-03-08T20:53:50.675Z"
 *         },
 *         "1": {
 *           "contentId": 225650,
 *           "position": 145,
 *           "updatedAt": "2016-03-08T21:56:58.322Z"
 *         }
 *       },
 *       "createdAt": "2016-03-08T20:53:08.503Z",
 *       "updatedAt": "2016-03-08T21:56:58.326Z",
 *       "id": "56df3bb4fdf92bdb5c153b6f"
 *     },
 *     "305457": {
 *       "userId": 1463822,
 *       "contentId": 305457,
 *       "contentType": "movie",
 *       "position": 120,
 *       "createdAt": "2016-03-08T19:44:47.435Z",
 *       "updatedAt": "2016-03-08T19:44:47.435Z",
 *       "id": "56df2baf15b04382685843c0"
 *     }
 *   },
 * }
 *
 */

/** matrix response Aug 16
 {
  "total_count": 53,
  "more": true,
  "items": [
    {
      "content_id": 369854,
      "content_type": "movie",
      "user_id": 6841012,
      "position": 58,
      "state": "opened",
      "content_length": 7066,
      "updated_at": "2017-08-16T17:47:02.298Z",
      "created_at": "2017-07-24T17:07:17.605Z",
      "id": "59762945c9e280a3408f84f5"
    },
    {
      "content_id": 2076,
      "content_type": "series",
      "user_id": 6841012,
      "position": 4,
      "state": "opened",
      "updated_at": "2017-07-20T21:34:22.701Z",
      "episodes": [
        {
          "content_id": 365929,
          "user_id": 6841012,
          "position": 5,
          "state": "opened",
          "content_length": -1,
          "id": "596fa5f4c9e280a3407c259c"
        },
        {
          "content_id": 366016,
          "user_id": 6841012,
          "position": 1308,
          "state": "opened",
          "content_length": -1,
          "id": "596fe5a6c9e280a3407cef49"
        }
      ],
      "created_at": "2017-07-19T16:44:03.799Z",
      "id": "596f8c53c9e280a3407bdbc0"
    }
  ]
}
*/

export const initialState: HistoryState = {
  loaded: false,
  loading: false,
  inProgress: {},
  contentIdMap: {},
};

export default function history(state: HistoryState = initialState, action: HistoryAction): HistoryState {
  const contentId = action.contentId;
  const result = action.result;

  switch (action.type) {
    case actions.LOAD_HISTORY_FAIL:
      return {
        ...state,
        loaded: false,
        loading: false,
        err: action.error,
      };
    case actions.LOAD_HISTORY_SUCCESS:
      const newState = {
        ...state,
        loading: false,
        loaded: true,
      };
      if (!isEqual(action.idMap, state.contentIdMap)) {
        newState.contentIdMap = {
          ...action.idMap,
        };
      }
      return newState;
    case actions.LOAD_HISTORY_BY_ID_SUCCESS:
      return {
        ...state,
        contentIdMap: {
          ...state.contentIdMap,
          ...action.idMap,
        },
      };
    case actions.ADD_TO_HISTORY:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: true,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: result,
        },
      };
    case actions.ADD_TO_HISTORY_SUCCESS:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: result,
        },
      };
    case actions.ADD_TO_HISTORY_FAIL:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        err: action.error,
      };
    case actions.REMOVE_FROM_HISTORY:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: true,
        },
      };
    case actions.REMOVE_FROM_HISTORY_SUCCESS:
    case actions.ITEM_REMOVED_ON_SEPARATE_DEVICE:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: false,
        },
      };
    case actions.REMOVE_FROM_HISTORY_FAIL:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        err: action.error,
      };
    case actions.UNLOAD_HISTORY:
      return initialState;
    default:
      return state;
  }
}
