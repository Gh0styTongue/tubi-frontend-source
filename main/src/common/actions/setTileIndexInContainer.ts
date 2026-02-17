import * as actionTypes from '../constants/action-types';
import type * as uiTypes from '../types/ui';

/**
 * Updates state.ui.containerIndexMap[containerId] = index
 */
export const setTileIndexInContainer: (args: { containerId: string; index: number, isExplicit?: boolean }) => uiTypes.SetSelectedContentAction = ({ containerId, index, isExplicit }) => {
  return {
    type: actionTypes.SET_SELECTED_CONTENT,
    containerId,
    index,
    isExplicit: isExplicit ?? true,
  };
};

