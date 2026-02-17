import { setUserLanguageLocale } from 'common/actions/ui';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiStore } from 'common/types/storeState';
import { loadScript } from 'common/utils/dom';
import { getResourceUrl } from 'common/utils/urlConstruction';
import type { LanguageLocaleType } from 'i18n/constants';
import { SUPPORTED_LANGUAGE_LOCALE } from 'i18n/constants';
import { determineLocaleFromBrowser } from 'i18n/utils';

declare global {
  interface Window {
    i18nPolyfillsByLocale?: Record<LanguageLocaleType, string>;
    i18nMessageScripts?: Record<LanguageLocaleType, string>;
  }
}

export const setupFailsafeI18n = async (store: TubiStore, client: ApiClient) => {
  const locale: LanguageLocaleType = determineLocaleFromBrowser();
  store.dispatch(setUserLanguageLocale(locale));
  const promises: Promise<void>[] = [];
  if (__ISOTT__) {
    if (__OTTPLATFORM__ === 'TIZEN' && __IS_FAILSAFE__) {
      // temporary bandaid to get samsung working
      const meta: {
        assets: {
          i18n: Record<LanguageLocaleType, string>;
          i18nPolyfill: Record<LanguageLocaleType, string>;
        }
      } = await client.get('/oz/tizen/meta');
      window.i18nPolyfillsByLocale = Object.fromEntries(
        Object.entries(meta.assets.i18nPolyfill)
          .map(([key, src]) => [key.replace('polyfill_', ''), getResourceUrl(src)])
      ) as Record<LanguageLocaleType, string>;
      window.i18nMessageScripts = Object.fromEntries(
        Object.entries(meta.assets.i18n).map(([key, src]) => [key, getResourceUrl(src)]),
      ) as Record<LanguageLocaleType, string>;
    }
    promises.push(loadScript(window.i18nPolyfillsByLocale![locale]));
  }
  if (locale !== SUPPORTED_LANGUAGE_LOCALE.EN_US) {
    promises.push(loadScript(window.i18nMessageScripts![locale]));
  }

  await Promise.all(promises);
};
