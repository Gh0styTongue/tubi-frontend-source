import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webLandscape: 'webott_web_landscape_v2';
  }
}

TubiExperiments.webLandscape = 'webott_web_landscape_v2';

export enum WEB_LANDSCAPE_VALUE {
  CONTROL = 'none',
  HOVER_TITLE = 'hover_title',
  HOVER_NO_TITLE = 'hover_no_title',
}

export const WEB_LANDSCAPE = {
  namespace: 'webott_web_landscape_v2',
  parameter: 'hover',
};

export const getConfig = () => {
  return {
    ...WEB_LANDSCAPE,
    id: TubiExperiments.webLandscape,
    experimentName: 'webott_web_landscape_v2',
    defaultValue: WEB_LANDSCAPE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: WEB_LANDSCAPE_VALUE.CONTROL } as const,
      { name: 'hover_title', value: WEB_LANDSCAPE_VALUE.HOVER_TITLE } as const,
      { name: 'hover_no_title', value: WEB_LANDSCAPE_VALUE.HOVER_NO_TITLE } as const,
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
