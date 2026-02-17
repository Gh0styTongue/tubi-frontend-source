import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSkinsAd: 'ads_tubi_skin_mufasa';
  }
}

TubiExperiments.ottFireTVSkinsAd = 'ads_tubi_skin_mufasa';

export const FIRETV_SKINS_AD = {
  namespace: 'ads_tubi_skins',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_SKINS_AD,
    id: TubiExperiments.ottFireTVSkinsAd,
    experimentName: 'ads_tubi_skin_mufasa',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skins_eligible', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
