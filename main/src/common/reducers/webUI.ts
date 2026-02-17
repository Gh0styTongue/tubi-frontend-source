import type { Reducer } from 'redux';
import { combineReducers } from 'redux';

import type { SetContentModeAction } from 'common/actions/contentMode';
import * as actions from 'common/constants/action-types';
import type { OtherAction } from 'common/types/reduxHelpers';
import type {
  SetCategoriesExpandAction,
  SetCategoriesChannelsActiveContainer,
  WebUICategoriesPage,
  WebUIContentMode,
  WebUIState,
  WebUIPersonalization,
  PersonalizationAction,
} from 'common/types/webUIState';

export const initialContentModeState: WebUIContentMode = {
  _active: 'all',
  previous: 'all',
};

export const initialCategoriesPageState: WebUICategoriesPage = {
  popularExpanded: false,
  genresExpanded: false,
  collectionsExpanded: false,
  channelsExpanded: false,
  channelsActiveContainerIndex: 0,
};

export const initialPersonalizationState: WebUIPersonalization = {
  dismissedPrompt: false,
  isValidUserForPersonalization: false,
};

export function contentMode(
  state = initialContentModeState,
  action?: SetContentModeAction | { type: typeof actions.RESET_CONTENT_MODE } | OtherAction,
): WebUIContentMode {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case actions.SET_CONTENT_MODE:
      return {
        _active: action.contentMode ?? state._active,
        previous: state._active,
      };
    case actions.RESET_CONTENT_MODE:
      return initialContentModeState;
    default:
      return state;
  }
}

export function categoriesPage(
  state = initialCategoriesPageState,
  action?: SetCategoriesExpandAction | SetCategoriesChannelsActiveContainer | OtherAction,
): WebUICategoriesPage {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case actions.SET_CATEGORIES_EXPANDED:
      return {
        ...state,
        ...action.payload,
      };
    case actions.SET_CATEGORIES_CHANNELS_ACTIVE_CONTAINER:
      return {
        ...state,
        channelsActiveContainerIndex: action.containerIndex,
      };
    default:
      return state;
  }
}

export function personalization(state = initialPersonalizationState, action?: PersonalizationAction | OtherAction) {
  if (!action) {
    return state;
  }

  switch (action.type) {
    case actions.SET_DISMISSED_PERSONALIZATION_PROMPT:
      return {
        ...state,
        dismissedPrompt: action.payload,
      };
    case actions.SET_IS_VALID_USER_FOR_PERSONALIZATION:
      return {
        ...state,
        isValidUserForPersonalization: action.payload,
      };
    default:
      return state;
  }
}

const WebUIReducers: Reducer<WebUIState> = combineReducers({
  contentMode,
  categoriesPage,
  personalization,
});

export const initialState: WebUIState = {
  contentMode: initialContentModeState,
  categoriesPage: initialCategoriesPageState,
  personalization: initialPersonalizationState,
};

// eslint-disable-next-line import/no-unused-modules -- required() in reducers
export default WebUIReducers;
