export const ALGOLIA_SEARCH_APP_ID = 'N9PEEIU0XD';
export const ALGOLIA_SEARCH_API_KEY = '5c83629c2a1d90395944d1ba4081d45e';
export const INSTANT_SEARCH_INDEX_NAME = 'zendesk_tubitvhelp_articles';

export const DEFAULT_QUERY_SUGGESTION_PARAMS = {
  hitsPerPage: 5,
  attributesToSnippet: ['body_safe:17'],
  snippetEllipsisText: '...',
  analytics: true,
  facetFilters: [], // 'locale.locale:en-us'
  clickAnalytics: false,
};

export const DEFAULT_SEARCH_PARAMS = {
  attributesToSnippet: ['body_safe:40'],
  snippetEllipsisText: '...',
  clickAnalytics: false,
  facets: ['locale.locale', 'label_names', 'category.title'],
  tagFilters: [],
  facetFilters: [], // 'locale.locale:en-us'
  hitsPerPage: 20,
  maxValuesPerFacet: 15,
};
