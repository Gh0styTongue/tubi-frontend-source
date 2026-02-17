import { getConfig, FORCE_FAILSAFE } from 'common/experiments/config/forceFailsafe';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const forceFailsafeExperimentSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FORCE_FAILSAFE,
  config: getConfig(),
});
