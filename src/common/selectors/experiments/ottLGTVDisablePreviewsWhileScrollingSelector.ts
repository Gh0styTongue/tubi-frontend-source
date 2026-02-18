import { getConfig, LGTV_DISABLE_PREVIEWS_WHILE_SCROLLING } from 'common/experiments/config/ottLGTVDisablePreviewsWhileScrolling';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottLGTVDisablePreviewsWhileScrollingSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...LGTV_DISABLE_PREVIEWS_WHILE_SCROLLING,
  config: getConfig(),
});
