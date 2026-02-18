import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungVibes: 'webott_samsung_vibes_v2';
  }
}

TubiExperiments.ottSamsungVibes = 'webott_samsung_vibes_v2';

export const VIBES = {
  namespace: 'webott_samsung_vibes_v2',
  parameter: 'webott_samsung_vibes',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'webott_samsung_vibes';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...VIBES,
    id: TubiExperiments.ottSamsungVibes,
    experimentName: 'webott_samsung_vibes_v2',
    defaultValue: false,
    inYoubora: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'webott_samsung_vibes', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'TIZEN';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
