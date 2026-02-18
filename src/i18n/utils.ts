import { parseQueryString } from '@adrise/utils/lib/queryString';
import type Express from 'express';
import Cookies from 'react-cookie';

import { DEVICE_LANGUAGE } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import type { CountryType, LanguageLocaleType } from './constants';
import {
  SUPPORTED_COUNTRY,
  SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGE_LOCALE,
  COUNTRY_DEFAULT_LOCALE,
  REG_LOCALE_URL_PREFIX,
} from './constants';

const isNonProductionEnv = () => __DEVELOPMENT__ || __STAGING__ || __IS_ALPHA_ENV__;

const BOUNDARY_PATTERN = '(?:[^a-z]|\\b)';

const LOCALE_LANGUAGE_PATTERN = `${BOUNDARY_PATTERN}(${Object.values(SUPPORTED_LANGUAGE).join('|')})${BOUNDARY_PATTERN}`;

const LOCALE_LANGUAGE_REGEX = new RegExp(LOCALE_LANGUAGE_PATTERN, 'i');

const LOCALE_COUNTRY_PATTERN = `${BOUNDARY_PATTERN}(${Object.values(SUPPORTED_COUNTRY).join('|')})${BOUNDARY_PATTERN}`;

const LOCALE_COUNTRY_REGEX = new RegExp(LOCALE_COUNTRY_PATTERN, 'i');

const FULL_LOCALE_REGEX = new RegExp(`${LOCALE_LANGUAGE_PATTERN}[-_]${LOCALE_COUNTRY_PATTERN}`, 'i');

export const parseLocale = (source: string | undefined): [string | undefined, string | undefined] | void => {
  if (!source) {
    return;
  }

  // GOTCHA: We have to change all `_` to `-` before running the regexes because
  // `_` is treated as a word character when using `\b` in the regex patterns.
  const normalizedSource = source.replace(/_/g, '-');

  const fullMatch = normalizedSource.match(FULL_LOCALE_REGEX);
  if (fullMatch) {
    const [, lang, country] = fullMatch;
    return [lang.toLowerCase(), country.toUpperCase()];
  }

  const langMatch = normalizedSource.match(LOCALE_LANGUAGE_REGEX);
  if (langMatch) {
    const [, lang] = langMatch;
    return [lang.toLowerCase(), undefined];
  }

  const countryMatch = normalizedSource.match(LOCALE_COUNTRY_REGEX);
  if (countryMatch) {
    const [, country] = countryMatch;
    return [undefined, country.toUpperCase()];
  }
};

const isSupportedLocale = (locale: string): locale is LanguageLocaleType => (Object.values(SUPPORTED_LANGUAGE_LOCALE) as string[]).includes(locale);

export const findSupportedLocale = (language?: string, country?: string): LanguageLocaleType | void => {
  if (language && country) {
    const locale = `${language}-${country}`;
    if (isSupportedLocale(locale)) {
      return locale;
    }
  }

  if (language) {
    const locale = Object.values(SUPPORTED_LANGUAGE_LOCALE).find((locale) => locale.startsWith(`${language}-`));
    if (locale) {
      return locale;
    }
  }

  if (country) {
    const locale = COUNTRY_DEFAULT_LOCALE[country as SUPPORTED_COUNTRY] ?? Object.values(SUPPORTED_LANGUAGE_LOCALE).find((locale) => locale.endsWith(`-${country}`));
    if (locale) {
      return locale;
    }
  }
};

export const determineLocaleFromSources = (sources: (() => [string | undefined, string | undefined] | void)[]) => {
  let language: string | undefined;
  let country: string | undefined;
  for (const source of sources) {
    const [sourceLanguage, sourceCountry] = source() ?? [];
    language ??= sourceLanguage;
    country ??= sourceCountry;
    if (language && country) {
      break;
    }
  }

  const locale = findSupportedLocale(language, country);

  return locale ?? SUPPORTED_LANGUAGE_LOCALE.EN_US;
};

export const determineLocaleFromRequest = (req: Express.Request): LanguageLocaleType => {
  if (__IS_FAILSAFE__) {
    return SUPPORTED_LANGUAGE_LOCALE.EN_US;
  }

  if (
    ['ANDROIDTV', 'TIZEN'].includes(__OTTPLATFORM__) &&
    req.acceptsLanguages().filter(x => x !== '*').length === 0 &&
    determineLocaleFromRequest._languageLogCount < 100
  ) {
    logger.info({
      'Accept-Language': req.headers['accept-language'],
    }, 'accept-language header is missing or only contains wildcards');
    determineLocaleFromRequest._languageLogCount++;
  }

  return determineLocaleFromSources([
    () => isNonProductionEnv() ? parseLocale(String(FeatureSwitchManager.get('LanguageLocale'))) : undefined,
    () => process.env.TUBI_ENV !== 'production' ? parseLocale(String(req.query.language)) : undefined,
    () => __WEBPLATFORM__ === 'WEB' && REG_LOCALE_URL_PREFIX.test(req.path) ? parseLocale(req.path.split('/')[1]) : undefined,
    () => req.cookies ? parseLocale(req.cookies[DEVICE_LANGUAGE]) : undefined,
    ...req.acceptsLanguages().map((lang) => () => parseLocale(lang)),
    () => [undefined, String(req.headers['x-tubi-country']).toUpperCase()],
  ]);
};

export const determineLocaleFromBrowser = () =>
  determineLocaleFromSources([
    () => isNonProductionEnv() ? parseLocale(String(FeatureSwitchManager.get('LanguageLocale'))) : undefined,
    () => process.env.TUBI_ENV !== 'production' ? parseLocale(String(parseQueryString(window.location.search).language)) : undefined,
    () => {
      const pathname = window.location.pathname;
      return __WEBPLATFORM__ === 'WEB' && REG_LOCALE_URL_PREFIX.test(pathname) ? parseLocale(pathname.split('/')[1]) : undefined;
    },
    () => parseLocale(Cookies.load(DEVICE_LANGUAGE)),
    // eslint-disable-next-line compat/compat -- falls back to empty array
    ...(navigator.languages ?? []).map((lang) => () => parseLocale(lang)),
  ]);

determineLocaleFromRequest._languageLogCount = 0;

export const determineCountryFromRequest = (req: Express.Request): CountryType => {
  if (__IS_FAILSAFE__) {
    return SUPPORTED_COUNTRY.US;
  }
  const SUPPORTED_COUNTRY_CODES = Object.values(SUPPORTED_COUNTRY);

  if (isNonProductionEnv()) {
    const featureSwitchCountry = FeatureSwitchManager.get('Country') as CountryType;
    if (SUPPORTED_COUNTRY_CODES.includes(featureSwitchCountry)) {
      req.headers['x-tubi-country'] = featureSwitchCountry;
      return featureSwitchCountry;
    }
  }

  if (process.env.TUBI_ENV !== 'production') {
    const { country } = req.query as { country: CountryType };
    if (SUPPORTED_COUNTRY_CODES.includes(country)) {
      req.headers['x-tubi-country'] = country;
      return country;
    }
  }

  if (req.headers['x-tubi-country']) {
    return req.headers['x-tubi-country'] as CountryType;
  }

  return SUPPORTED_COUNTRY.US;
};
