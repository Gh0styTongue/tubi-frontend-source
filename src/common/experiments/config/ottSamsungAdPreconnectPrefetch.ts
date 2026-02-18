import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungAdPreconnectPrefetch: 'webott_samsung_ad_preconnect_prefetch_v1';
  }
}

TubiExperiments.ottSamsungAdPreconnectPrefetch = 'webott_samsung_ad_preconnect_prefetch_v1';

export enum SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE {
  CONTROL = 'no_pre_connect',
  PRE_CONNECT = 'pre_connect',
  DNS_PREFETCH = 'dns_prefetch',
  BUNDLED = 'bundled',
}

export const SAMSUNG_AD_PRECONNECT_PREFETCH = {
  namespace: 'webott_samsung_ad_preconnect_prefetch_v1',
  parameter: 'ad_pre_connect_method',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_AD_PRECONNECT_PREFETCH,
    id: TubiExperiments.ottSamsungAdPreconnectPrefetch,
    experimentName: 'webott_samsung_ad_preconnect_prefetch_v1',
    defaultValue: SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE.CONTROL } as const,
      { name: 'pre_connect', value: SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE.PRE_CONNECT } as const,
      { name: 'dns_prefetch', value: SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE.DNS_PREFETCH } as const,
      { name: 'bundled', value: SAMSUNG_AD_PRECONNECT_PREFETCH_VALUE.BUNDLED } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
