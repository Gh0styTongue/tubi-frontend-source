import { defineMessages } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { tubiLogoSize, tubiLogoURL } from 'common/constants/constants';
import { EXTERNAL_LINKS } from 'common/constants/routes';
import config from 'src/config';

interface GetAppMetaDataParams {
  intl: IntlShape;
  isKidsModeEnabled: boolean;
  isCrawlingEnabled: boolean;
}

const appMetaDataMessages = defineMessages({
  title: {
    description: 'web page meta title',
    defaultMessage: 'Watch Free TV & Movies Online | Stream Full Length Videos | Tubi',
  },
  metaDescription: {
    description: 'web page meta description',
    defaultMessage:
      'Watch free on Tubi. From deep cuts to hit movies, shows, series, live TV and awarded originals. No subscription. Free forever.',
  },
  metaKeywords: {
    description: 'web page meta keywords',
    defaultMessage: 'Free, Movies, TV shows, legal, streaming, HD, full length, full movie',
  },
  logoAlt: {
    description: 'tubi logo alt tag text',
    defaultMessage: 'Tubi logo; Tubi text with orange background',
  },
});

// meta data to be placed in the <head> tag of a page
// eslint-disable-next-line import/no-unused-modules -- used in src/web/containers/App
export const getAppMetaData = ({
  intl,
  isKidsModeEnabled,
  isCrawlingEnabled,
}: GetAppMetaDataParams) => {
  const themeColor = config.getAppThemeColor(isKidsModeEnabled);
  return {
    title: intl.formatMessage(appMetaDataMessages.metaDescription),
    meta: [
      {
        name: 'description',
        content: intl.formatMessage(appMetaDataMessages.metaDescription),
      },
      { name: 'keywords', content: intl.formatMessage(appMetaDataMessages.metaKeywords) },
      { name: 'robots', content: isCrawlingEnabled ? 'index, follow, max-image-preview:large' : 'noindex, nofollow' },
      { name: 'theme-color', content: themeColor },
      /**
       * apple
       */
      { name: 'apple-itunes-app', content: 'app-id=886445756' },
      /**
       * app links
       * https://developers.facebook.com/docs/applinks/metadata-reference
       */
      { property: 'al:android:app_name', content: 'Tubi' },
      { property: 'al:android:package', content: 'com.tubitv' },
      { property: 'al:ios:app_name', content: 'Tubi' },
      { property: 'al:ios:app_store_id', content: '886445756' },
      /**
       * facebook
       * https://developers.facebook.com/docs/sharing/webmasters
       */
      { property: 'fb:pages', content: '639252129456075' },
      /**
       * microsoft
       * https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/dev-guides/bg183312(v=vs.85)
       */
      { name: 'msapplication-TileColor', content: themeColor },
      { name: 'msapplication-TileImage', content: '//mcdn.tubitv.com/web/mstile-144x144.png' },
      /**
       * open graph
       * http://ogp.me
       */
      {
        property: 'og:description',
        content: intl.formatMessage(appMetaDataMessages.metaDescription),
      },
      { property: 'og:image', content: tubiLogoURL },
      { property: 'og:image:height', content: tubiLogoSize },
      { property: 'og:image:width', content: tubiLogoSize },
      { property: 'og:image:alt', content: intl.formatMessage(appMetaDataMessages.logoAlt) },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:site_name', content: 'Tubi' },
      { property: 'og:title', content: intl.formatMessage(appMetaDataMessages.title) },
      { property: 'og:type', content: 'website' },
      /**
       * twitter
       * https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started.html
       */
      { property: 'twitter:card', content: 'summary' },
      { property: 'twitter:creator', content: '@TubiTV' },
      { property: 'twitter:creator:id', content: '2363630702' },
      {
        property: 'twitter:description',
        content: intl.formatMessage(appMetaDataMessages.metaDescription),
      },
      { property: 'twitter:image', content: tubiLogoURL },
      { property: 'twitter:site', content: '@TubiTV' },
      { property: 'twitter:title', content: intl.formatMessage(appMetaDataMessages.title) },
    ],
    link: [
      { rel: 'apple-touch-icon', href: '//mcdn.tubitv.com/web/apple-touch-icon.png' },
      { rel: 'icon', href: '/favicon.ico?v=1' },
      { rel: 'publisher', href: EXTERNAL_LINKS.googlePlusPage },
    ],
  };
};
