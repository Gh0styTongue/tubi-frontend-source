import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webNewFeaturedBillboard: 'webott_web_new_featured_billboard_v2';
  }
}

TubiExperiments.webNewFeaturedBillboard = 'webott_web_new_featured_billboard_v2';

export const FEATURED_BILLBOARD_CONTROL = 'control';
export const FEATURED_BILLBOARD_WITH_DOTS = 'featured_billboard_with_dots';
export const FEATURED_BILLBOARD_WITH_POSTERS = 'featured_billboard_with_posters';

export const FEATURED_BILLBOARD = {
  namespace: 'webott_web_new_featured_billboard_v2',
  parameter: 'featured_billboard',
};

export type TreatmentName = 'control' | 'featured_billboard_with_dots' | 'featured_billboard_with_posters';

export const getConfig = (): ExperimentConfig<TreatmentName, TreatmentName> => {
  return {
    ...FEATURED_BILLBOARD,
    id: 'webott_web_new_featured_billboard_v2', // for use in introPage, use a constant id
    experimentName: 'webott_web_new_featured_billboard_v2',
    defaultValue: __WEBPLATFORM__ === 'WEB' ? FEATURED_BILLBOARD_WITH_DOTS : FEATURED_BILLBOARD_CONTROL,
    treatments: [
      { name: 'control', value: FEATURED_BILLBOARD_CONTROL },
      { name: 'featured_billboard_with_dots', value: FEATURED_BILLBOARD_WITH_DOTS },
      { name: 'featured_billboard_with_posters', value: FEATURED_BILLBOARD_WITH_POSTERS },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
