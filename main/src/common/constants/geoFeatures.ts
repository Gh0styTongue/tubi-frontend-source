export type CountryCode = 'US' | 'CA' | 'AU' | 'MX' | 'GB' | 'NZ';

export type AppFeature =
  | 'kidsMode'
  | 'movieTVFilters'
  | 'channels'
  | 'yourPrivacyChoicesLink'
  | 'liveNewsContainer'
  | 'coppa'
  | 'espanolMode'
  | 'topNav'
  | 'discoveryRow'
  | 'webMovieAndTVShowNav'
  | 'gdpr'
  | 'webMyStuff'
  | 'webPersonalization'
  | 'webHideMetadata';

export const FEATURE_GEO_AVAILABILITY: Record<AppFeature, CountryCode[]> = {
  kidsMode: ['US', 'CA', 'NZ'],
  movieTVFilters: ['US', 'CA', 'NZ'],
  channels: ['US', 'CA', 'AU', 'NZ'],
  yourPrivacyChoicesLink: ['US'],
  liveNewsContainer: ['US'],
  // Currently, the GDPR countries needs age gates, which is same as COPPA
  // ideally we should separate GDPR and COPPA, but it requires too many changes.
  // We add the GDPR countries 'GB' and 'NZ' to COPPA for now and will refactor in the future
  // todo: remove 'GB' and 'NZ' from coppa
  coppa: ['US', 'CA', 'GB', 'NZ'],
  espanolMode: ['US'],
  topNav: ['US', 'CA', 'NZ'],
  discoveryRow: ['US'],
  webMovieAndTVShowNav: ['US'],
  gdpr: ['GB'],
  webMyStuff: ['US', 'GB'],
  webPersonalization: ['US'],
  webHideMetadata: ['US'],
};
