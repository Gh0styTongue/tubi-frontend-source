import type { DictionaryValues } from 'ts-essentials';

import { getCookie } from 'client/utils/localDataStorage';
import { DEVICE_LANGUAGE } from 'common/constants/constants';
import type { LanguageLocaleType, SUPPORTED_LANGUAGE_LOCALE } from 'i18n/constants';
import { SUPPORTED_COUNTRY, SUPPORTED_LANGUAGE, LANGUAGE_CODE_MAP, LANGUAGE_IN_NATIVE_LANGUAGE_MAP, COUNTRY_DEFAULT_LOCALE } from 'i18n/constants';

/**
 * This acts as a source of truth for date order (on reg form)
 * @param locale - from redux store, a locale to determine date order e.g. en-US or es-MX
 * @returns {array} - some order of 'month', 'day', 'year'|'relatedYear'
 */
export const getDateOrder = (locale?: DictionaryValues<typeof SUPPORTED_LANGUAGE_LOCALE>) => {
  /* istanbul ignore next */
  try {
    const date = new Date(2020, 11, 30); // Dec 30
    const formatter = new Intl.DateTimeFormat(locale);
    return formatter.formatToParts(date).map(({ type }) => {
      // "relatedYear" is for traditional Mandarin
      return ['month', 'day', 'year', 'relatedYear'].includes(type) ? type : null;
    }).filter(Boolean);
  } catch (e) {
    // chance some very old browsers will not have formatToParts
    return ['month', 'day', 'year'];
  }
};

export const getCountryCodeFromLocale = (locale?: LanguageLocaleType) =>
  locale?.split('-')[1] as SUPPORTED_COUNTRY | undefined;

export const getLanguageCodeFromLocale = (locale?: LanguageLocaleType) =>
  locale?.split('-')[0] as SUPPORTED_LANGUAGE | undefined;

/**
 * Return the content language that should be shown in content information.
 *
 * It shouldn't show the language if it's the country's primary language. This
 * means in the US, Canada, and Australia, content that only has
 * {lang: "English"} we don't need to display the language field. In Mexico, if
 * the title is only in Spanish, do not display the language field. If content
 * has more than one value in the language field (i.e. English + German, or
 * Spanish + English) then display both values.
 */
export const getLanguageToShow = (
  languageLocale: LanguageLocaleType | undefined,
  videoLangsString: string = ''
): string => {
  const videoLangs = videoLangsString.split(',');
  return videoLangs.map(lang => {
    const localeCountry = getCountryCodeFromLocale(languageLocale) ?? SUPPORTED_COUNTRY.US;
    const countryDefaultLocale = COUNTRY_DEFAULT_LOCALE[localeCountry];
    const countryDefaultLanguage = getLanguageCodeFromLocale(countryDefaultLocale) ?? SUPPORTED_LANGUAGE.EN;

    if (LANGUAGE_CODE_MAP[lang] === countryDefaultLanguage && videoLangs.length === 1) {
      return '';
    }

    return LANGUAGE_IN_NATIVE_LANGUAGE_MAP[lang] ?? lang;
  }).filter(Boolean).join(', ');
};

// return the users language locale, e.g. en-US, fr-CA
// To be used on OTT or WEB
export const getUserLanguageLocale = (country: string = 'US') => {
  if (typeof window === 'undefined') {
    return '';
  }
  // DEVICE_LANGUAGE is set on some devices like VIZIO and HISENSE
  const language = getCookie(DEVICE_LANGUAGE);
  if (language) {
    return `${language}-${country}`;
  }

  // check window navigator for users language
  const languageLocale = window.navigator.language || window.navigator.userLanguage;
  if (languageLocale) {
    return languageLocale.length > 2 ? languageLocale : `${languageLocale}-${country}`;
  }
  return '';
};
