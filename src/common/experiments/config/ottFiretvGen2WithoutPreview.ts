import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVGen2WithoutPreview: 'webott_firetv_gen2_without_preview_v1';
  }
}

TubiExperiments.ottFireTVGen2WithoutPreview = 'webott_firetv_gen2_without_preview_v1';

export const FIRETV_GEN2_WITHOUT_PREVIEW = {
  namespace: 'webott_firetv_gen2_without_preview_v1',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_GEN2_WITHOUT_PREVIEW,
    id: TubiExperiments.ottFireTVGen2WithoutPreview,
    experimentName: 'webott_firetv_gen2_without_preview_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: ({ ui: { userAgent: { ua } } }: StoreState) => {
      return __OTTPLATFORM__ === 'FIRETV_HYB' && ua.indexOf('AFTT ') !== -1;
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
