import type { AppFeature, CountryCode } from 'common/constants/geoFeatures';
import { FEATURE_GEO_AVAILABILITY } from 'common/constants/geoFeatures';
import logger from 'common/helpers/logging';

/**
 * Utility function to check if the leftnav feature should be enabled in a country
 * @param feature
 * @param countryCode
 */
export function isFeatureAvailableInCountry(feature: AppFeature, countryCode: CountryCode | undefined): boolean {
  if (!countryCode) {
    logger.warn('unknown country code');
    return false;
  }
  const countries = FEATURE_GEO_AVAILABILITY[feature] || [];
  return countries.indexOf(countryCode) > -1;
}
