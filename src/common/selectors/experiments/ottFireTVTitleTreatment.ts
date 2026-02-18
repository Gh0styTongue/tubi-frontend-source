import { FIRETV_TITLE_TREATMENT, getConfig } from 'common/experiments/config/ottFireTVTitleTreatment';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVTitleTreatmentSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_TITLE_TREATMENT,
  config: getConfig(),
});
