import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUsingNoCacheCdn: 'webott_firetv_using_no_cache_cdn_v2';
  }
}

TubiExperiments.ottFireTVUsingNoCacheCdn = 'webott_firetv_using_no_cache_cdn_v2';

export const FIRETV_USING_NO_CACHE_CDN = {
  namespace: 'webott_major_platforms_http3_video_v2',
  parameter: 'enable_no_cache',
};

export const getConfig = () => {
  return {
    ...FIRETV_USING_NO_CACHE_CDN,
    id: TubiExperiments.ottFireTVUsingNoCacheCdn,
    experimentName: 'webott_firetv_using_no_cache_cdn_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_no_cache', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
