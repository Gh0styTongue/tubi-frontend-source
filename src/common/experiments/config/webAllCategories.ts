import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let browserPage: 'webott_web_all_categories_v4';
  }
}

TubiExperiments.browserPage = 'webott_web_all_categories_v4';

export const WEB_ALL_CATEGORIES = {
  namespace: 'webott_web_all_categories_v4',
  parameter: 'enabled',
};

export function getConfig(): ExperimentConfig<boolean, string> {
  return {
    ...WEB_ALL_CATEGORIES,
    id: TubiExperiments.browserPage,
    experimentName: 'webott_web_all_categories_v4',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: ({ ui: { isMobile } }) => __WEBPLATFORM__ === 'WEB' && !isMobile,
  };
}

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
