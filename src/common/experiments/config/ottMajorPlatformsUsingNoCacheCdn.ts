import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsUsingNoCacheCdn: 'webott_major_platforms_using_no_cache_cdn_v1';
  }
}

TubiExperiments.ottMajorPlatformsUsingNoCacheCdn = 'webott_major_platforms_using_no_cache_cdn_v1';

export const MAJOR_PLATFORMS_USING_NO_CACHE_CDN = {
  namespace: 'webott_major_platforms_using_no_cache_cdn_v1',
  parameter: 'enable_no_cache',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_USING_NO_CACHE_CDN,
    id: TubiExperiments.ottMajorPlatformsUsingNoCacheCdn,
    experimentName: 'webott_major_platforms_using_no_cache_cdn_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_no_cache', value: true },
    ],
    enabledSelector: () =>
      ['FIRETV_HYB', 'ANDROIDTV', 'HILTON', 'HISENSE', 'LGTV', 'COMCAST', 'TIZEN', 'VIZIO'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
