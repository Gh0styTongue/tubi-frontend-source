import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastSecondPast: 'webott_comcast_ads_second_later_v0';
  }
}

TubiExperiments.ottComcastSecondPast = 'webott_comcast_ads_second_later_v0';

export const COMCAST_SECOND_PAST = {
  namespace: 'webott_comcast_ads_second_later_v0',
  parameter: 'ads_second_later',
};

export const getConfig = () => {
  return {
    ...COMCAST_SECOND_PAST,
    id: TubiExperiments.ottComcastSecondPast,
    experimentName: 'webott_comcast_ads_second_later_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'ads_second_later', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'COMCAST';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
