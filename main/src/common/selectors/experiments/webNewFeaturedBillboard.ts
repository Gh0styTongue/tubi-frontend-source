import { FEATURED_BILLBOARD, getConfig } from 'common/experiments/config/webNewFeaturedBillboard';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webNewFeaturedBillboardSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FEATURED_BILLBOARD,
  config: getConfig(),
});
