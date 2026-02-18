import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSwapButtonsDetailsPage: 'webott_major_platforms_swap_buttons_details_page';
  }
}

TubiExperiments.ottSwapButtonsDetailsPage = 'webott_major_platforms_swap_buttons_details_page';

export type TreatmentValue = 'none' | 'always' | 'only_from_home';

export type TreatmentName = 'control' | 'swap_always' | 'swap_only_from_home';

export const SWAP_BUTTONS_DETAILS_PAGE = {
  namespace: 'webott_major_platforms_swap_buttons_details_page',
  parameter: 'swap',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...SWAP_BUTTONS_DETAILS_PAGE,
    id: TubiExperiments.ottSwapButtonsDetailsPage,
    experimentName: 'webott_major_platforms_swap_buttons_details_page_v1',
    defaultValue: 'none',
    treatments: [
      { name: 'control', value: 'none' },
      { name: 'swap_always', value: 'always' },
      { name: 'swap_only_from_home', value: 'only_from_home' },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
