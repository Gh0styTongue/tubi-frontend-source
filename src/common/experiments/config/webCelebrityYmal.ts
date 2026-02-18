import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webCelebrityYmal: 'webott_web_celebrity_ymal_v2';
  }
}

TubiExperiments.webCelebrityYmal = 'webott_web_celebrity_ymal_v2';

export const WEB_CELEBRITY_YMAL = {
  namespace: 'webott_web_celebrity_ymal_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_CELEBRITY_YMAL,
    id: TubiExperiments.webCelebrityYmal,
    experimentName: 'webott_web_celebrity_ymal_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'celebrity_ymal_row', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
