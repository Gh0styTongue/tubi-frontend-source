import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type { StoreState } from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webCastingButton: 'Web Casting Button';
  }
}

TubiExperiments.webCastingButton = 'Web Casting Button';

export type TreatmentName = 'control' | 'show_casting_button';

export default (store?: Store<StoreState>) =>
  ExperimentManager(store).registerExperiment<boolean, TreatmentName>({
    id: TubiExperiments.webCastingButton,
    namespace: 'webott_web_casting_button_v3',
    experimentName: 'webott_web_casting_button_v3',
    parameter: 'show_casting_button',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_casting_button', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
  });
