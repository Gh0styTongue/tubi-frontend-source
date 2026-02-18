import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLinearErrorSlate: 'webott_firetv_linear_error_slate_v0';
  }
}

TubiExperiments.ottFireTVLinearErrorSlate = 'webott_firetv_linear_error_slate_v0';

export const FIRETV_LINEAR_ERROR_SLATE = {
  namespace: 'webott_firetv_linear_error_slate_v0',
  parameter: 'use_picture_slate',
};

export const getConfig = () => {
  return {
    ...FIRETV_LINEAR_ERROR_SLATE,
    id: TubiExperiments.ottFireTVLinearErrorSlate,
    experimentName: 'webott_firetv_linear_error_slate_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_picture_slate', value: true },
    ],
    enabledSelector() {
      // FIXME: return `true` if the experiment is meant to be enabled on this platform.
      // If it is meant to be enabled on all platforms (very rare), you can remove this function altogether.
      // Here is an example, uncomment it to save time and modify as needed.
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
