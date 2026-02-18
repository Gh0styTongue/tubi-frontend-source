import { FIRETV_NEW_CATEGOEY_PAGE, getConfig } from 'common/experiments/config/ottFireTVNewCategoryPage';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVNewCategoryPageSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_NEW_CATEGOEY_PAGE,
  config: getConfig(),
});
