import { resetDescriptors } from '@tubitv/refetch';
import type { AnyAction } from 'redux';

import type { ContainerState } from 'common/types/container';
import { createCompositeReducer, createFilteredReducer } from 'common/utils/reducerTool';

import { containerContentReducer, containerContextReducer, containerLoadReducer } from './container';

export type SurfaceState = Record<string, ContainerState>;

// Same shape as the state seen in container reducer
export function createInitialContainerState(): ContainerState {
  return {
    containersList: [],
    nextContainerIndexToLoad: 0,
    containerIdMap: {},
    containerLoadIdMap: {},
    containerChildrenIdMap: {},
    containerContext: '',
    containerMenuList: [],
    isContainerMenuListLoaded: false,
    containerMenuRefetchState: {},
    sponsorship: {
      pixelsFired: {},
    },
    ...resetDescriptors(),
  };
}

export const initialState: SurfaceState = {};

// Base reducer to handle surface-level concerns
export function surfaceBaseReducer(state = initialState, action: AnyAction = {} as AnyAction): SurfaceState {
  // Only process actions with surfaceId
  if (!action?.surfaceId) {
    return state;
  }

  // Ensure the surface exists in state (initialize if needed)
  if (!state[action.surfaceId]) {
    return {
      ...state,
      [action.surfaceId]: createInitialContainerState(),
    };
  }

  return state;
}

// Filter to only handle actions with surfaceId
const surfaceFilter = (action?: AnyAction) => !!action?.surfaceId;

// Create filtered versions of container reducers for surface data
export const filteredLoadReducer = createFilteredReducer(
  (state: SurfaceState = initialState, action: AnyAction = {} as AnyAction) => {
    const surfaceId = action.surfaceId;
    const currentSurfaceState = state[surfaceId] || createInitialContainerState();

    return {
      ...state,
      [surfaceId]: containerLoadReducer(currentSurfaceState, action),
    };
  },
  surfaceFilter
);

export const filteredContextReducer = createFilteredReducer(
  (state: SurfaceState = initialState, action: AnyAction = {} as AnyAction) => {
    const surfaceId = action.surfaceId;
    const currentSurfaceState = state[surfaceId] || createInitialContainerState();

    return {
      ...state,
      [surfaceId]: containerContextReducer(currentSurfaceState, action),
    };
  },
  surfaceFilter
);

export const filteredContentReducer = createFilteredReducer(
  (state: SurfaceState = initialState, action: AnyAction = {} as AnyAction) => {
    const surfaceId = action.surfaceId;
    const currentSurfaceState = state[surfaceId] || createInitialContainerState();

    return {
      ...state,
      [surfaceId]: containerContentReducer(currentSurfaceState, action),
    };
  },
  surfaceFilter
);

// Compose all reducers
const reducer = createCompositeReducer(
  surfaceBaseReducer,
  filteredLoadReducer,
  filteredContextReducer,
  filteredContentReducer
);

export default reducer;
