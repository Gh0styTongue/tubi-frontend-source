import React from 'react';
import type { WithContext, SearchAction, WebSite } from 'schema-dts';

import { WEB_ROUTES } from 'common/constants/routes';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

const searchActionJsonLd = (): SearchAction & { 'query-input': string } => {
  return {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `https://tubitv.com${WEB_ROUTES.search}/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  };
};

// https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
export const genJsonLd = (): WithContext<WebSite> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': 'https://tubitv.com/',
    'potentialAction': searchActionJsonLd(),
  };
};

const SearchActionSchema = () => {
  const jsonLd = genJsonLd();

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default SearchActionSchema;
