import { SEARCH_CONTAINERIZATION, SEARCH_CONTAINERIZATION_VALUE, getConfig } from 'common/experiments/config/ottSearchContainerization';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottSearchContainerizationSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...SEARCH_CONTAINERIZATION,
  config: getConfig(),
});

export const isSearchContainerizationInVariantSelector = (state: StoreState) => {
  const value = ottSearchContainerizationSelector(state);
  return value !== SEARCH_CONTAINERIZATION_VALUE.CONTROL;
};
