import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVFullHDBadge: 'webott_firetv_full_hd_badge_v1';
  }
}

TubiExperiments.ottFireTVFullHDBadge = 'webott_firetv_full_hd_badge_v1';

export const FIRETV_FULL_HD_BADGE = {
  namespace: 'webott_firetv_full_hd_badge_v1',
  parameter: 'enabled',
};

export const MAX_LEVEL_RESOLUTION_FOR_CONTROL = 800;

export const getConfig = () => {
  return {
    ...FIRETV_FULL_HD_BADGE,
    id: TubiExperiments.ottFireTVFullHDBadge,
    experimentName: 'webott_firetv_full_hd_badge_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
