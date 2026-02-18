import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxonePauseFragmentDownload: 'webott_xboxone_pause_fragment_download_v0';
  }
}

TubiExperiments.ottXboxonePauseFragmentDownload = 'webott_xboxone_pause_fragment_download_v0';

export const XBOXONE_PAUSE_FRAGMENT_DOWNLOAD = {
  namespace: 'webott_xboxone_pause_fragment_download',
  parameter: 'pause_fragment_download_v0',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'pause_fragment_download';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...XBOXONE_PAUSE_FRAGMENT_DOWNLOAD,
    id: TubiExperiments.ottXboxonePauseFragmentDownload,
    experimentName: 'webott_xboxone_pause_fragment_download_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'pause_fragment_download', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
