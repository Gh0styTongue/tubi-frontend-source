import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVCappingBitrateForUnknownBuffering: 'webott_firetv_capping_bitrate_for_unknown_buffering_v0';
  }
}

TubiExperiments.ottFireTVCappingBitrateForUnknownBuffering = 'webott_firetv_capping_bitrate_for_unknown_buffering_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'capping_bitrate_for_unknown_buffering';

export const FIRETV_CAPPING_BITRATE_FOR_UNKNOWN_BUFFERING = {
  namespace: 'webott_firetv_rebuffered_plays_optimization',
  parameter: 'capping_bitrate_for_unknown_buffering_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_CAPPING_BITRATE_FOR_UNKNOWN_BUFFERING,
    id: TubiExperiments.ottFireTVCappingBitrateForUnknownBuffering,
    experimentName: 'webott_firetv_capping_bitrate_for_unknown_buffering_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'capping_bitrate_for_unknown_buffering', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
