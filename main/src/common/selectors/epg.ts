import { createSelector } from 'reselect';

import type { LiveContentMode } from 'common/constants/constants';
import {
  LIVE_CONTENT_MODES,
  FAVORITE_LINEAR_CHANNEL_CONTAINER_ID,
  CONTENT_MODES,
  FREEZED_EMPTY_ARRAY,
  SPANISH_CONTAINERS,
} from 'common/constants/constants';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import type { Program } from 'common/types/epg';
import type { StoreState } from 'common/types/storeState';

export interface LinearRowContent {
  id: string;
  title: string;
  logo: string;
  programs?: Program[];
}

export const isActiveContentNotInFirstRowSelector = createSelector(
  shouldShowOTTLinearContentSelector,
  currentContentModeSelector,
  ({
    ottUI: {
      epg: { focusedContentId },
    },
  }: StoreState) => focusedContentId,
  ({
    epg: {
      contentIdsByContainer: { [LIVE_CONTENT_MODES.all]: allLinearContainerIdMap },
    },
  }: StoreState) => allLinearContainerIdMap,
  (epgEnabled, activeContentMode, focusedContentId, allLinearContainerIdMap) => {
    const firstValidLinearRow = allLinearContainerIdMap.find((v) => !!v.contents.length);

    return (
      epgEnabled &&
      activeContentMode === CONTENT_MODES.linear &&
      !!focusedContentId &&
      !!firstValidLinearRow &&
      firstValidLinearRow.contents[0] !== focusedContentId
    );
  }
);

export const favoritedChannelsSelector = (state: StoreState, mode = LIVE_CONTENT_MODES.all) =>
  state.epg.contentIdsByContainer[mode].find((item) => (item.container_slug = FAVORITE_LINEAR_CHANNEL_CONTAINER_ID))
    ?.contents || FREEZED_EMPTY_ARRAY;

export const isWebEpgEnabledSelector = createSelector(
  ({ ui: { isMobile } }: StoreState) => isMobile,
  (isMobile) => (__WEBPLATFORM__ === 'WEB' || __WEBPLATFORM__ === 'WINDOWS') && !isMobile
);

const epgSelector = ({ epg }: StoreState) => epg;

export const isAllContainerIdsLoadedSelector = createSelector(
  epgSelector,
  (epg) => epg.containerIdsLoaded[LIVE_CONTENT_MODES.all]
);

export const spanishContentsSelector = createSelector(epgSelector, (epg) => {
  if (!epg.containerIdsLoaded.tubitv_us_linear) {
    return [];
  }
  const spanishContainers = epg.contentIdsByContainer.tubitv_us_linear.filter((container) =>
    SPANISH_CONTAINERS.includes(container.container_slug)
  );

  return spanishContainers.reduce((result, container) => {
    result.push(...container.contents);
    return result;
  }, [] as string[]);
});

export const contentIdsSelector = createSelector(
  epgSelector,
  (_state: StoreState, { contentMode }: { contentMode: LiveContentMode }) => contentMode,
  (epg, contentMode) =>
    epg.contentIdsByContainer[contentMode].reduce<string[]>(
      (previousValue, currentValue) => [...previousValue, ...currentValue.contents],
      []
    )
);

export const byIdSelector = createSelector(epgSelector, (epg) => epg.byId);

export const channelSelector = createSelector(
  epgSelector,
  (_state: StoreState, channelId: string) => channelId,
  (epg, channelId) => epg.byId[channelId]
);
