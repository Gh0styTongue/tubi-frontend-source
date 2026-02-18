import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungSwitchQrCodeToTheLeft: 'webott_samsung_switch_qr_code_to_the_left';
  }
}

TubiExperiments.ottSamsungSwitchQrCodeToTheLeft = 'webott_samsung_switch_qr_code_to_the_left';

export const SAMSUNG_SWITCH_QR_CODE_TO_THE_LEFT = {
  namespace: 'webott_samsung_switch_qr_code_to_the_left',
  parameter: 'switch',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_SWITCH_QR_CODE_TO_THE_LEFT,
    id: TubiExperiments.ottSamsungSwitchQrCodeToTheLeft,
    experimentName: 'webott_samsung_switch_qr_code_to_the_left',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'left', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
