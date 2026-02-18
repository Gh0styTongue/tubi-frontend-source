import type { DictionaryValues, ValueOf } from 'ts-essentials';

export enum SUPPORTED_LANGUAGE {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
}

export enum SUPPORTED_COUNTRY {
  US = 'US',
  AU = 'AU',
  MX = 'MX',
  CR = 'CR',
  EC = 'EC',
  SV = 'SV',
  GT = 'GT',
  PA = 'PA',
  CA = 'CA',
  NZ = 'NZ',
  GB = 'GB',
}

/**
 * This list should be in alphabetical order of name
 */
export const SUPPORTED_COUNTRY_NAMES: Record<SUPPORTED_COUNTRY, string> = {
  [SUPPORTED_COUNTRY.AU]: 'Australia',
  [SUPPORTED_COUNTRY.CA]: 'Canada',
  [SUPPORTED_COUNTRY.CR]: 'Costa Rica',
  [SUPPORTED_COUNTRY.EC]: 'Ecuador',
  [SUPPORTED_COUNTRY.SV]: 'El Salvador',
  [SUPPORTED_COUNTRY.GT]: 'Guatemala',
  [SUPPORTED_COUNTRY.MX]: 'Mexico',
  [SUPPORTED_COUNTRY.NZ]: 'New Zealand',
  [SUPPORTED_COUNTRY.PA]: 'Panama',
  [SUPPORTED_COUNTRY.US]: 'United States',
  [SUPPORTED_COUNTRY.GB]: 'United Kingdom',
};

// TODO @cbengtson Please update src/i18n/i18n-config.json and i18n-intl-polyfill.js as well if new languages are added
export const SUPPORTED_LANGUAGE_LOCALE = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  ES_MX: 'es-MX',
  FR_CA: 'fr-CA',
} as const;

export const COUNTRY_DEFAULT_LOCALE: Record<SUPPORTED_COUNTRY, ValueOf<typeof SUPPORTED_LANGUAGE_LOCALE>> = {
  AU: SUPPORTED_LANGUAGE_LOCALE.EN_US,
  CA: SUPPORTED_LANGUAGE_LOCALE.EN_US,
  CR: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  EC: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  SV: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  GT: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  MX: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  NZ: SUPPORTED_LANGUAGE_LOCALE.EN_US,
  PA: SUPPORTED_LANGUAGE_LOCALE.ES_MX,
  US: SUPPORTED_LANGUAGE_LOCALE.EN_US,
  GB: SUPPORTED_LANGUAGE_LOCALE.EN_GB,
};

export type LanguageLocaleType = typeof SUPPORTED_LANGUAGE_LOCALE[keyof typeof SUPPORTED_LANGUAGE_LOCALE];
export type CountryType = typeof SUPPORTED_COUNTRY[keyof typeof SUPPORTED_COUNTRY];

type LanguageInEnglish = 'English' | 'Spanish' | 'French';

export const LANGUAGE_CODE_MAP: Record<LanguageInEnglish, DictionaryValues<SUPPORTED_LANGUAGE>> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
};

export const LANGUAGE_IN_NATIVE_LANGUAGE_MAP: Record<LanguageInEnglish, string> = {
  English: 'English',
  Spanish: 'Español',
  French: 'Français',
};

/**
 * For users from same region,
 * our multilingual support could be reflected in the URL.
 * By adding a prefix to specified url (e.g. from /home to /es-us/home), user can visit the app in Spanish.
 * NOTE: The prefix would not change the actual country, but only set language.
 * e.g. changing /en-us/ to /en-gb/ won't make server return contents calibrated for viewers from UK.
 */
export const LOCALE_OPTIONS = {
  ES_US: 'es-us',
  ES_MX: 'es-mx',
} as const;

export type LocaleOptionType = typeof LOCALE_OPTIONS[keyof typeof LOCALE_OPTIONS];

export const LOCALE_URL_PREFIXES = [LOCALE_OPTIONS.ES_US, LOCALE_OPTIONS.ES_MX] as const;

// match pathname starts with /:locale/, e.g. /es-us, /es-us/home
export const REG_LOCALE_URL_PREFIX = new RegExp(`^/(?:${LOCALE_URL_PREFIXES.join('|')})(?:$|/)`);
