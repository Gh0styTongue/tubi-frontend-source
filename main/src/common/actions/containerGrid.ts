import {
  SET_NETWORK_CONTAINER_GRID_ACTIVE_ID,
  SET_CONTAINER_GRID_ACTIVE_ID,
  SET_CONTAINER_VIDEO_GRID_ACTIVE_ID,
  CLEAR_CONTAINER_SECTION_IDS,
  SET_CONTAINER_GRID_PREVIEW_ID,
} from 'common/constants/action-types';

export interface SetContainerGridActiveIdAction {
  type: typeof SET_CONTAINER_GRID_ACTIVE_ID;
  id: string;
}

export interface SetNetworkContainerGridActiveIdAction {
  type: typeof SET_NETWORK_CONTAINER_GRID_ACTIVE_ID;
  id: string;
}

export interface SetContainerGridPreviewIdAction {
  type: typeof SET_CONTAINER_GRID_PREVIEW_ID;
  id: string;
}

export interface SetContainerVideoGridActiveIdAction {
  type: typeof SET_CONTAINER_VIDEO_GRID_ACTIVE_ID;
  id: string;
}

export interface ClearContainerSectionIdsAction {
  type: typeof CLEAR_CONTAINER_SECTION_IDS;
}

export const setContainerGridActiveId = (id: string): SetContainerGridActiveIdAction => {
  return { type: SET_CONTAINER_GRID_ACTIVE_ID, id };
};

export const setNetworkContainerGridActiveId = (id: string): SetNetworkContainerGridActiveIdAction => {
  return { type: SET_NETWORK_CONTAINER_GRID_ACTIVE_ID, id };
};

export const setContainerVideoGridActiveId = (id: string): SetContainerVideoGridActiveIdAction => {
  return { type: SET_CONTAINER_VIDEO_GRID_ACTIVE_ID, id };
};

export const setContainerGridPreviewId = (id: string): SetContainerGridPreviewIdAction => {
  return { type: SET_CONTAINER_GRID_PREVIEW_ID, id };
};

export const clearContainerGridIDs = (): ClearContainerSectionIdsAction => {
  return { type: CLEAR_CONTAINER_SECTION_IDS };
};
