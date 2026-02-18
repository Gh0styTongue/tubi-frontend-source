import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRemoveCwRowForFirstSessionGuest: 'webott_firetv_remove_cw_row_for_first_session_guest';
  }
}

TubiExperiments.ottFireTVRemoveCwRowForFirstSessionGuest = 'webott_firetv_remove_cw_row_for_first_session_guest';

export const FIRETV_REMOVE_CW_ROW_FOR_FIRST_SESSION_GUEST = {
  namespace: 'webott_firetv_remove_cw_row_for_first_session_guest',
  parameter: 'show_relevant_titles',
};

export const getConfig = () => {
  return {
    ...FIRETV_REMOVE_CW_ROW_FOR_FIRST_SESSION_GUEST,
    id: TubiExperiments.ottFireTVRemoveCwRowForFirstSessionGuest,
    experimentName: 'webott_firetv_remove_cw_row_for_first_session_guest',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_relevant_titles', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
