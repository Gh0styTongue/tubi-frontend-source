import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsDetachHlsCacheFragments: 'webott_major_platforms_detach_hls_cache_fragments_v2';
  }
}

TubiExperiments.ottMajorPlatformsDetachHlsCacheFragments = 'webott_major_platforms_detach_hls_cache_fragments_v2';

export type TreatmentValue = 0 | 10 | 20;

export type TreatmentName = 'control' | 'cache_fragments_10_seconds' | 'cache_fragments_20_seconds';

export const MAJOR_PLATFORMS_DETACH_HLS_CACHE_FRAGMENTS = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'cache_fragments_v2',
};

const disableReuseVideoElementModels = [
  'AFTT', // reuse video element, not clean downloaded fragments
];

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_DETACH_HLS_CACHE_FRAGMENTS,
    id: TubiExperiments.ottMajorPlatformsDetachHlsCacheFragments,
    experimentName: 'webott_major_platforms_detach_hls_cache_fragments_v2',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'cache_fragments_10_seconds', value: 10 },
      { name: 'cache_fragments_20_seconds', value: 20 },
    ],
    enabledSelector: (state: StoreState) => {
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const disabledModel of disableReuseVideoElementModels) {
          if (userAgent.indexOf(`${disabledModel} `) !== -1) {
            return false;
          }
        }
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
