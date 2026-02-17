import type { IntlShape } from 'react-intl';
import { createIntl, createIntlCache, useIntl as _useIntl } from 'react-intl';

import type { LanguageLocaleType } from './constants';
import { SUPPORTED_LANGUAGE_LOCALE } from './constants';

const cache = createIntlCache();

declare global {
  interface Window {
    i18n_messages?: Record<string, string>;
  }
}

export interface TubiIntlShape extends IntlShape {
  locale: LanguageLocaleType;
}

// gets localized message bundle, handles server and client side
export const getLocalizedMessages = (languageLocale: LanguageLocaleType): Record<string, string> => {
  if (__SERVER__) {
    try {
      return require(`./messages/${languageLocale}-messages.json`);
    } catch (err) {
      return {};
    }
  }
  // checking window property defined in HtmlBody.tsx
  // load other language bundles if we want dynamic language switching without page refresh
  return (typeof window !== 'undefined' && window.i18n_messages) || {};
};

export const createIntlEnglishUS = (): TubiIntlShape => {
  return createIntl(
    {
      locale: SUPPORTED_LANGUAGE_LOCALE.EN_US,
      defaultLocale: SUPPORTED_LANGUAGE_LOCALE.EN_US,
    },
    cache,
  ) as TubiIntlShape;
};

export const createIntlNonEnglishUS = (languageLocale: LanguageLocaleType): TubiIntlShape => {
  return createIntl(
    {
      locale: languageLocale,
      defaultLocale: SUPPORTED_LANGUAGE_LOCALE.EN_US,
      messages: getLocalizedMessages(languageLocale),
    },
    cache,
  ) as TubiIntlShape;
};

type IntlLanguageLocalesType = Record<LanguageLocaleType, TubiIntlShape>;

// create intl object to be used in files that need localized strings
const intl: Partial<IntlLanguageLocalesType> = {};

// updates intl object with the language passed in the parameter
export const getIntl = (languageLocale: LanguageLocaleType = SUPPORTED_LANGUAGE_LOCALE.EN_US): TubiIntlShape => {
  if (!intl[languageLocale]) {
    intl[languageLocale] = languageLocale === SUPPORTED_LANGUAGE_LOCALE.EN_US
      ? createIntlEnglishUS() : createIntlNonEnglishUS(languageLocale);
  }
  return intl[languageLocale]!;
};

export const useIntl = _useIntl as () => TubiIntlShape;
