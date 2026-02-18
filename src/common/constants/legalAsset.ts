export const LEGAL_TYPES = {
  privacy: 'privacy',
  terms: 'terms',
  yourPrivacyChoices: 'your-privacy-choices',
  b2bPrivacy: 'b2b-privacy',
  cookies: 'cookies',
};

export const LEGAL_ASSET_HOST = `https://legal-asset${__PRODUCTION__ ? '' : '-staging'}.tubi.tv`;
export const PRIVACY_HTML_PATH = '/privacy-policy.html';
const TERMS_HTML_PATH = '/terms-of-use.html';
const YOUR_PRIVACY_CHOICES_PATH = '/your-privacy-choices.html';
const B2B_PRIVACY_PATH = '/b2b-privacy-policy.html';
const COOKIES_PATH = '/cookies.html';
export const PRIVACY_HTML_URL = `${LEGAL_ASSET_HOST}${PRIVACY_HTML_PATH}`;
export const TERMS_HTML_URL = `${LEGAL_ASSET_HOST}${TERMS_HTML_PATH}`;
const YOUR_PRIVACY_CHOICES_URL = `${LEGAL_ASSET_HOST}${YOUR_PRIVACY_CHOICES_PATH}`;
const B2B_PRIVACY_URL = `${LEGAL_ASSET_HOST}${B2B_PRIVACY_PATH}`;
const COOKIES_URL = `${LEGAL_ASSET_HOST}${COOKIES_PATH}`;

export const LEGAL_URL_MAP = {
  [LEGAL_TYPES.privacy]: PRIVACY_HTML_URL,
  [LEGAL_TYPES.terms]: TERMS_HTML_URL,
  [LEGAL_TYPES.yourPrivacyChoices]: YOUR_PRIVACY_CHOICES_URL,
  [LEGAL_TYPES.b2bPrivacy]: B2B_PRIVACY_URL,
  [LEGAL_TYPES.cookies]: COOKIES_URL,
};
