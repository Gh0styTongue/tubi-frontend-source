import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRecommendedChannelsInCa: 'webott_firetv_recommended_channels_in_ca_v2';
  }
}

TubiExperiments.ottFireTVRecommendedChannelsInCa = 'webott_firetv_recommended_channels_in_ca_v2';

export const FIRETV_RECOMMENDED_CHANNELS_IN_CA = {
  namespace: 'webott_firetv_recommended_channels_in_ca_v2',
  parameter: 'enabled',
};

export type Treatment = 'control' | 'enabled';

export const getConfig = (): ExperimentConfig<boolean, Treatment> => {
  return {
    ...FIRETV_RECOMMENDED_CHANNELS_IN_CA,
    id: TubiExperiments.ottFireTVRecommendedChannelsInCa,
    experimentName: 'webott_firetv_recommended_channels_in_ca_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: ({ ui: { twoDigitCountryCode } }) => __OTTPLATFORM__ === 'FIRETV_HYB' && twoDigitCountryCode === 'CA',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
