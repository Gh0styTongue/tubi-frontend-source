import { createSelector } from 'reselect';

import { GRID_SECTION, CONTENT_MODES } from 'common/constants/constants';
import { isInGDPRCountryWithKidsSelector } from 'common/features/gdpr/selectors/gdpr';
import { containerSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { OTTStoreState, StoreState } from 'common/types/storeState';
import { DeeplinkType } from 'common/utils/deeplinkType';

const ottUISelector = (state: StoreState) => state.ottUI;

export const activeVideoSelector = (state: StoreState, { pathname }: { pathname: string }) => {
  const { ottUI, video, epg } = state;
  const {
    debouncedGridUI: { activeContainerId, gridIndex, section },
    epg: { activeContentId: activeEPGContentId },
  } = ottUI;
  const container = containerSelector(state, { pathname });
  const activeContainerChildren = container.containerChildrenIdMap[activeContainerId];
  const isGridActive = section === GRID_SECTION;

  if (activeEPGContentId) {
    return epg.byId[activeEPGContentId] || video.byId[activeEPGContentId];
  }

  // user is on grid - show content based on containerChildrenIdMap array
  // special case is utility menu, use default
  if (activeContainerChildren && isGridActive) {
    const activeContainerChildrenIndex = activeContainerChildren[gridIndex];
    return video.byId[activeContainerChildrenIndex];
  }
};

export function isGridActiveSelector({
  fire: {
    containerUI: { section },
  },
  ottUI: {
    leftNav: { isExpanded: isNavOpen },
    ageGate: { isVisible: isAgeGateVisible },
  },
}: StoreState) {
  return section === GRID_SECTION && !isNavOpen && !isAgeGateVisible;
}

export function isVideoPreviewEnabledSelector(state: StoreState) {
  const {
    ottUI: { videoPreview },
  } = state;
  return (
    FeatureSwitchManager.isEnabled(['VideoPreview']) ||
    (__SHOULD_SHOW_VIDEO_PREVIEWS__ && videoPreview.enabled && !FeatureSwitchManager.isDisabled(['VideoPreview']))
  );
}

export function isVideoPreviewAutostartEnabledSelector(state: StoreState) {
  const {
    ottUI: {
      videoPreview: { autostart },
    },
  } = state;
  return !isInGDPRCountryWithKidsSelector(state) && autostart;
}

export function isAutoplayEnabledSelector(state: StoreState) {
  const {
    ottUI: {
      autoplay: { enabled },
    },
  } = state;
  const disableAutostart = isInGDPRCountryWithKidsSelector(state);
  return !disableAutostart && enabled;
}

export function isContainerVideoPreviewEnabledSelector(state: StoreState) {
  const {
    ottUI: { videoPreview },
  } = state;
  return (
    (__SHOULD_SHOW_VIDEO_PREVIEWS__ || FeatureSwitchManager.isEnabled(['CategoryVideoPreview'])) && videoPreview.enabled
  );
}

export const linearContainerSelector = (state: StoreState, { pathname }: { pathname: string }): string[] | undefined => {
  const {
    fire: { containerUI },
    container: { containerChildrenIdMap },
  } = state;
  const { containerId } = containerUI;
  const contentMode = currentContentModeSelector(state, { pathname });
  if (contentMode === CONTENT_MODES.linear) {
    const {
      contentMode: {
        linear: { containerChildrenIdMap },
      },
    } = state;
    return containerChildrenIdMap[containerId];
  }
  return containerChildrenIdMap[containerId];
};

export function isSidePanelActiveSelector(store: StoreState) {
  const {
    ottUI: { leftNav },
  } = store;
  return leftNav.isExpanded;
}

// we would like use this in client side to check intro video is enabled or not
export const shouldRenderIntroVideoSelector = (state: StoreState) => {
  if (!__OTTPLATFORM__) return false;
  const { ended, disabled } = state.ottUI.intro;
  return !disabled && !ended;
};

export const inputModeSelector = (state: OTTStoreState) => state.ottUI.inputMode;

export const deeplinkTypeSelector = createSelector(ottUISelector, ({ deeplinkType }) => deeplinkType);

export const isLaunchedByDeeplinkSelector = createSelector(
  deeplinkTypeSelector,
  (deeplinkType) => deeplinkType !== DeeplinkType.None
);

export const browseWhileWatchingCacheKeySelector = createSelector(
  ottUISelector,
  ({ browseWhileWatchingCacheKey }) => browseWhileWatchingCacheKey
);
