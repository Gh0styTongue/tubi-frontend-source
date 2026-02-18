import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottCategoriesPageLargePoster: 'webott_major_platforms_categories_page_large_poster';
  }
}

TubiExperiments.ottCategoriesPageLargePoster = 'webott_major_platforms_categories_page_large_poster';

export const CATEGORIES_PAGE_LARGE_POSTER = {
  namespace: 'webott_major_platforms_categories_page_large_poster',
  parameter: 'enable_larger_poster',
};

export const getConfig = () => {
  return {
    ...CATEGORIES_PAGE_LARGE_POSTER,
    id: TubiExperiments.ottCategoriesPageLargePoster,
    experimentName: 'webott_major_platforms_categories_page_large_poster_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'large_poster', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
