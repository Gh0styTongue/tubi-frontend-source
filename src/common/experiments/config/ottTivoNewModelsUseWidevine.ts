import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottTivoNewModelsUseWidevine: 'webott_tivo_new_models_use_widevine';
  }
}

TubiExperiments.ottTivoNewModelsUseWidevine = 'webott_tivo_new_models_use_widevine';

// The new Tivo model will not set the tivo global object; you can check `tivo.ts`
function isNewTivoModelDevice() {
  return typeof window !== 'undefined' && !window.tivo;
}

export const TIVO_NEW_MODELS_USE_WIDEVINE = {
  namespace: 'webott_tivo_new_models_use_widevine',
  parameter: 'use_widevine',
};

export const getConfig = () => {
  return {
    ...TIVO_NEW_MODELS_USE_WIDEVINE,
    id: TubiExperiments.ottTivoNewModelsUseWidevine,
    experimentName: 'webott_tivo_new_models_use_widevine',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_widevine', value: true },
    ],
    enabledSelector: () => {
      if (__OTTPLATFORM__ === 'TIVO' && isNewTivoModelDevice()) {
        return true;
      }

      return false;
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
