import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLandscapeCW: 'webott_firetv_landscape_cw_row_v1';
  }
}

TubiExperiments.ottFireTVLandscapeCW = 'webott_firetv_landscape_cw_row_v1';

export const FIRETV_LANDSCAPE_CW = {
  namespace: 'webott_firetv_landscape_cw_row',
  parameter: 'use_landscape',
};

export const getConfig = () => {
  return {
    ...FIRETV_LANDSCAPE_CW,
    id: TubiExperiments.ottFireTVLandscapeCW,
    experimentName: 'webott_firetv_landscape_cw_row_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'landscape', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
