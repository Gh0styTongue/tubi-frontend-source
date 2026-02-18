import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungSpanishEmailKeyboard: 'webott_samsung_spanish_email_keyboard';
  }
}

TubiExperiments.ottSamsungSpanishEmailKeyboard = 'webott_samsung_spanish_email_keyboard';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottSamsungSpanishEmailKeyboard,
    namespace: 'webott_samsung_spanish_email_keyboard',
    experimentName: 'webott_samsung_spanish_email_keyboard',
    parameter: 'use_spanish_keyboard',
    defaultValue: false,
    treatments: [
      { name: 'control' as const, value: false },
      { name: 'use_spanish_keyboard' as const, value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
