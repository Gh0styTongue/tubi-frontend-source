import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVWrapper: 'ads_tubi_skins_v1';
  }
}

TubiExperiments.ottFireTVWrapper = 'ads_tubi_skins_v1';

export const FIRETV_WRAPPER = {
  namespace: 'ads_tubi_skins',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_WRAPPER,
    id: TubiExperiments.ottFireTVWrapper,
    experimentName: 'ads_tubi_skins_v1',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skins_eligible', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
