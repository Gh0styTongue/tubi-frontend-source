import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVDisablePreviewsWhileScrolling: 'webott_lgtv_disable_previews_while_scrolling_v1';
  }
}

TubiExperiments.ottLGTVDisablePreviewsWhileScrolling = 'webott_lgtv_disable_previews_while_scrolling_v1';

export const LGTV_DISABLE_PREVIEWS_WHILE_SCROLLING = {
  namespace: 'webott_player_lgtv_shared',
  parameter: 'disable_previews_while_scrolling',
};

export const getConfig = () => {
  return {
    ...LGTV_DISABLE_PREVIEWS_WHILE_SCROLLING,
    id: TubiExperiments.ottLGTVDisablePreviewsWhileScrolling,
    experimentName: 'webott_lgtv_disable_previews_while_scrolling_v1',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_previews', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
