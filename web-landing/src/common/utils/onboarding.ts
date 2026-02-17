import { isMajorEventOnboardingActiveSelector } from 'common/selectors/remoteConfig';
import { isUsCountrySelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type StoreState from 'common/types/storeState';
import { SUPPORTED_COUNTRY } from 'i18n/constants';

export function isMajorEventOnboardingActive(state: StoreState): boolean {
  /* istanbul ignore next */
  if (FeatureSwitchManager.get('Country') !== SUPPORTED_COUNTRY.US && !FeatureSwitchManager.isDefault('Country')) {
    return false;
  }
  if (!isUsCountrySelector(state)) {
    return false;
  }
  // If the country is not available for the Major Event onboarding, it should not show, even if the ForceMajorEventOnboarding is enabled.
  // Checking ForceMajorEventOnboarding is moved to src/common/reducers/remoteConfig.ts, where the remote config is loaded.
  return isMajorEventOnboardingActiveSelector(state);
}
