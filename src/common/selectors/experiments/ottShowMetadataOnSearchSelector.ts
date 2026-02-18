import { getConfig, SHOW_METADATA_ON_SEARCH } from 'common/experiments/config/ottShowMetadataOnSearch';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottShowMetadataOnSearchSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...SHOW_METADATA_ON_SEARCH,
  config: getConfig(),
});
