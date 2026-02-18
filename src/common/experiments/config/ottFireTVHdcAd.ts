import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHdcAd: 'ads_ott_hdc_adformats';
  }
}

TubiExperiments.ottFireTVHdcAd = 'ads_ott_hdc_adformats';

export const FIRETV_HDC_AD = {
  namespace: 'ads_ott_hdc_adformats',
  parameter: 'enabled_arm',
};

export enum FIRETV_HDC_AD_VARIANT {
  control = 'control',
  hdc_carousel = 'carousel',
  hdc_spotlight = 'spotlight',
}

export const getConfig = () => {
  return {
    ...FIRETV_HDC_AD,
    id: TubiExperiments.ottFireTVHdcAd,
    experimentName: 'ads_ott_hdc_adformats_v2',
    defaultValue: FIRETV_HDC_AD_VARIANT.control,
    treatments: [
      { name: 'control', value: FIRETV_HDC_AD_VARIANT.control },
      { name: 'carousel', value: FIRETV_HDC_AD_VARIANT.hdc_carousel },
      { name: 'spotlight', value: FIRETV_HDC_AD_VARIANT.hdc_spotlight },
    ],
    enabledSelector: () => {
      return __IS_MAJOR_PLATFORM__;
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
