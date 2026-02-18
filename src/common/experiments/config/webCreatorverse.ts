import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webCreatorverse: 'webott_web_creatorverse';
  }
}

TubiExperiments.webCreatorverse = 'webott_web_creatorverse';

export const WEB_CREATORVERSE = {
  namespace: 'webott_web_creatorverse',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_CREATORVERSE,
    id: TubiExperiments.webCreatorverse,
    experimentName: 'webott_web_creatorverse',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'with_creatorverse', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
