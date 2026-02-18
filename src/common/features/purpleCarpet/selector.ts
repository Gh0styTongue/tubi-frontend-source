import { createSelector } from 'reselect';

import {
  BANNER_CONTAINER_ID,
  FREEZED_EMPTY_ARRAY,
  HYB_APP_PURPLE_CARPET_BUILD_CODE,
  PURPLE_CARPET_CONTAINER_ID,
} from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isPurpleCarpetSupportedPlatform } from 'common/features/purpleCarpet/constants';
import { PurpleCarpetContentStatus, PurpleCarpetStatus } from 'common/features/purpleCarpet/type';
import { appVersionSelector } from 'common/selectors/fireUtils';
import { isMajorEventActiveSelector, shouldBypassRegistrationGateSelector } from 'common/selectors/remoteConfig';
import { viewportTypeSelector } from 'common/selectors/ui';
import { byIdSelector } from 'common/selectors/video';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getContentIdFromDetailsPageUrl, isHomeUrl } from 'common/utils/urlPredicates';
import { isVideoResolution4K } from 'common/utils/video';
import { homeActiveContainerIdSelector } from 'ott/containers/Home/selectors';

import { getExactTimeFromListing, getPurpleCarpetContentStatus, purpleCarpetSettings } from './util';

const containerChildrenIdMapSelector = ({ container: { containerChildrenIdMap } }: StoreState) =>
  containerChildrenIdMap;

export const purpleCarpetContentsSelector = createSelector(
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  containerChildrenIdMapSelector,
  byIdSelector,
  (isKidsModeEnabled, childrenMap, byId) => {
    if (isKidsModeEnabled) return FREEZED_EMPTY_ARRAY;
    const ids: string[] = childrenMap[PURPLE_CARPET_CONTAINER_ID] || childrenMap[BANNER_CONTAINER_ID] || FREEZED_EMPTY_ARRAY;
    return ids.map((id) => byId[id]);
  }
);

export const purpleCarpetCurrentContentIdsSelector = createSelector(
  ({ container: { containerChildrenIdMap } }: StoreState) => containerChildrenIdMap,
  ({ ui: { currentDate } }: StoreState) => currentDate,
  (state: StoreState) => state.purpleCarpet.listing,
  (childrenMap, currentDate, listing) => {
    const ids: string[] = childrenMap[PURPLE_CARPET_CONTAINER_ID] ? [...childrenMap[PURPLE_CARPET_CONTAINER_ID]] : FREEZED_EMPTY_ARRAY;
    // Filter ended content
    return ids.filter(id => {
      const { endTime } = getExactTimeFromListing(listing, id);
      return endTime && endTime >= currentDate.getTime();
    });
  }
);

export const purpleCarpetContentsStatusSelector = createSelector(
  purpleCarpetContentsSelector,
  ({ ui: { currentDate } }: StoreState) => currentDate,
  (state: StoreState) => state.purpleCarpet.listing,
  (contents, currentDate, listing) => {
    if (!contents.length) return {};
    const result: Record<string, { id: string, status: PurpleCarpetContentStatus }> = {};
    contents.forEach((content) => {
      const status = getPurpleCarpetContentStatus({ currentDate, listing, content });
      result[content.id] = {
        id: content.id,
        status,
      };
    });
    return result;
  }
);

export const hasBannerSelector = createSelector(
  containerChildrenIdMapSelector,
  byIdSelector,
  (state: StoreState) => state.ui.currentDate,
  (_: StoreState, { id }: {id: string}) => id,
  (childrenMap, byId, currentDate, id) => {
    const content = byId[id] as Video;
    const notStarted = content?.air_datetime ? new Date(content.air_datetime).getTime() > currentDate.getTime() : false;
    return notStarted && !childrenMap[PURPLE_CARPET_CONTAINER_ID];
  });

export const purpleCarpetContentStatusSelector = createSelector(
  (state: StoreState) => state.purpleCarpet.listing,
  ({ ui: { currentDate } }: StoreState) => currentDate,
  hasBannerSelector,
  byIdSelector,
  (_: StoreState, { id }: { id: string }) => id,
  (listing, currentDate, hasBanner, videos, id) => {
    // Banner phase, the content is not start
    if (hasBanner) {
      return PurpleCarpetContentStatus.NotStarted;
    }
    return getPurpleCarpetContentStatus({ currentDate, listing, content: videos[id] });
  }
);

export const isPurpleCarpetContentSelector = createSelector(
  [byIdSelector, (_: StoreState, id: string) => id],
  (videos, id: string) => {
    if (!id) return false;
    return videos[id]?.player_type === 'fox';
  }
);

export const isPurpleCarpetContentActiveSelector = createSelector(
  homeActiveContainerIdSelector,
  (state: StoreState, { pathname }: { pathname: string }) => {
    const contentId = getContentIdFromDetailsPageUrl(pathname);
    if (contentId) {
      return isPurpleCarpetContentSelector(state, contentId);
    }
    return false;
  },
  (_: StoreState, { pathname }: { pathname: string }) => pathname,
  (activeContainerId, isPurpleCarpetContentInDetailsPage, pathname) => {
    if (isHomeUrl(pathname)) {
      return activeContainerId === PURPLE_CARPET_CONTAINER_ID;
    }
    return isPurpleCarpetContentInDetailsPage;
  }
);

export const mainGameSelector = createSelector(
  purpleCarpetContentsSelector,
  (contents) => {
    if (!contents.length) return;
    return contents[0].id;
  }
);

export const isSupport4K = (state: StoreState, id: string) => {
  if (__OTTPLATFORM__ === 'FIRETV_HYB' || __OTTPLATFORM__ === 'ANDROIDTV') {
    const content = state.video.byId[id];
    return content && content.video_metadata && isVideoResolution4K(content.video_metadata);
  }
  return false;
};

export const shouldLockPurpleCarpetSelector = (state: StoreState) => {
  const shouldBypassRegistrationGate = shouldBypassRegistrationGateSelector(state);
  if (shouldBypassRegistrationGate) {
    return false;
  }
  const isLoggedIn = isLoggedInSelector(state);
  const { canBypassRegistration } = purpleCarpetSettings;
  return !isLoggedIn && !canBypassRegistration;
};

export const isPurpleCarpetDeportesSelector = createSelector(
  (state: StoreState) => state.purpleCarpet.listing,
  (_: StoreState, contentId: string) => contentId,
  (listing, contentId) => {
    return listing.some(item => item.network === 'foxdep' && item.tubi_id === contentId);
  }
);

export const isWebPurpleCarpetPreviewEnabledSelector = createSelector(
  viewportTypeSelector,
  (state: StoreState) => state.player.canAutoplay,
  (state: StoreState) => state.consent.consentRequired,
  (viewportType, canAutoplay, consentRequired) => viewportType === 'desktop' && canAutoplay && !consentRequired
);

export const shouldShowPurpleCarpetSelector = (state: StoreState) => state.purpleCarpet.status !== PurpleCarpetStatus.NotAvailable;

export const isPurpleCarpetSupportedSelector = createSelector(
  appVersionSelector,
  (appVersion) => {
    /* istanbul ignore next */
    if (FeatureSwitchManager.isEnabled('forceEnablePurpleCarpetData')) {
      return true;
    }
    if (isPurpleCarpetSupportedPlatform()) {
      let versionMatch = true;
      if (__IS_ANDROIDTV_HYB_PLATFORM__ || __OTTPLATFORM__ === 'FIRETV_HYB') {
        versionMatch = (appVersion.code ?? 0) >= HYB_APP_PURPLE_CARPET_BUILD_CODE;
      }
      return versionMatch;
    }
    return false;
  }
);

export const shouldEnableDisasterMode = createSelector(
  isPurpleCarpetSupportedSelector,
  isMajorEventActiveSelector,
  (state: StoreState) => state.remoteConfig.disaster_mode_enabled,
  (isSupported, isMajorEventActive, isDisasterModeEnabled) => {
    return isSupported && isDisasterModeEnabled && isMajorEventActive;
  }
);
