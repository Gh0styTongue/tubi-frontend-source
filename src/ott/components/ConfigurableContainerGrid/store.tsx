import { createContext, useContext } from 'react';
import type { StoreApi } from 'zustand';
import { createStore, useStore } from 'zustand';

import { getImageRequestQueue } from 'client/imageRequestQueue/default';
import { normalizeIndex } from 'ott/utils/normalizeIndex';

type ContainerGridState = {
  /**
   * The amount to shift the grid vertically.
   * This is used to shift the grid without changing the virtualization space.
   * Used for passthrough modes.
   */
  shift: number;
  /** The number of items in the grid */
  numItems: number;
  /** The index of the selected row */
  selectedRow: number;
  /** A  map from row index to a height to override the default height from the config */
  rowHeightOverrides: Record<number, number>;
  /** A map from row index to the index of the selected tile in that row */
  selectedTile: Record<number, number>;
  showUpArrow: boolean;
  showDownArrow: boolean;
  showLeftArrow: boolean;
  showRightArrow: boolean;
};

type ContainerGridActions = {
  setRowHeightOverride: (rowIndex: number, offset: number) => void;
  getSelectedTile: () => { row: number; tile: number };
  selectTile: (row: number, tile: number) => void;
  setNumItems: (numItems: number) => void;
  setShift: (shift: number) => void;
  nextTile: (limit?: number, step?: number) => boolean;
  prevTile: (step?: number) => boolean;
  clear: () => void;
  setShowArrows: (arrows: { showUpArrow?: boolean; showDownArrow?: boolean; showLeftArrow?: boolean; showRightArrow?: boolean }) => void;
};

export type ContainerGridStore = ContainerGridState & ContainerGridActions;

const initialStoreState: ContainerGridState = {
  numItems: 0,
  shift: 0,
  selectedRow: 0,
  selectedTile: {},
  rowHeightOverrides: {},
  showUpArrow: false,
  showDownArrow: false,
  showLeftArrow: false,
  showRightArrow: false,
};

// Global store registry to track all created stores
const storeRegistry = new Set<StoreApi<ContainerGridStore>>();

// Function to clear all registered stores
export const clearAllContainerGridStores = () => {
  storeRegistry.forEach(store => {
    store.getState().clear();
  });
};

export const createContainerGridStore = () => {
  const store = createStore<ContainerGridStore>((set, getState) => ({
    ...initialStoreState,
    setShowArrows: (arrows: { showUpArrow?: boolean; showDownArrow?: boolean; showLeftArrow?: boolean; showRightArrow?: boolean }) => {
      set((state) => ({
        ...state,
        showUpArrow: arrows.showUpArrow ?? state.showUpArrow,
        showDownArrow: arrows.showDownArrow ?? state.showDownArrow,
        showLeftArrow: arrows.showLeftArrow ?? state.showLeftArrow,
        showRightArrow: arrows.showRightArrow ?? state.showRightArrow,
      }));
    },
    clear: () => set(initialStoreState),
    setRowHeightOverride: (rowIndex: number, offset: number) => {
      set((state) => ({
        ...state,
        rowHeightOverrides: {
          ...state.rowHeightOverrides,
          [rowIndex]: offset,
        },
      }));
    },
    setShift: (shift: number) => set({ shift }),
    getSelectedTile: () => {
      const state = getState();
      return {
        row: state.selectedRow,
        tile: state.selectedTile[normalizeIndex(state.selectedRow, state.numItems)] || 0,
      };
    },
    selectTile: (rowIndex: number, tileIndex: number) => {
      set((state) => {
        const normalizedRowIndex = normalizeIndex(rowIndex, state.numItems);
        return {
          ...state,
          selectedRow: rowIndex,
          selectedTile: {
            ...state.selectedTile,
            [normalizedRowIndex]: tileIndex,
          },
        };
      });
    },
    nextTile: (limit = Infinity, step = 1) => {
      let changed = false;
      set((state) => {
        const selectedRow = normalizeIndex(state.selectedRow, state.numItems);
        const selectedTile = state.selectedTile[selectedRow] || 0;
        const nextTile = selectedTile + step;
        const nextTileScoped = nextTile >= limit ? selectedTile : nextTile;
        changed = selectedTile !== nextTileScoped;
        return {
          ...state,
          selectedTile: {
            ...state.selectedTile,
            [selectedRow]: nextTileScoped,
          },
        };
      });
      return changed;
    },
    prevTile: (step = 1) => {
      let changed = false;
      set((state) => {
        const selectedRow = normalizeIndex(state.selectedRow, state.numItems);
        const selectedTile = state.selectedTile[selectedRow] || 0;
        const prevTile = selectedTile - step;
        const nextTile = prevTile < 0 ? selectedTile : prevTile;
        changed = selectedTile !== nextTile;
        return {
          ...state,
          selectedTile: {
            ...state.selectedTile,
            [selectedRow]: nextTile,
          },
        };
      });
      return changed;
    },
    setNumItems: (numItems) => set((state) => ({ ...state, numItems })),
  }));

  // Register the store in the global registry
  storeRegistry.add(store);

  // Subscribe to changes to the store and update the active grid element position in the image request queue
  // when the selected row or tile changes. This will need to be updated if we ever have more than one grid on the page.
  const initialState = store.getState();
  const selected = initialState.getSelectedTile();
  getImageRequestQueue().setActiveGridElement(selected.row, selected.tile);
  store.subscribe(state => {
    const selected = state.getSelectedTile();
    getImageRequestQueue().setActiveGridElement(selected.row, selected.tile);
  });

  return store;
};

export const ContainerGridStateContext = createContext<StoreApi<ContainerGridStore> | undefined>(undefined);

function useContainerGridContext() {
  const context = useContext(ContainerGridStateContext);
  if (!context) {
    throw new Error('useContainerGridContext must be used within a ContainerGridStateContext');
  }
  return context;
}

export function useContainerGridState<T>(selector: (state: ContainerGridStore) => T) {
  const store = useContainerGridContext();
  return useStore(store, selector);
}
