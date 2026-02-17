import { DeeplinkContentType } from 'common/types/tizen';

const GENERAL_CAMPAIGN = 'samsung-general';
export const SAMSUNG_PMR_DEFAULT_SOURCE = 'smarthub-preview-default';
export const SAMSUNG_PMR_CW_SOURCE = 'smarthub-preview-continue-watching';
export const SAMSUNG_PMR_LIVE_SOURCE = 'smarthub-preview-live-news';

export const TIZEN_REFERRED_SEARCH_EXTRA_CTX = {
  source: 'search',
  medium: 'partnership',
  campaign: GENERAL_CAMPAIGN,
};

export const TIZEN_REFERRED_PMR_EXTRA_CTX = {
  medium: 'pmr',
  campaign: GENERAL_CAMPAIGN,
};

export const TIZEN_REFERRED_CW_EXTRA_CTX = {
  source: 'continue_watching',
  medium: 'Universal_guide',
  campaign: GENERAL_CAMPAIGN,
  content_type: DeeplinkContentType.VOD,
};
