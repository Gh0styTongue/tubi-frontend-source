import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export const ottPALIntegrationSelector = (): boolean => {
  return FeatureSwitchManager.isEnabled(['Player', 'EnableGooglePALInAdRequest']) || __SHOULD_ENABLE_GOOGLE_PAL_INTEGRATION__;
};
