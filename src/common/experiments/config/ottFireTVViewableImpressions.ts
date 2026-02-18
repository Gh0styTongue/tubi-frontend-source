import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVViewableImpressions: 'webott_firetv_viewable_impressions';
  }
}

TubiExperiments.ottFireTVViewableImpressions = 'webott_firetv_viewable_impressions';

export const FIRETV_VIEWABLE_IMPRESSIONS = {
  namespace: 'webott_firetv_viewable_impressions',
  parameter: 'intersectionObserverEnabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_VIEWABLE_IMPRESSIONS,
    id: TubiExperiments.ottFireTVViewableImpressions,
    experimentName: 'webott_firetv_viewable_impressions',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'viewable_impressions', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
