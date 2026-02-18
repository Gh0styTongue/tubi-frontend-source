import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webQrReferralsPausescreen: 'webott_web_qr_referrals_pausescreen_v1';
  }
}

TubiExperiments.webQrReferralsPausescreen = 'webott_web_qr_referrals_pausescreen_v1';

export const WEB_QR_REFERRALS_PAUSESCREEN = {
  namespace: 'webott_player_web_shared',
  parameter: 'enable_pause_qr_code',
};

export const getConfig = () => {
  return {
    ...WEB_QR_REFERRALS_PAUSESCREEN,
    id: TubiExperiments.webQrReferralsPausescreen,
    experimentName: 'webott_web_qr_referrals_pausescreen_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_qr_code', value: true },
    ],
    enabledSelector() {
      return __WEBPLATFORM__ === 'WEB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
