import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

import { HDC_CONTAINER_PREFIX } from './constants';
import type { HdcAdCreativetype } from './type';

export const isHdcAdRowActiveSelector = createSelector(
  (state: StoreState) => state.fire.containerUI.containerId,
  (activeContainerId) => activeContainerId?.includes(HDC_CONTAINER_PREFIX) ?? false
);

export const hdcAdSelector = createSelector(
  (state: StoreState) => state.hdcAd,
  (_: StoreState, { containerId, type }: { containerId: string; type: HdcAdCreativetype }) => ({ containerId, type }),
  (hdcAd, { containerId, type }) => {
    if (type === 'native') {
      return hdcAd.nativeCreativeMap?.[containerId]?.impTracking;
    }
    return hdcAd.videoCreativeMap?.[containerId]?.impTracking;
  }
);
