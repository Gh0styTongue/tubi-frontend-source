import { FIRETV_CONTENT_NOT_FOUND, getConfig } from 'common/experiments/config/ottFireTVContentNotFound';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVContentNotFoundSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_CONTENT_NOT_FOUND,
  config: getConfig(),
});
