import { useCallback } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Navigation state for a single pivot details page.
 * - selectedContainerIndex: Index of the focused container row (default 0)
 * - containerIndexMap: Maps containerId to the selected tile index within that container
 */
interface PivotNavigationState {
  selectedContainerIndex: number;
  containerIndexMap: Record<string, number>;
}

interface PivotDetailsNavigationStore {
  stateByPivotId: Record<string, PivotNavigationState>;
  setSelectedContainerIndex: (pivotId: string, index: number) => void;
  setSelectedContainerId: (pivotId: string, containerId: string, containerIds: string[]) => void;
  setContentIndex: (pivotId: string, containerId: string, index: number) => void;
  reset: (pivotId: string) => void;
  clearAll: () => void;
}

// Constant for selector fallback - must be stable reference to avoid infinite re-renders
const INITIAL_STATE: PivotNavigationState = {
  selectedContainerIndex: 0,
  containerIndexMap: {},
};

const getInitialState = (): PivotNavigationState => ({
  selectedContainerIndex: 0,
  containerIndexMap: {},
});

export const pivotDetailsNavigationStore = create<PivotDetailsNavigationStore>((set) => ({
  stateByPivotId: {},

  setSelectedContainerIndex: (pivotId, index) => set((state) => {
    const current = state.stateByPivotId[pivotId] ?? getInitialState();
    if (current.selectedContainerIndex === index) return state;

    return {
      stateByPivotId: {
        ...state.stateByPivotId,
        [pivotId]: {
          ...current,
          selectedContainerIndex: index,
        },
      },
    };
  }),

  setSelectedContainerId: (pivotId, containerId, containerIds) => set((state) => {
    const index = containerIds.indexOf(containerId);
    if (index === -1) return state;

    const current = state.stateByPivotId[pivotId] ?? getInitialState();
    if (current.selectedContainerIndex === index) return state;

    return {
      stateByPivotId: {
        ...state.stateByPivotId,
        [pivotId]: {
          ...current,
          selectedContainerIndex: index,
        },
      },
    };
  }),

  setContentIndex: (pivotId, containerId, index) => set((state) => {
    const current = state.stateByPivotId[pivotId] ?? getInitialState();
    if (current.containerIndexMap[containerId] === index) return state;

    return {
      stateByPivotId: {
        ...state.stateByPivotId,
        [pivotId]: {
          ...current,
          containerIndexMap: {
            ...current.containerIndexMap,
            [containerId]: index,
          },
        },
      },
    };
  }),

  reset: (pivotId) => set((state) => ({
    stateByPivotId: {
      ...state.stateByPivotId,
      [pivotId]: getInitialState(),
    },
  })),

  clearAll: () => set(() => ({
    stateByPivotId: {},
  })),
}));

/**
 * Hook to access navigation state for a specific pivot ID.
 *
 * @param pivotId - The pivot surface ID (e.g., from URL params)
 * @returns Navigation state and setters scoped to this pivot
 */
export const usePivotDetailsNavigation = (pivotId: string) => {
  // Get state for this pivot (returns default if not yet initialized)
  // Use INITIAL_STATE constant (not getInitialState()) to avoid new object reference each render
  const state = pivotDetailsNavigationStore(
    useShallow((store) => store.stateByPivotId[pivotId] ?? INITIAL_STATE)
  );

  // Create bound setters that automatically pass pivotId
  const setSelectedContainerIndex = useCallback((index: number) => {
    pivotDetailsNavigationStore.getState().setSelectedContainerIndex(pivotId, index);
  }, [pivotId]);

  const setSelectedContainerId = useCallback((containerId: string, containerIds: string[]) => {
    pivotDetailsNavigationStore.getState().setSelectedContainerId(pivotId, containerId, containerIds);
  }, [pivotId]);

  const setContentIndex = useCallback((containerId: string, index: number) => {
    pivotDetailsNavigationStore.getState().setContentIndex(pivotId, containerId, index);
  }, [pivotId]);

  const reset = useCallback(() => {
    pivotDetailsNavigationStore.getState().reset(pivotId);
  }, [pivotId]);

  return {
    selectedContainerIndex: state.selectedContainerIndex,
    containerIndexMap: state.containerIndexMap,
    setSelectedContainerIndex,
    setSelectedContainerId,
    setContentIndex,
    reset,
  };
};
