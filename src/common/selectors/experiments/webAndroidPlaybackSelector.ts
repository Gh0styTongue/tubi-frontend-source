import { createSelector } from 'reselect';

import { getConfig, WEB_ANDROID_DISABLE_PLAYBACK } from 'common/experiments/config/webAndroidDisablePlayback';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

const webAndroidPlaybackSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_ANDROID_DISABLE_PLAYBACK,
    config: getConfig(),
  });

export const isMobileWebAndroidPlaybackEnabledSelector = createSelector(webAndroidPlaybackSelector, (disabled) => !disabled);
