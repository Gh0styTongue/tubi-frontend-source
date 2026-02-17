import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webSmallerPosters: 'webott_web_smaller_posters';
  }
}

TubiExperiments.webSmallerPosters = 'webott_web_smaller_posters';

export enum WEB_SMALLER_POSTER_VALUE {
  CONTROL = 'none',
  NO_DIVIDERS_6_POSTERS = 'no_dividers_6_posters',
  NO_DIVIDERS_7_POSTERS = 'no_dividers_7_posters',
}

export const WEB_SMALLER_POSTERS = {
  namespace: 'webott_web_smaller_posters',
  parameter: 'smaller_poster',
};

export const getConfig = () => {
  return {
    ...WEB_SMALLER_POSTERS,
    id: TubiExperiments.webSmallerPosters,
    experimentName: 'webott_web_smaller_posters_v2',
    defaultValue: WEB_SMALLER_POSTER_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: WEB_SMALLER_POSTER_VALUE.CONTROL },
      { name: 'no_dividers_6_posters', value: WEB_SMALLER_POSTER_VALUE.NO_DIVIDERS_6_POSTERS },
      { name: 'no_dividers_7_posters', value: WEB_SMALLER_POSTER_VALUE.NO_DIVIDERS_7_POSTERS },
    ],
    enabledSelector: (state: StoreState) => __WEBPLATFORM__ === 'WEB' && !state.ui.isMobile,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
