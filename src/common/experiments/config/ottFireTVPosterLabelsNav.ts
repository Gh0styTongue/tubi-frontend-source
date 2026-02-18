import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPosterLabelsNav: 'webott_firetv_poster_labels_nav_v2';
  }
}

TubiExperiments.ottFireTVPosterLabelsNav = 'webott_firetv_poster_labels_nav_v2';

export const FIRETV_POSTER_LABELS_NAV = {
  namespace: 'webott_firetv_poster_labels_nav',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_POSTER_LABELS_NAV,
    id: TubiExperiments.ottFireTVPosterLabelsNav,
    experimentName: 'webott_firetv_poster_labels_nav_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'with_poster_labels', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
