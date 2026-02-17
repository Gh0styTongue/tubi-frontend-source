import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottTivoEnablePlayreadyDrm: 'webott_tivo_enable_playready_drm';
  }
}

TubiExperiments.ottTivoEnablePlayreadyDrm = 'webott_tivo_enable_playready_drm';

export const TIVO_ENABLE_PLAYREADY_DRM = {
  namespace: 'webott_tivo_enable_playready_drm',
  parameter: 'enable_playready',
};

export const getConfig = () => {
  return {
    ...TIVO_ENABLE_PLAYREADY_DRM,
    id: TubiExperiments.ottTivoEnablePlayreadyDrm,
    experimentName: 'webott_tivo_enable_playready_drm',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_playready', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'TIVO';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
