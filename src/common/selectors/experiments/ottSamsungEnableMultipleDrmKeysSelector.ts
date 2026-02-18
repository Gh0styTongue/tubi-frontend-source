/* istanbul ignore file */
import { getConfig } from 'common/experiments/config/ottSamsungEnableMultipleDrmKeys';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

const config: ExperimentConfig<boolean, string> = getConfig();

export const ottSamsungEnableMultipleDrmKeysSelector = (state: StoreState): boolean => {
  const result = popperExperimentsSelector(state, {
    namespace: config.namespace,
    parameter: config.parameter,
    config,
  });
  return result;
};
