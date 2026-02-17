import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSecondPast: 'webott_firetv_ads_second_later_v0';
  }
}

TubiExperiments.ottFireTVSecondPast = 'webott_firetv_ads_second_later_v0';

export const FIRETV_SECOND_PAST = {
  namespace: 'webott_firetv_ads_second_later_v0',
  parameter: 'ads_second_later',
};

export const getConfig = () => {
  return {
    ...FIRETV_SECOND_PAST,
    id: TubiExperiments.ottFireTVSecondPast,
    experimentName: 'webott_firetv_ads_second_later_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
