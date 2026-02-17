import { createDescriptors, resetDescriptors } from '@tubitv/refetch';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import unset from 'lodash/unset';
import type { AnyAction } from 'redux';

import * as actions from 'common/constants/action-types';
import { CONTENT_MODES } from 'common/constants/constants';
import type { ContainerState } from 'common/types/container';
import { dedupSimpleArray } from 'common/utils/collection';
import { createFilteredReducer, createCompositeReducer } from 'common/utils/reducerTool';

export const initialState: ContainerState = {
  /**
   * Ordered home screen container list
   */
  containersList: [],
  // map ID to container object
  containerIdMap: {},
  // load status of each container, see discussion
  // https://github.com/adRise/www/pull/100#issuecomment-207938058
  containerLoadIdMap: {},
  containerChildrenIdMap: {},
  // container context, will be set whenever entrying container page, cleared whenever leaving video page
  containerContext: '',
  ...resetDescriptors(),
  // for lazyload containers
  nextContainerIndexToLoad: 0,
  sponsorship: {
    pixelsFired: {},
  },
  containerMenuList: [],
  isContainerMenuListLoaded: false,
};

export function containerLoadReducer(state: ContainerState | undefined = {} as ContainerState, action: AnyAction = {} as AnyAction): ContainerState {
  switch (action.type) {
    case actions.LOAD_CONTAINERS.FETCH:
      return {
        ...state,
        ...createDescriptors(action),
      };
    case actions.LOAD_CONTAINERS.SUCCESS:
      // note - this will wipe out existing container including queue / history
      return {
        ...state,
        containersList: action.payload.containerIds,
        containerIdMap: action.payload.idMap,
        containerChildrenIdMap: action.payload.childrenMap,
        containerLoadIdMap: action.payload.loadMap,
        nextContainerIndexToLoad: action.payload.nextContainerIndexToLoad,
        containerMenuList: action.payload.containerMenuList,
        isContainerMenuListLoaded: true,
        personalizationId: action.payload.personalizationId,
        ...createDescriptors(action, action.payload.validDuration),
      };
    case actions.LOAD_CONTAINERS.FAILURE:
      return {
        ...state,
        ...createDescriptors(action),
      };
    case actions.LOAD_CONTAINER:
      return {
        ...state,
        containerLoadIdMap: {
          ...state.containerLoadIdMap,
          [action.id]: {
            ...state.containerLoadIdMap[action.id],
            loading: true,
          },
        },
      };
    case actions.INVALIDATE_CONTAINER: {
      const loadState = state.containerLoadIdMap[action.containerId];
      if (!loadState || (loadState.ttl && loadState.ttl < Date.now())) {
        // container is not loaded or is already expired, so no need to change
        // anything
        return state;
      }
      return {
        ...state,
        containerLoadIdMap: {
          ...state.containerLoadIdMap,
          [action.containerId]: {
            ...state.containerLoadIdMap[action.containerId],
            ttl: 0,
          },
        },
      };
    }
    case actions.LOAD_CONTAINER_SUCCESS:
      let containerChildren;
      if (action.shouldOverride || !(action.id in state.containerChildrenIdMap)) {
        containerChildren = action.result;
      } else {
        containerChildren = dedupSimpleArray(state.containerChildrenIdMap[action.id].concat(action.result));
      }
      return {
        ...state,
        containerLoadIdMap: {
          ...state.containerLoadIdMap,
          [action.id]: {
            loaded: true,
            loading: false,
            cursor: action.cursor,
            totalCount: action.totalCount,
            ttl: action.ttl,
            error: null,
          },
        },
        containerChildrenIdMap: {
          ...state.containerChildrenIdMap,
          [action.id]: containerChildren,
        },
        containerIdMap: {
          ...state.containerIdMap,
          // NOTE @jstern: For legacy behavior, this should not take precedence
          // over current value
          [action.id]: action.container,
        },
        // Legacy behavior for My Stuff page, if the container metadata is not
        // loaded in this content mode add it to the list. This could make the
        // order of containers in the home screen list inaccurate.
        containersList: state.containerIdMap[action.id]
          ? state.containersList
          : state.containersList.concat(action.id),
      };
    case actions.LOAD_CONTAINER_FAIL:
      return {
        ...state,
        containerLoadIdMap: {
          ...state.containerLoadIdMap,
          [action.id]: {
            ...state.containerLoadIdMap[action.id],
            loaded: false,
            loading: false,
            error: action.error,
          },
        },
      };
    case actions.LOAD_CONTAINER_MENU_LIST_SUCCESS:
      return {
        ...state,
        containerIdMap: {
          ...state.containerIdMap,
          ...action.idMap,
        },
        containerMenuList: action.containerMenuList,
        isContainerMenuListLoaded: true,
      };
    default:
      return state;
  }
}

export function containerContentReducer(state: ContainerState | undefined = {} as ContainerState, action: AnyAction = {} as AnyAction): ContainerState {
  const targetContainerId = action.containerId;
  const contentId = action.contentId;

  switch (action.type) {
    case actions.ADD_NEW_CONTENT_TO_CONTAINER:
      return {
        ...state,
        containerChildrenIdMap: {
          ...state.containerChildrenIdMap,
          [targetContainerId]: dedupSimpleArray([
            contentId,
            ...state.containerChildrenIdMap[targetContainerId] || [],
          ]),
        },
      };

    case actions.REMOVE_CONTENT_FROM_CONTAINER:
      let newTargetMap = state.containerChildrenIdMap[targetContainerId] || [];

      newTargetMap = newTargetMap.filter(id => id !== action.contentId);

      return {
        ...state,
        containerChildrenIdMap: {
          ...state.containerChildrenIdMap,
          [targetContainerId]: dedupSimpleArray(newTargetMap),
        },
      };
    default:
      return state;
  }
}

function handleClearPixelsFiredActionForSingleContainer(state: ContainerState, id: string, screen: string): ContainerState {
  const path = ['sponsorship', 'pixelsFired', id, screen];
  const existingValue = get(state, path, null);
  /* istanbul ignore if */
  if (!existingValue) return state;
  const clearPixelsState = {
    ...state,
    sponsorship: {
      ...state.sponsorship,
      pixelsFired: {
        ...state.sponsorship.pixelsFired,
      },
    },
  };
  unset(clearPixelsState, ['sponsorship', 'pixelsFired', id, screen]);
  // also remove the object for the category ID if it is empty
  path.pop();
  if (isEmpty(get(clearPixelsState, path))) {
    unset(clearPixelsState, path);
  }
  return clearPixelsState;
}

function handleClearPixelsFiredActionForAllContainers(state: ContainerState, screen: string): ContainerState {
  const newPixelsFiredState = mapValues(
    state.sponsorship.pixelsFired,
    pixelsFiredForContainer => omit(pixelsFiredForContainer, screen),
  );
  // get rid of any empty objects
  const finalPixelsFiredState = omitBy(newPixelsFiredState, isEmpty);
  return {
    ...state,
    sponsorship: {
      ...state.sponsorship,
      pixelsFired: finalPixelsFiredState,
    },
  };
}

export function containerContextReducer(state: ContainerState = initialState, action: AnyAction = {} as AnyAction): ContainerState {
  switch (action.type) {
    case actions.SET_CONTAINER_CONTEXT:
      return {
        ...state,
        containerContext: action.id,
      };
    case actions.CLEAR_CONTAINER_CONTEXT:
      return {
        ...state,
        containerContext: '',
      };
    default:
      return state;
  }
}

function containerReducer(state: ContainerState = initialState, action: AnyAction = {} as AnyAction): ContainerState {
  switch (action.type) {
    case actions.MARK_PIXELS_FIRED:
      const pixelsFiredState = {
        ...state,
        sponsorship: {
          ...state.sponsorship,
        },
      };
      /* istanbul ignore else */
      if (pixelsFiredState.sponsorship.pixelsFired[action.id] == null) {
        pixelsFiredState.sponsorship.pixelsFired[action.id] = {};
      }
      pixelsFiredState.sponsorship.pixelsFired[action.id][action.screen] = true;
      return pixelsFiredState;
    case actions.CLEAR_PIXELS_FIRED:
      // if we know the container ID, we can be much more targeted and just deal with that container ID
      if (action.id) {
        return handleClearPixelsFiredActionForSingleContainer(state, action.id, action.screen);
      }
      return handleClearPixelsFiredActionForAllContainers(state, action.screen);
    case actions.SET_SPON_EXP:
      return {
        ...state,
        sponsorship: {
          ...state.sponsorship,
          sponExp: action.sponExp,
        },
      };
    case actions.CLEAR_SPON_EXP:
      /* istanbul ignore else */
      if ('sponExp' in state.sponsorship) {
        const newState = {
          ...state,
          sponsorship: {
            ...state.sponsorship,
          },
        };
        delete newState.sponsorship.sponExp;
        return newState;
      }
      /* istanbul ignore next */
      return state;
    case actions.UPDATE_CONTAINER_CURSOR:
      return {
        ...state,
        containerLoadIdMap: {
          ...state.containerLoadIdMap,
          [action.containerId]: {
            ...state.containerLoadIdMap[action.id],
            cursor: action.cursor,
          },
        },
      };
    case actions.CLEAR_SEARCH_STORE_KEYS:
      // clearing up the store to initial state
      return {
        ...state,
        ...resetDescriptors(),
      };
    case actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD:
      // since we removed videos we also want to reset containerLoadIdMap
      return {
        ...state,
        ...resetDescriptors(),
        containerLoadIdMap: {},
      };
    default:
      return state;
  }
}

// containerLoadReducer is used by both contentMode reducer and container reducer
// We only need to handle it when actions are not related to contentMode
const filteredContainerLoadReducer = createFilteredReducer(containerLoadReducer, action => !!(action && (!action.contentMode || action.contentMode === CONTENT_MODES.all)));
const filteredContainerContextReducer = createFilteredReducer(containerContextReducer, action => !!(action && (!action.contentMode || action.contentMode === CONTENT_MODES.all)));
const reducer = createCompositeReducer(containerReducer, filteredContainerLoadReducer, filteredContainerContextReducer, containerContentReducer);

export default reducer;
