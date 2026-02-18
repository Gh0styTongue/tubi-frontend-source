import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webDetailsPageRedesign: 'webott_web_details_page_redesign_v1';
  }
}

TubiExperiments.webDetailsPageRedesign = 'webott_web_details_page_redesign_v1';

export const WEB_DETAILS_PAGE_REDESIGN = {
  namespace: 'webott_web_details_page_redesign',
  parameter: 'use_redesign_details_page',
};

export const getConfig = () => {
  return {
    ...WEB_DETAILS_PAGE_REDESIGN,
    id: TubiExperiments.webDetailsPageRedesign,
    experimentName: 'webott_web_details_page_redesign_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'redesign_details_page', value: true },
    ],
    enabledSelector: (state: StoreState) => __WEBPLATFORM__ === 'WEB' && !state.ui.isMobile,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
