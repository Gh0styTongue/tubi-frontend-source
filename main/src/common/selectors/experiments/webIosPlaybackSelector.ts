import { createSelector } from 'reselect';

import { getConfig, WEB_IOS_PLAYBACK, WEB_IOS_PLAYBACK_VARIANTS } from 'common/experiments/config/webIosPlayback';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

const webIosPlaybackSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_IOS_PLAYBACK,
    config: getConfig(),
  });

export const isMobileWebIosPlaybackEnabledSelector = createSelector(webIosPlaybackSelector, (value) => value !== WEB_IOS_PLAYBACK_VARIANTS.DISABLED);

export const isWebkitMobileInstallBannerEnabledSelector = createSelector(webIosPlaybackSelector, (value) => value === WEB_IOS_PLAYBACK_VARIANTS.ENABLED_WITH_BANNER);
