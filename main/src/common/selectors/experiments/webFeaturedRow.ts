import { getConfig, WEB_FEATURED_ROW } from 'common/experiments/config/webFeaturedRow';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webFeaturedRowExperimentSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...WEB_FEATURED_ROW,
  config: getConfig(),
});
