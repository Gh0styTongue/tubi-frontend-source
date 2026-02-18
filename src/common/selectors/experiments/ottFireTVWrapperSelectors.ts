import { getConfig, FIRETV_WRAPPER } from 'common/experiments/config/ottFireTVWrapper';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVWrapperSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_WRAPPER,
  config: getConfig(),
});
