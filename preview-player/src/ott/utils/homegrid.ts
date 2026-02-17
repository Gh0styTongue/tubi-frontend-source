import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES } from 'common/constants/constants';
import tubiHistory from 'common/history';
import { ottSideMenuSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import trackingManager from 'common/services/TrackingManager';
import type { Container } from 'common/types/container';
import type StoreState from 'common/types/storeState';
import { findIndex } from 'common/utils/collection';

export const getSelectedContainerIndex = (containersInMenu: Container[], activeContainerId: string) => {
  return findIndex(containersInMenu, cat => cat.id === activeContainerId);
};

export const isNextRowIndexValid = (containersNumber: number, selectedContainerIndex: number, direction: string) => {
  switch (direction) {
    case 'ARROW_UP':
      return selectedContainerIndex > 0;
    case 'ARROW_DOWN':
      return selectedContainerIndex < containersNumber - 1;
    default:
      return true;
  }
};

export const trackNavigateToPageAfterVideoPreviewFinishEvent = ({
  contentId,
}: { contentId: string }, state: StoreState) => {
  const {
    fire: {
      containerUI: {
        containerId: activeContainerId,
      },
    },
    ui: { containerIndexMap },
  } = state;
  const location = tubiHistory.getCurrentLocation();
  const currentMode = currentContentModeSelector(state, { pathname: location.pathname });
  const allowedContentModes: CONTENT_MODE_VALUE[] = [CONTENT_MODES.all, CONTENT_MODES.movie, CONTENT_MODES.tv, CONTENT_MODES.myStuff];
  if (!allowedContentModes.includes(currentMode)) return;

  const containersInMenu = ottSideMenuSelector(state, { pathname: location.pathname });
  const activeContainerIndex = getSelectedContainerIndex(containersInMenu, activeContainerId);
  const activeGridIndex = containerIndexMap[activeContainerId] || 0;

  trackingManager.createNavigateToPageComponent({
    startX: Math.max(activeGridIndex, 0),
    startY: Math.max(activeContainerIndex, 0),
    containerSlug: activeContainerId,
    contentId,
    componentType: ANALYTICS_COMPONENTS.containerComponent,
  });
};
