import { resetDescriptors } from '@tubitv/refetch';
import { combineReducers } from 'redux';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES } from 'common/constants/constants';
import type { ContainerState } from 'common/types/container';
import { createCompositeReducer, createFilteredReducer } from 'common/utils/reducerTool';
import type { ContentModeState } from 'src/common/types/contentMode';

import { containerContentReducer, containerContextReducer, containerLoadReducer } from './container';
import * as actions from '../constants/action-types';

// TODO: Needs definition
type ContentModeContainerSharedAction = any;

function createInitialState(): ContainerState {
  return {
    containersList: [],
    nextContainerIndexToLoad: 0,
    // map ID to container object
    containerIdMap: {},
    // load status of each container, see discussion
    // https://github.com/adRise/www/pull/100#issuecomment-207938058
    containerLoadIdMap: {},
    containerChildrenIdMap: {},
    containerContext: '',
    containerMenuList: [],
    isContainerMenuListLoaded: false,
    sponsorship: {
      pixelsFired: {},
    },
    ...resetDescriptors(),
  };
}

export function createReducer(type: CONTENT_MODE_VALUE) {
  const initState = createInitialState() as ContainerState;
  const reducer = (state = initState, action?: ContentModeContainerSharedAction) => {
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.RESET_CONTENT_MODE:
        return initState;
      default:
        return state;
    }
  };
  // containerLoadReducer is used by both contentMode reducer and container reducer
  // We only need to handle it when actions includes contentMode
  const loadRelatedReducer = createFilteredReducer<typeof initState, ContentModeContainerSharedAction>(
    containerLoadReducer,
    (action) => action?.contentMode === type || action?.contentMode === CONTENT_MODES.all,
  );
  const contextRelatedReducer = createFilteredReducer<typeof initState, ContentModeContainerSharedAction>(
    containerContextReducer,
    (action) => action && (action.contentMode === type || action.type === actions.CLEAR_CONTAINER_CONTEXT),
  );

  // We only run content related reducer when the content type is the same as the content type of this reducer
  // For example, if you are handling content such as series, the reducer of movie mode should not pay attention to it.
  const contentRelatedReducer = createFilteredReducer<typeof initState, ContentModeContainerSharedAction>(
    containerContentReducer,
    (action, state) => {
      if (!action || typeof action.contentId !== 'string') {
        return false;
      }

      const { contentId, containerId, isEspanolContent } = action;

      // If the target container in the target content mode is not loaded, we don't touch it.
      // Once user scroll down and loading the target container in the next page request, it will fetch latest data.
      if (!state || !state.containerLoadIdMap[containerId]?.loaded) {
        return false;
      }

      const isSeriesContent = contentId.startsWith('0');

      switch (type) {
        case CONTENT_MODES.tv:
          return isSeriesContent;
        case CONTENT_MODES.movie:
          return !isSeriesContent;
        case CONTENT_MODES.espanol:
          return isEspanolContent;
        default:
          return true;
      }
    },
  );
  const compositeReducer = createCompositeReducer(reducer, contentRelatedReducer, loadRelatedReducer, contextRelatedReducer);
  return compositeReducer;
}
// export for test only
export const movieReducer = createReducer(CONTENT_MODES.movie);
export const tvReducer = createReducer(CONTENT_MODES.tv);
const myStuffReducer = createReducer(CONTENT_MODES.myStuff);
const linearReducer = createReducer(CONTENT_MODES.linear);
export const espanolReducer = createReducer(CONTENT_MODES.espanol);
const browseWhileWatchingReducer = createReducer(CONTENT_MODES.browseWhileWatching);

// Use for test only
export const initialState = {
  movie: createInitialState(),
  tv: createInitialState(),
  myStuff: createInitialState(),
  linear: createInitialState(),
  latino: createInitialState(),
  browseWhileWatching: createInitialState(),
} as unknown as ContentModeState;

export default combineReducers({
  movie: movieReducer,
  tv: tvReducer,
  myStuff: myStuffReducer,
  linear: linearReducer,
  latino: espanolReducer,
  browseWhileWatching: browseWhileWatchingReducer,
});

