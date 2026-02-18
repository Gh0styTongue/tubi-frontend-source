import { SAMSUNG_SINGLE_SCREEN_ONBOARDING, getConfig } from 'common/experiments/config/ottSamsungSingleScreenOnboarding';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottSamsungSingleScreenOnboardingSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...SAMSUNG_SINGLE_SCREEN_ONBOARDING,
  config: getConfig(),
});
