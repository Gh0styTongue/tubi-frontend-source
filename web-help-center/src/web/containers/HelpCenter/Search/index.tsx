import { addQueryStringToUrl, parseQueryString } from '@adrise/utils/lib/queryString';
import type { BaseItem } from '@algolia/autocomplete-core';
import type { AutocompleteOptions } from '@algolia/autocomplete-js';
import { autocomplete } from '@algolia/autocomplete-js';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import type { OnStateChangeProps } from '@algolia/autocomplete-shared';
import type { SearchClient } from 'algoliasearch/lite';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import type {
  ReactElement } from 'react';
import React, {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { render } from 'react-dom';
import type { StateResultsProvided } from 'react-instantsearch-core';
import {
  Configure,
  connectSearchBox,
  connectStateResults,
  Highlight,
  Hits,
  InstantSearch,
  Pagination,
  Snippet,
} from 'react-instantsearch-dom';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';

import styles from './Search.scss';
import type { HitProps, SearchResultHit, SearchResultRecord } from './types';
import { connectPathname } from '../HelpCenter';

const VirtualSearchBox = connectSearchBox(() => null);

const messages = defineMessages({
  noResults: {
    description: 'No search results',
    defaultMessage: 'Sorry! We can\'t seem to find anything for {query}',
  },
  suggestResults: {
    description: 'Suggested Results',
    defaultMessage: 'Suggested results text for the search bar',
  },
});

const QuerySuggestionsItem = ({ hit, components }: HitProps<SearchResultRecord>) => (
  <a className="aa-ItemLink" href={`${WEB_ROUTES.helpCenter}/${connectPathname(hit.category.title)}/articles/${hit.id}`}>
    <div className="aa-ItemCategory">{hit.section?.full_path}</div>
    <div className="aa-ItemContentBody">
      <components.Highlight hit={hit} attribute="title" />
    </div>
  </a>
);

const Hit = ({ hit }: Pick<HitProps<SearchResultHit>, 'hit'>) => {
  return (
    <article className="hit">
      <Link to={`${WEB_ROUTES.helpCenter}/${connectPathname(hit.category.title)}/articles/${hit.id}`}>
        <Highlight hit={hit} attribute="title" />
      </Link>
      <div>
        <Snippet attribute="body_safe" hit={hit} />
      </div>
    </article>
  );
};

const Autocomplete = (props: Partial<AutocompleteOptions<BaseItem>>) => {
  const containerRef = useRef(null);
  const { shouldPanelOpen } = props;

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const search = autocomplete({
      container: containerRef.current,
      renderer: { createElement, Fragment },
      render({ children }, root) {
        render(children as ReactElement, root);
      },
      ...props,
    });

    return () => {
      search.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPanelOpen]);

  return <div ref={containerRef} />;
};

interface IAlgoliaSearchParams {
  searchClient: SearchClient,
  indexName: string,
  defaultQuerySuggestionParams?: Record<string, any>,
  defaultSearchParams?: Record<string, any>,
}
interface ISearchProps extends IAlgoliaSearchParams {
  className?: string;
  showSearchResult?: boolean;
  breadcrumbComponent?: React.ReactNode;
  showSuggestionPanel?: boolean;
}

const InstantSearchWrapper:React.FC<ISearchProps> = ({
  showSearchResult = false,
  showSuggestionPanel = true,
  breadcrumbComponent,
  defaultQuerySuggestionParams = {},
  defaultSearchParams = {},
  searchClient,
  indexName,
}) => {
  const locationSearch = useLocation().search;
  const query = parseQueryString(locationSearch ?? '')?.query as string || '';
  const [searchState, setSearchState] = useState({ query });
  const intl = useIntl();

  const search = useCallback(
    (val: string) => {
      if (showSearchResult) {
        // should replace the url in search page in order to go back to the correct page
        tubiHistory.replace(addQueryStringToUrl(WEB_ROUTES.helpCenterSearch, { query: val }));
      } else {
        tubiHistory.push(addQueryStringToUrl(WEB_ROUTES.helpCenterSearch, { query: val }));
      }
      setSearchState((searchState) => ({
        ...searchState,
        query: val,
        page: 1, // reset page number
      }));
    },
    [showSearchResult]
  );
  const debouncedSearchUiState = debounce(search, 500, { leading: false, trailing: true });

  const onSubmit = useCallback(({ state }: Parameters<NonNullable<Parameters<typeof Autocomplete>[0]['onSubmit']>>[0]) => {
    search(state.query);
  }, [search]);

  const onReset = useCallback(() => {
    search('');
  }, [search]);

  const onStateChange = useCallback(({ prevState, state }: OnStateChangeProps<BaseItem>) => {
    if (showSuggestionPanel) return;

    if (prevState.query !== state.query) {
      debouncedSearchUiState(state.query);
    }
  }, [showSuggestionPanel, debouncedSearchUiState]);

  const plugins = useMemo(() => {
    if (!showSuggestionPanel) return [];
    return [
      createQuerySuggestionsPlugin<SearchResultHit>({
        searchClient,
        indexName,
        getSearchParams() {
          return defaultQuerySuggestionParams;
        },
        transformSource({ source }) {
          return {
            ...source,
            onSelect({ setIsOpen, item }) {
              setIsOpen(true);
              setSearchState((searchState) => {
                return {
                  ...searchState,
                  query: item.query,
                };
              });
            },
            getItemUrl({ item }) {
              return `${WEB_ROUTES.helpCenter}/${connectPathname(item.category.title)}/articles/${item.id}`;
            },
            templates: {
              ...source.templates,
              header() {
                return (
                  <Fragment>
                    <span className="aa-SourceHeaderTitle">
                      { intl.formatMessage(messages.suggestResults) }
                    </span>
                  </Fragment>
                );
              },
              item({ item, components }) {
                return <QuerySuggestionsItem hit={item} components={components} />;
              },
            },
          };
        },
      }),
    ];
  }, [showSuggestionPanel, searchClient, indexName, defaultQuerySuggestionParams, intl]);

  const shouldPanelOpen = useCallback(() => !!showSuggestionPanel, [showSuggestionPanel]);

  const StateResults = ({ searchResults }: StateResultsProvided) => {
    const hasResults = searchResults && searchResults?.nbHits !== 0;
    return (
      <div>
        {
          hasResults ? (
            <Fragment>
              <Hits hitComponent={Hit} />
            </Fragment>
          ) : <div className={styles.noResults}>
            {
              intl.formatMessage(messages.noResults, {
                query,
              })
            }
          </div>
        }
      </div>
    );
  };
  const CustomStateResults = connectStateResults(StateResults);

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      searchState={searchState}
      onSearchStateChange={setSearchState}
    >
      <Configure {...defaultSearchParams} />
      <VirtualSearchBox />
      <div className={styles.searchBar}>
        <Autocomplete
          detachedMediaQuery="none"
          initialState={searchState}
          autoFocus
          onSubmit={onSubmit}
          onReset={onReset}
          onStateChange={onStateChange}
          shouldPanelOpen={shouldPanelOpen}
          plugins={plugins}
        />
      </div>
      {
        showSearchResult ? (
          <React.Fragment>
            {breadcrumbComponent ? <div className={styles.breadcrumb}>{breadcrumbComponent}</div> : null}
            <CustomStateResults />
            <Pagination
              className={styles.pagination}
              showFirst
              showPrevious
              showNext
              showLast
            />
          </React.Fragment>
        ) : null
      }
    </InstantSearch>
  );
};

const Search:React.FC<ISearchProps> = (props) => {
  return (
    <div className={classNames(props.className, styles.searchBox)}>
      <InstantSearchWrapper {...props} />
    </div>
  );
};

export default Search;
