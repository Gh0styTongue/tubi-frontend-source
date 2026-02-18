import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsBwwPeekRowAppearance: 'webott_major_platforms_bww_peek_row_appearance_series_v0';
  }
}

TubiExperiments.ottMajorPlatformsBwwPeekRowAppearance = 'webott_major_platforms_bww_peek_row_appearance_series_v0';

export const BWW_PEEK_ROW_APPEARANCE = {
  namespace: 'webott_player_major_platforms_bww',
  parameter: 'bww_peek_row_style',
};

export const enum BWWPeekRowAppearance {
  CONTROL = 0,
  BOTH = 3,
}

export const getConfig = () => {
  return {
    ...BWW_PEEK_ROW_APPEARANCE,
    id: TubiExperiments.ottMajorPlatformsBwwPeekRowAppearance,
    experimentName: 'webott_major_platforms_bww_peek_row_appearance_series_v0',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: BWWPeekRowAppearance.CONTROL } as const,
      { name: 'both', value: BWWPeekRowAppearance.BOTH } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
