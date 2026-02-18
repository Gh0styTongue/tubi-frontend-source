import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

/**
 * Checks if Multiple Accounts v2 (Phase 3) feature switch is enabled.
 * V2 includes enhanced features like password validation for account switching.
 */
export const checkIsMultipleAccountsV2Enabled = () =>
  FeatureSwitchManager.get('MultipleAccountsPhase3') === 'multiple_accounts_v2';

/**
 * Check if parental_rating_v2 is enabled.
 * Only enabled on OTT platform when MultipleAccountsV2 feature is active.
 */
export const isParentalRatingV2Enabled = () => __ISOTT__ && checkIsMultipleAccountsV2Enabled();
