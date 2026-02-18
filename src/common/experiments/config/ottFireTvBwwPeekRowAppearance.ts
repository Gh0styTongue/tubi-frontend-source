import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTvBwwPeekRowAppearance: 'webott_firetv_bww_peek_row_appearance_v0';
  }
}

TubiExperiments.ottFireTvBwwPeekRowAppearance = 'webott_firetv_bww_peek_row_appearance_v0';

export const FIRETV_BWW_PEEK_ROW_APPEARANCE = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'bww_peek_row_style',
};

export const enum BWWPeekRowAppearance {
  CONTROL = 0,
  NO_TITLE = 1,
  BIG_PEEK_ROW = 2,
  BOTH = 3,
}

export const getConfig = () => {
  return {
    ...FIRETV_BWW_PEEK_ROW_APPEARANCE,
    id: TubiExperiments.ottFireTvBwwPeekRowAppearance,
    experimentName: 'webott_firetv_bww_peek_row_appearance_v0',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: BWWPeekRowAppearance.CONTROL } as const,
      { name: 'no_title', value: BWWPeekRowAppearance.NO_TITLE } as const,
      { name: 'big_peek_row', value: BWWPeekRowAppearance.BIG_PEEK_ROW } as const,
      { name: 'both', value: BWWPeekRowAppearance.BOTH } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
