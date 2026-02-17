import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAutocomplete: 'webott_firetv_autocomplete_v1';
  }
}

TubiExperiments.ottFireTVAutocomplete = 'webott_firetv_autocomplete_v1';

export const FIRETV_AUTOCOMPLETE = {
  namespace: 'webott_firetv_autocomplete_v1',
  parameter: 'enabled',
};

export const getConfig = (): ExperimentConfig<boolean, string> => {
  return {
    ...FIRETV_AUTOCOMPLETE,
    id: TubiExperiments.ottFireTVAutocomplete,
    experimentName: 'webott_firetv_autocomplete_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'autocomplete', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
