import type { Container } from 'common/types/container';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';

/**
 * Get background image (not poster) for homescreen
 * @param activeContainerId active container id
 * @param state redux sotre
 * @returns image url string
 */
export const getHomescreenBackgroundImage = (activeContainerId: string, state: StoreState): string => {
  const { container, ui, video } = state;
  const { containerChildrenIdMap, containerIdMap } = container;
  const { isSlowDevice, containerIndexMap } = ui;

  let isContainer;
  let selectedContent = {};

  if (!isSlowDevice) {
    // selectedContent is used for loading backgrounds, slow devices do not load backgrounds
    const currentIndex = containerIndexMap[activeContainerId];
    const currentItems = containerChildrenIdMap[activeContainerId] || [];
    const currentItemId = currentItems[currentIndex];
    // check if it is a container (in case of complex containers), otherwise video content
    isContainer = !!containerIdMap[currentItemId];
    selectedContent = (isContainer ? containerIdMap[currentItemId] : video.byId[currentItemId]) || {};
  }

  const imageUrls = isContainer
    ? (selectedContent as Container).backgrounds || []
    : [
      ...((selectedContent as Video).backgrounds || []),
      ...((selectedContent as Video).posterarts || []),
    ];

  return imageUrls[0] || '';
};
