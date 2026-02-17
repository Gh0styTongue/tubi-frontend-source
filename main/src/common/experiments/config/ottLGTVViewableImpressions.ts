import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVViewableImpressions: 'webott_lgtv_viewable_impressions_2';
  }
}

TubiExperiments.ottLGTVViewableImpressions = 'webott_lgtv_viewable_impressions_2';

export const LGTV_VIEWABLE_IMPRESSIONS = {
  namespace: 'webott_lgtv_viewable_impressions_2',
  parameter: 'intersectionObserverEnabled',
};

export const getConfig = () => {
  return {
    ...LGTV_VIEWABLE_IMPRESSIONS,
    id: TubiExperiments.ottLGTVViewableImpressions,
    experimentName: 'webott_lgtv_viewable_impressions_2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'viewable_impressions', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
