import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSpotlightCarouselNav: 'webott_firetv_spotlight_carousel_nav';
  }
}

TubiExperiments.ottFireTVSpotlightCarouselNav = 'webott_firetv_spotlight_carousel_nav';

export const FIRETV_SPOTLIGHT_CAROUSEL_NAV = {
  namespace: 'webott_firetv_spotlight_carousel_nav',
  parameter: 'spotlightEnabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_SPOTLIGHT_CAROUSEL_NAV,
    id: TubiExperiments.ottFireTVSpotlightCarouselNav,
    experimentName: 'webott_firetv_spotlight_carousel_nav',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'spotlight', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
