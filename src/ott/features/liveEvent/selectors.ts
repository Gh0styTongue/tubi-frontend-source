import { createSelector } from 'reselect';

import { isLiveEventContentSelector } from 'common/features/liveEvent/selectors';
import { isLiveEventBannerContainer, isLiveEventContainer, isLiveEventOrBannerContainer } from 'common/features/liveEvent/utils';
import { containerIdMapSelector } from 'common/selectors/container';
import type StoreState from 'common/types/storeState';
import { getContentIdFromDetailsPageUrl } from 'common/utils/urlPredicates';
import { homeActiveContainerIdSelector } from 'ott/containers/Home/selectors';

const containerSelector = createSelector(
  (_state: StoreState, props: { containerId?: string | undefined }) => props.containerId,
  homeActiveContainerIdSelector,
  containerIdMapSelector,
  (containerIdProp, activeContainerId, containerIdMap) => containerIdProp ? containerIdMap[containerIdProp] : containerIdMap[activeContainerId],
);

export const isLiveEventContainerSelector = createSelector(
  containerSelector,
  (container) => isLiveEventContainer(container),
);

export const isLiveEventBannerContainerSelector = createSelector(
  containerSelector,
  (container) => isLiveEventBannerContainer(container),
);

export const isLiveEventOrBannerContainerSelector = createSelector(
  containerSelector,
  (container) => isLiveEventOrBannerContainer(container),
);

export const isLiveEventDetailsPageSelector = (state: StoreState, { pathname }: { pathname: string }) => {
  const contentId = getContentIdFromDetailsPageUrl(pathname);
  if (contentId) {
    return isLiveEventContentSelector(state, contentId);
  }
  return false;
};
