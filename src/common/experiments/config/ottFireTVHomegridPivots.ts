import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHomegridPivots: 'webott_firetv_homegrid_pivots_v2';
  }
}

TubiExperiments.ottFireTVHomegridPivots = 'webott_firetv_homegrid_pivots_v2';

export const FIRETV_HOMEGRID_PIVOTS = {
  namespace: 'webott_firetv_homegrid_pivots_v2',
  parameter: 'show_pivots',
};

export const getConfig = () => {
  return {
    ...FIRETV_HOMEGRID_PIVOTS,
    id: TubiExperiments.ottFireTVHomegridPivots,
    experimentName: 'webott_firetv_homegrid_pivots_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_pivots', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
