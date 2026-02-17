import { getConfig, WEB_ALL_CATEGORIES } from 'common/experiments/config/webAllCategories';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webAllCategoriesExperimentSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...WEB_ALL_CATEGORIES,
  config: getConfig(),
});
