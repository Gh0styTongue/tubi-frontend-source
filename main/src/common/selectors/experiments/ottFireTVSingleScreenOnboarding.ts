import { FIRETV_SINGLE_SCREEN_ONBOARDING, getConfig } from 'common/experiments/config/ottFireTVSingleScreenOnboarding';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVSingleScreenOnboardingSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_SINGLE_SCREEN_ONBOARDING,
  config: getConfig(),
});
