import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDcPromotionRow: 'webott_firetv_dc_promotion_row';
  }
}

TubiExperiments.ottFireTVDcPromotionRow = 'webott_firetv_dc_promotion_row';

export const FIRETV_DC_PROMOTION_ROW = {
  namespace: 'webott_firetv_dc_promotion_row',
  parameter: 'has_dc_promotional_row',
};

export const getConfig = () => {
  return {
    ...FIRETV_DC_PROMOTION_ROW,
    id: TubiExperiments.ottFireTVDcPromotionRow,
    experimentName: 'webott_firetv_dc_promotion_row',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'dc_promotional_row', value: true },
    ],
    enabledSelector: ({ ui: { twoDigitCountryCode } }: StoreState) => __OTTPLATFORM__ === 'FIRETV_HYB' && twoDigitCountryCode === 'US',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
