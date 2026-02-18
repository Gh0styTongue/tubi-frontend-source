import { createSelector } from 'reselect';

import type StoreState from 'common/types/storeState';

export const isWebFeaturedRowRotationEnabledSelector = createSelector(
  ({ remoteConfig: { isWebFeaturedRowRotationEnabled } }: StoreState) => isWebFeaturedRowRotationEnabled,
  (state: StoreState) => state.webUI.contentDetailsModal.isOpen,
  (isWebFeaturedRowRotationEnabled, isContentDetailsModalOpen) => {
    return isWebFeaturedRowRotationEnabled && !isContentDetailsModalOpen;
  }
);
