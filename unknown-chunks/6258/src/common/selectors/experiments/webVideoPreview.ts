import { createSelector } from 'reselect';

import { getWebVideoPreviewConfig, WEB_VIDEO_PREVIEW } from 'common/experiments/config/webVideoPreview';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webVideoPreviewSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...WEB_VIDEO_PREVIEW,
  config: getWebVideoPreviewConfig(),
});

export const isFeaturedRowPreviewEnabledSelector = createSelector(
  webVideoPreviewSelector,
  (state: StoreState) => state.player.canAutoplay,
  (state: StoreState) => state.consent.consentRequired,
  (experimentValue, canAutoplay, consentRequired) => experimentValue === 'combined' && canAutoplay && !consentRequired
);

export const isTilePreviewEnabledSelector = createSelector(
  webVideoPreviewSelector,
  (state: StoreState) => state.player.canAutoplay,
  (state: StoreState) => state.consent.consentRequired,
  (experimentValue, canAutoplay, consentRequired) => experimentValue !== 'control' && canAutoplay && !consentRequired
);
