import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webFeaturedRow: 'webott_web_featured_row_v2';
  }
}

TubiExperiments.webFeaturedRow = 'webott_web_featured_row_v2';

export const WEB_FEATURED_ROW = {
  namespace: 'webott_web_featured_row',
  parameter: 'use_container_row',
};

export const getConfig = () => {
  return {
    ...WEB_FEATURED_ROW,
    id: TubiExperiments.webFeaturedRow,
    experimentName: 'webott_web_featured_row_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'container_row', value: true },
    ],
    enabledSelector: (state: StoreState) => __WEBPLATFORM__ === 'WEB' && !state.ui.isMobile,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
