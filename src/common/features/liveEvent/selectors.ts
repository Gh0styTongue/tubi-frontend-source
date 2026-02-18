import { createSelector } from 'reselect';

import { getLocalData } from 'client/utils/localDataStorage';
import { AUTH_ERROR_TIMESTAMP_KEY } from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { containerChildrenIdMapSelector, containerIdMapSelector } from 'common/selectors/container';
import { appVersionSelector } from 'common/selectors/fireUtils';
import { shouldBypassRegistrationGateSelector } from 'common/selectors/remoteConfig';
import { viewportTypeSelector } from 'common/selectors/ui';
import { byIdSelector } from 'common/selectors/video';
import type StoreState from 'common/types/storeState';
import { isSupportedOTTPlatform } from 'ott/features/liveEvent/utils';

import { isLiveEvent, isLiveEventContainer } from './utils';

export const shouldLockLiveEventSelector = (state: StoreState) => {
  const shouldBypassRegistrationGate = shouldBypassRegistrationGateSelector(state);
  if (shouldBypassRegistrationGate) {
    return false;
  }
  const isLoggedIn = isLoggedInSelector(state);
  const canBypassRegistration = __CLIENT__ && !!getLocalData(AUTH_ERROR_TIMESTAMP_KEY);
  return !isLoggedIn && !canBypassRegistration;
};

export const liveEventContainersChildrenMapSelector = createSelector(
  containerIdMapSelector,
  containerChildrenIdMapSelector,
  (containerIdMap, containerChildrenIdMap) => {
    const liveEventContainersChildrenMap: Record<string, string[]> = {};
    Object.values(containerIdMap).forEach(container => {
      if (isLiveEventContainer(container)) {
        liveEventContainersChildrenMap[container.id] = containerChildrenIdMap[container.id];
      }
    });
    return liveEventContainersChildrenMap;
  }
);

export const shouldShowLiveContainerSelector = createSelector(
  containerIdMapSelector,
  containerChildrenIdMapSelector,
  (containerIdMap, containerChildrenIdMap) => {
    const liveEventContainer = Object.values(containerIdMap).find(isLiveEventContainer);
    return !!liveEventContainer && containerChildrenIdMap[liveEventContainer.id]?.length > 0;
  }
);

export const isWebLiveEventPreviewEnabledSelector = createSelector(
  viewportTypeSelector,
  (state: StoreState) => state.player.canAutoplay,
  (state: StoreState) => state.consent.consentRequired,
  (viewportType, canAutoplay, consentRequired) => viewportType === 'desktop' && canAutoplay && !consentRequired
);

export const isLiveEventContentSelector = createSelector(
  [byIdSelector, (_: StoreState, id: string) => id],
  (videos, id: string) => {
    if (!id) return false;
    return isLiveEvent(videos[id]);
  }
);

export const isLiveEventSupportedSelector = createSelector(
  appVersionSelector,
  (appVersion) => {
    if (__WEBPLATFORM__ === 'WEB') {
      return true;
    }
    return isSupportedOTTPlatform(appVersion.code ?? 0);
  }
);

