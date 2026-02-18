import omit from 'lodash/omit';
import trim from 'lodash/trim';

import * as actions from 'common/constants/action-types';
import { OTT_SEARCH_MAX_KEYWORD_LEN } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import type { SearchAction, SearchState } from 'common/types/search';

/**
 *  store shape
 *
 * {
 * "loading": {
 *   "st": false,
 *   "s": false,
 *   "sa": false,
 *  },
 * "fromPath": "/",
 * "key": "sa",
 * "recommendedContainerIds": ["1611"],
 * "hash": {
 *   "st": [
 *     { // video item }
 *   ],
 *   "s": [],
 *   "sa": []
 * }
 * }
 *
 */
export const initialState = {
  loading: {},
  fromPath: '/',
  key: '',
  recommendedContainerIds: [],
  hash: {},
  activeIdx: null,
  keyboard: {
    rowIndex: 0,
    columnIndex: 0,
  },
  isVoiceSearch: false,
  activeSection: 0,
} as unknown as SearchState;

export default function search(state: SearchState = initialState, action: SearchAction): SearchState {
  // some actions contain the search key in the `payload` property, others directly on the top level.
  /* istanbul ignore next */
  const key = action.key === undefined && action.payload ? action.payload.key : action.key;
  const trimmedKey = trim(key || '');

  let fromPath = [
    /* istanbul ignore next */
    action.payload && action.payload.fromPath,
    /* istanbul ignore next */
    action.payload && action.payload.path,
    action.fromPath,
    action.path,
  ].find(str => typeof str === 'string' && str !== '') || '';

  if (fromPath && fromPath.indexOf(`${WEB_ROUTES.search}/`) === 0) {
    fromPath = '';
  }

  switch (action.type) {
    case actions.LOAD_SEARCH_EPIC:
      return {
        ...state,
        key: (key || '').slice(0, OTT_SEARCH_MAX_KEYWORD_LEN),
      };
    case actions.LOAD_SEARCH_START:
      return {
        ...state,
        fromPath: !__IS_SLOW_PLATFORM__ ? (fromPath || state.fromPath) : initialState.fromPath,
        recommendedContainerIds: state.recommendedContainerIds,
        loading: {
          // clear out all other keys to prevent things from being stuck as loading
          [trimmedKey]: true,
        },
        hash: {
          ...omit(state.hash, trimmedKey),
        },
      };
    case actions.SET_IS_VOICE_SEARCH:
      return {
        ...state,
        isVoiceSearch: action.result,
      };
    case actions.ABORT_SEARCH:
      return {
        ...state,
        loading: {},
        isVoiceSearch: false,
      };
    case actions.LOAD_SEARCH_SUCCESS:
      return {
        ...state,
        loading: {
          ...state.loading,
          [trimmedKey]: false,
        },
        hash: {
          [trimmedKey]: action.result,
        },
        isVoiceSearch: false,
      };
    case actions.LOAD_SEARCH_FAIL:
      return {
        ...state,
        loading: {
          ...state.loading,
          [trimmedKey]: false,
        },
        error: action.error,
        isVoiceSearch: false,
      };
    case actions.SEARCH_STORE_SRC_PATH:
      return {
        ...state,
        fromPath,
      };
    case actions.CLEAR_SEARCH:
      return {
        ...state,
        key: '',
        // otherwise the recommended results appear to slide up quickly from the bottom,
        // which is probably a bit on the nose.
        activeIdx: 0,
      };
    case actions.LOAD_RECOMMENDATION:
      return {
        ...state,
        recommendedContainerIds: action.recommendedContainerIds,
      };
    case actions.CLEAR_SEARCH_STORE_KEYS:
      return {
        ...initialState,
        recommendedContainerIds: state.recommendedContainerIds,
      };
    case actions.SEARCH_SET_ACTIVE_IDX:
      return {
        ...state,
        activeIdx: action.activeIdx,
      };
    case actions.SEARCH_SET_KEYBOARD_INDEXES:
      const { rowIndex, columnIndex } = action;
      return {
        ...state,
        keyboard: {
          rowIndex,
          columnIndex,
        },
      };
    case actions.SET_ACTIVE_SEARCH_SECTION:
      const { activeSection } = action;
      return {
        ...state,
        activeSection,
      };
    default:
      return state;
  }
}
