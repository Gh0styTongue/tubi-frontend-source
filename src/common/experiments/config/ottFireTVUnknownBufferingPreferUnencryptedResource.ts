import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUnknownBufferingPreferUnencryptedResource: 'webott_firetv_unknown_buffering_prefer_unencrypted_resource_v2';
  }
}

TubiExperiments.ottFireTVUnknownBufferingPreferUnencryptedResource = 'webott_firetv_unknown_buffering_prefer_unencrypted_resource_v2';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'use_different_key';

export const FIRETV_UNKNOWN_BUFFERING_PREFER_UNENCRYPTED_RESOURCE = {
  namespace: 'webott_firetv_rebuffered_plays_optimization',
  parameter: 'use_different_key_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_UNKNOWN_BUFFERING_PREFER_UNENCRYPTED_RESOURCE,
    id: TubiExperiments.ottFireTVUnknownBufferingPreferUnencryptedResource,
    experimentName: 'webott_firetv_unknown_buffering_prefer_unencrypted_resource_v2',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_different_key', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
