import type { QueryStringParams } from '@adrise/utils/lib/queryString';
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { size } from '@adrise/utils/lib/size';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { Location } from 'history';
import isEmpty from 'lodash/isEmpty';

import { clearContainerGridIDs, setContainerVideoGridActiveId } from 'common/actions/containerGrid';
import type { SetDisplayDataParams } from 'common/actions/ottUI';
import { setDisplayData, setLiveChannel } from 'common/actions/ottUI';
import { setTileIndexInContainer } from 'common/actions/ui';
import { setResumePosition } from 'common/actions/video';
import * as actions from 'common/constants/action-types';
import {
  CONTENT_MODES,
  FEATURED_CONTAINER_ID, MY_LIKES_CONTAINER_ID,
} from 'common/constants/constants';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import tubiHistory from 'common/history';
import {
  containerChildrenIdMapSelector,
  containerSelector,
  mostRecentContainerSelector,
  userModifiableContainerIdsSelector,
} from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { ottLGTVDisablePreviewsWhileScrollingSelector } from 'common/selectors/experiments/ottLGTVDisablePreviewsWhileScrollingSelector';
import { linearContainerSelector } from 'common/selectors/ottUI';
import trackingManager from 'common/services/TrackingManager';
import type {
  AppVersion,
  DismissInAppMessageContentAction,
  InAppMessage,
  SetInAppMessageContentAction,
  SetInAppMessageToastVisibleAction,
  SetIsFirstSessionAction,
  SetModelCodeAction,
  SetOTTSelectedSectionAction,
  SetShowSignOutToastAction,
  SetVideoQualityOnLoadAction,
} from 'common/types/fire';
import type StoreState from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { isLinearContainer } from 'common/utils/containerTools';
import { getHomescreenBackgroundImage } from 'common/utils/homeTools';
import { abortablePreloadImages } from 'common/utils/preloadImages';
import { getContentModeParams } from 'common/utils/urlConstruction';

import type { TubiThunkAction } from '../types/reduxThunk';

export type NavigateCallback = (url: string) => void;

export interface PlayFireVideoOptions {
  pos?: number;
  trailerId?: string;
  navigateFunction?: NavigateCallback;
  queryString?: QueryStringParams;
  useReplace?: boolean;
}

/**
 * Set resume position and navigate to the playback URL
 * @param contentId - The video Id (parent video id)
 * @param options
 * @param options.pos - Resume position
 * @param options.trailerId
 * @param options.useReplace - should router replace or push, default to false
 * @param options.navigateFunction - Callback to use for navigation instead of router push
 */
export function playFireVideo(contentId: string, options: PlayFireVideoOptions = {}): TubiThunkAction {
  const { pos = 0, trailerId, navigateFunction, queryString, useReplace = false } = options;
  return (dispatch) => {
    dispatch(setResumePosition(contentId, pos));
    let url = getPlayerUrl(contentId, trailerId);
    if (queryString) {
      url = addQueryStringToUrl(url, queryString);
    }
    if (typeof navigateFunction === 'function') {
      navigateFunction(url);
    } else if (useReplace) {
      tubiHistory.replace(url);
    } else {
      tubiHistory.push(url);
    }
    return Promise.resolve();
  };
}

export interface NavigateWithinContainerOnOTTHomeScreenPayload {
  containerId: string;
  index: number;
  location: Location;
}

/**
 * Updates state.ui.containerIndexMap[containerId] = index
 * Also sends the NavigateWithinPage event as the user moves horizontally in the container.
 */
export function navigateWithinContainerInGrid({
  containerId,
  index,
  location,
}: NavigateWithinContainerOnOTTHomeScreenPayload): TubiThunkAction {
  return (dispatch, getState: () => StoreState) => {
    const state = getState();
    const {
      ui: { containerIndexMap },
    } = state;
    const { containersList, containerChildrenIdMap } = containerSelector(state, { pathname: location.pathname });
    const { [containerId]: idMap = [] } = containerChildrenIdMap;
    let startX = containerIndexMap[containerId] || 0;
    const contentId = idMap[startX];
    if (containerIndexMap[containerId] < 0) {
      startX = 0;
    }

    const containerRowIndex = Math.max(0, containersList.indexOf(containerId));
    trackingManager.sendNavigateWithinPage({
      startX,
      startY: containerRowIndex,
      endX: index,
      endY: containerRowIndex,
      contentId,
      containerId,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });

    return dispatch(
      setTileIndexInContainer({
        containerId,
        index,
        shouldDisablePreviewsWhileScrolling: ottLGTVDisablePreviewsWhileScrollingSelector(state),
      })
    );
  };
}

/**
 * Updates state.fire.containerUI.containerId
 * Also sends the NavigateWithinPage event as the user moves vertically between containers.
 */
export function setOttSelectedContainer({ location, containerId }: { location: Location, containerId: string }): TubiThunkAction {
  return (dispatch, getState: () => StoreState) => {
    const state = getState();
    const {
      fire: {
        containerUI: { containerId: prevContainerId },
      },
      ui: { containerIndexMap },
    } = state;

    const { containersList } = containerSelector(state, { pathname: location.pathname });
    const containerChildrenIdMap = containerChildrenIdMapSelector(state, { pathname: location.pathname });

    // Get the content index within a container row
    const getContentTileIndexInRow = (contId: string) =>
      !isEmpty(containerIndexMap) && containerIndexMap[contId] ? containerIndexMap[contId] : 0;
    // Get the index of container in the homescreen matrix.
    const getContainerRowIndex = (contId: string) => Math.max(containersList.indexOf(contId), 0);

    const startMatrixX = getContentTileIndexInRow(prevContainerId);
    const endMatrixX = getContentTileIndexInRow(containerId);
    const contentId =
      containerChildrenIdMap &&
      containerChildrenIdMap[prevContainerId] &&
      containerChildrenIdMap[prevContainerId][startMatrixX];
    const startY = getContainerRowIndex(prevContainerId);
    const endY = getContainerRowIndex(containerId);

    const baseNavigateWithinPageObject = {
      startX: startMatrixX,
      startY,
      endX: endMatrixX,
      endY,
      contentId,
      containerId: prevContainerId,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    };

    trackingManager.sendNavigateWithinPage(baseNavigateWithinPageObject);

    // Set the index of selected container.
    dispatch({
      type: actions.SET_OTT_SELECTED_CONTAINER,
      containerId,
      shouldDisablePreviewsWhileScrolling: ottLGTVDisablePreviewsWhileScrollingSelector(state),
    });
  };
}

/**
 * updates state.fire.containerUI.section
 * @param section string
 */
export function setOttSelectedSection({ section }: { section: string }): SetOTTSelectedSectionAction {
  return {
    type: actions.SET_OTT_SELECTED_SECTION,
    section,
  };
}

/**
 * fire state (for positioning selector) is translated to container state (displaying 'active' content)
 * use fire state to update information used by Bg-Image and HomeDetails
 */
let homeActiveDataAbort: (() => void) | undefined;
export function setHomeActiveData(location: Location): TubiThunkAction {
  return async (dispatch, getState: () => StoreState) => {
    // abortablePreloadImages is always a resolved promise
    // so we can use a flag to avoid executing unnecessary logic
    // when pre image loading is cancelled
    let homeActiveDataAborted = false;
    if (homeActiveDataAbort) {
      homeActiveDataAbort();
    }

    let state = getState();
    const {
      ui: { isSlowDevice },
      fire: {
        containerUI: { containerId: activeContainerId },
      },
    } = state;
    const shouldPreloadImages = !isSlowDevice && activeContainerId;
    if (shouldPreloadImages) {
      const { promise, abort } = abortablePreloadImages(getHomescreenBackgroundImage(activeContainerId, state));
      homeActiveDataAbort = () => {
        homeActiveDataAborted = true;
        abort();
      };
      await promise;
      homeActiveDataAbort = undefined;
      if (homeActiveDataAborted) return;
    }

    state = getState();

    const {
      fire: { containerUI },
      ui,
      container: { containerIdMap },
    } = state;
    const { containerId, section } = containerUI;
    const { containerIndexMap } = ui;

    const contentMode = currentContentModeSelector(state, { pathname: location.pathname });
    const contentModeParams = getContentModeParams(contentMode);

    const displayData: SetDisplayDataParams = {
      section,
      containerId,
      gridIndex: containerIndexMap[containerId] || 0,
      ...contentModeParams,
    };

    const otherActions = [];

    /**
     * We need to sync the user navigation change on the live news container from the home page to the live channel
     * so that we can play the same content as the home page in the live playback page.
     */
    const container = containerIdMap[containerId];
    if (isLinearContainer(container) || contentMode === CONTENT_MODES.linear) {

      const linearContainer = linearContainerSelector(state, { pathname: location.pathname });
      if (linearContainer) {
        const liveChannelGridIdx = Math.max(displayData.gridIndex, 0);
        otherActions.push(
          setLiveChannel({ index: liveChannelGridIdx, contentId: linearContainer[liveChannelGridIdx] })
        );
      }
    }
    [setDisplayData(displayData), ...otherActions].forEach(dispatch);
  };
}

// Export for testing
export const _resetOTTHomeSelectedStateDeps = {
  setOttSelectedContainer,
  setHomeActiveData,
};

export const resetOTTHomeSelectedState = (location: Location, containerId: string): TubiThunkAction => {
  return (dispatch) => {
    dispatch(actionWrapper(actions.RESET_UI_CONTAINER_INDEX_MAP));
    dispatch(_resetOTTHomeSelectedStateDeps.setOttSelectedContainer({ location, containerId }));
    dispatch(_resetOTTHomeSelectedStateDeps.setHomeActiveData(location));
  };
};

const handleEmptyQueueOrHistoryInHomeScreen = (location: Location): TubiThunkAction => (dispatch, getState) => {
  const {
    ottUI: { debouncedGridUI },
    ui: { containerIndexMap },
  } = getState();
  const featuredGridIndex = containerIndexMap[FEATURED_CONTAINER_ID] || 0;
  dispatch(
    setDisplayData({
      section: debouncedGridUI.section,
      containerId: FEATURED_CONTAINER_ID,
      gridIndex: featuredGridIndex,
    })
  );
  // FIXME this is a temporary solution to keep `fire.containerUI` and `ottUI.debouncedGridUI` consistent
  dispatch(setOttSelectedContainer({ location, containerId: FEATURED_CONTAINER_ID }));
};

export const handleEmptyQueueOrHistoryInContainerSection =
  (containerId: string): TubiThunkAction =>
    (dispatch, getState: () => StoreState) => {
      const {
        ottUI: { containerGrid },
      } = getState();
      // if selected in container grid, clear the selections so it goes back to the first one.
      if (containerId === containerGrid.activeContainerGridId) {
        dispatch(clearContainerGridIDs());
      }
    };

export const handleNonEmptyQueueOrHistoryInHomeScreen =
  (location: Location, activeContainer: string): TubiThunkAction =>
    (dispatch, getState: () => StoreState) => {
    // queue/history is not empty, make sure active tile has not been removed on home screen
      const state = getState();
      const {
        ottUI: { debouncedGridUI },
      } = state;

      const { containerChildrenIdMap } = mostRecentContainerSelector(state, { pathname: location.pathname });
      const { gridIndex } = debouncedGridUI;
      if (containerChildrenIdMap[activeContainer].length <= gridIndex) {
        dispatch(
          setDisplayData({
            section: debouncedGridUI.section,
            containerId: activeContainer,
            gridIndex: 0,
          })
        );
        dispatch(
          setTileIndexInContainer({
            containerId: activeContainer,
            index: 0,
            shouldDisablePreviewsWhileScrolling: ottLGTVDisablePreviewsWhileScrollingSelector(state),
          })
        );
      }
    };

/**
 * Check if container active item is still valid for certain container
 * @param {String} containerId
 */
export const handleNonEmptyQueueOrHistoryInContainerSection =
  (containerId: string): TubiThunkAction =>
    (dispatch, getState: () => StoreState) => {
      const {
        ottUI: { containerGrid },
        container: { containerChildrenIdMap },
      } = getState();

      if (!containerGrid.activeContainerVideoGridId) {
        return;
      }

      const contIdList = containerChildrenIdMap[containerId] || [];
      if (contIdList.length && !contIdList.includes(containerGrid.activeContainerVideoGridId)) {
        dispatch(setContainerVideoGridActiveId(''));
      }
    };

// Update the selected index of a user modifiable container to ensure selectedIndex <= maxIndex
const handleModifiedUserContainerInHomeScreen =
  (location: Location, containerId: string): TubiThunkAction =>
    (dispatch, getState: () => StoreState) => {
      const state = getState();
      const {
        ui: { containerIndexMap },
      } = state;

      const { containerChildrenIdMap } = mostRecentContainerSelector(state, { pathname: location.pathname });

      const maxIndex = Math.max((containerChildrenIdMap[containerId] || []).length - 1, 0);
      const selectedIndex = containerIndexMap[containerId] || 0;

      if (selectedIndex > maxIndex) {
        dispatch(
          setTileIndexInContainer({
            containerId,
            index: maxIndex,
            shouldDisablePreviewsWhileScrolling: ottLGTVDisablePreviewsWhileScrollingSelector(state),
          })
        );
      }
    };

/**
 * after queue is updated in OTT, ensure activeContainerId is not on empty queue or history
 * if dynamic container changes length, make sure gridIndex exists in that length
 */
export function ensureActiveTileAvailableAfterContainerModified(location: Location, containerId: string): TubiThunkAction {
  return (dispatch, getState: () => StoreState) => {
    const state = getState();
    const {
      ottUI: { debouncedGridUI, containerGrid },
      container: { containerChildrenIdMap },
    } = state;

    const { containerChildrenIdMap: contentModeCatChildrenIdMap } = mostRecentContainerSelector(state, { pathname: location.pathname });

    const activeContainerIdOnHomePage = debouncedGridUI.activeContainerId;
    const activeContainerIdInContainerSection = containerGrid.activeContainerGridId;
    const userModifiableContainerIds = userModifiableContainerIdsSelector(state);
    const userContainerIsSelectedInHomeScreen = userModifiableContainerIds.includes(activeContainerIdOnHomePage);
    const userContainerIsSelectedInContainerSection = userModifiableContainerIds.includes(
      activeContainerIdInContainerSection
    );
    const userContainerIsModified = userModifiableContainerIds.includes(containerId);
    const isFromMyStuffPage = state.ottUI.contentMode.previous === CONTENT_MODES.myStuff;

    // handle the modified container on home screen no matter if it is active
    if (userContainerIsModified) {
      dispatch(handleModifiedUserContainerInHomeScreen(location, containerId));
    }

    if (!userContainerIsSelectedInHomeScreen && !userContainerIsSelectedInContainerSection) {
      return;
    }

    // handle the active container on home screen
    if (userContainerIsSelectedInHomeScreen) {
      // a user modifiable container is currently active and it is now empty
      if (size(contentModeCatChildrenIdMap[activeContainerIdOnHomePage]) === 0) {
        // It should not reset the active containerId to 'featured' if it is from
        // the My Stuff page because there is an empty page design (except for
        // the "My Likes" container because we don't render a placeholder row
        // for that one)
        if (isFromMyStuffPage && containerId !== MY_LIKES_CONTAINER_ID) {
          return;
        }
        dispatch(handleEmptyQueueOrHistoryInHomeScreen(location));
      } else {
        dispatch(handleNonEmptyQueueOrHistoryInHomeScreen(location, activeContainerIdOnHomePage));
      }
    }
    // handle the active container on category screen
    if (userContainerIsSelectedInContainerSection) {
      if (size(containerChildrenIdMap[activeContainerIdInContainerSection]) === 0) {
        dispatch(handleEmptyQueueOrHistoryInContainerSection(activeContainerIdInContainerSection));
      } else if (containerId === activeContainerIdInContainerSection) {
        // if we removed from the container we are looking at
        dispatch(handleNonEmptyQueueOrHistoryInContainerSection(containerId));
      }
    }
  };
}

/**
 * set hyb apps version info
 */
export const setHybAppVersion = (hybAppVersion?: AppVersion): TubiThunkAction => {
  return (dispatch) => {
    if (!hybAppVersion) return;

    const { code, semver, clientVersion } = hybAppVersion;

    dispatch(
      actionWrapper(actions.SET_NATIVE_APP_VERSION, {
        version: {
          // android pkg version, like 2.13.10
          semver,
          // combination of native version and webview version
          clientVersion,
          // android build code
          code,
        },
      })
    );
  };
};

/**
 * set device manufacture year
 */
export const setModelCode = (modelCode: string): SetModelCodeAction => {
  return {
    type: actions.SET_MODEL_CODE,
    modelCode,
  };
};

/**
 * set if user is visiting our app for the first time
 */
export const setIsFirstSession = (state: boolean): SetIsFirstSessionAction => {
  return {
    type: actions.SET_IS_FIRST_SESSION,
    state,
  };
};

export const setShowSignOutToastAction = (payload: boolean): SetShowSignOutToastAction => {
  return {
    type: actions.SET_SIGN_OUT_TOAST_STATUS,
    payload,
  };
};

export const setInAppMessageContent = (payload: InAppMessage): SetInAppMessageContentAction => {
  return {
    type: actions.SET_IN_APP_MESSAGE_CONTENT,
    payload,
  };
};

export const setInAppMessageToastVisible = (payload: boolean): SetInAppMessageToastVisibleAction => {
  return {
    type: actions.SET_IN_APP_MESSAGE_TOAST_VISIBLE,
    payload,
  };
};

export const dismissInAppMessageContent = (): DismissInAppMessageContentAction => {
  return {
    type: actions.DISMISS_IN_APP_MESSAGE_CONTENT,
  };
};

export const setVideoQualityOnLoad = (payload: boolean): SetVideoQualityOnLoadAction => {
  return {
    type: actions.SET_VIDEO_QUALITY_ON_LOAD,
    payload,
  };
};
