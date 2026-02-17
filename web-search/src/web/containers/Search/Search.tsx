import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Container, Spinner } from '@tubitv/web-ui';
import classnames from 'classnames';
import hoistNonReactStatics from 'hoist-non-react-statics';
import trim from 'lodash/trim';
import React, { useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';
import { connect } from 'react-redux';

import { searchBy } from 'common/actions/search';
import { tubiLogoURL, tubiLogoSize } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { recommendationSelector } from 'common/selectors/search';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { decodePersonName } from 'common/utils/seo';
import { syncAnonymousTokensClient } from 'common/utils/token';
import FloatingCastButton from 'web/components/FloatingCastButton/FloatingCastButton';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import ResultSection from './ResultSection';
import styles from './Search.scss';

const messages = defineMessages({
  searchWindowTitle: {
    description: 'Window/tab title text for search results on website',
    defaultMessage: '{keywords} | Search results | Watch Free TV Online | Tubi',
  },
  searchMetaDescription: {
    description: 'Short description of search results pages shown in search engine results',
    defaultMessage: '{keywords} search results on Tubi. Watch Free TV Online',
  },
  searchMetaKeywords: {
    description: 'The keywords supplied as part of the page meta information used by search engines',
    defaultMessage: '{keywords}, Free, Movies, TV shows, legal, streaming, HD, full length',
  },
  twitterImageAltText: {
    description:
      'Alt text for the following image shown when sharing a link to the search results page on Twitter: {tubiLogoURL}',
    defaultMessage: 'Tubi. Now playing. No Paying. Watch Free TV Online',
  },
  searchHeading: {
    description: 'Heading shown above search results grid on website',
    defaultMessage: '<accent>Results for</accent> <keywordsHeading>{keywords}</keywordsHeading>',
  },
});

export interface SearchContainerProps {
  items: string[];
  keywords: string;
  hasSearchResult: boolean;
  dispatch: TubiThunkDispatch;
  isLoading: boolean;
}

interface RouteParams {
  keywords: string;
}

export const SearchContainer: TubiContainerFC<SearchContainerProps, RouteParams> = ({
  hasSearchResult,
  isLoading,
  items,
  keywords,
}) => {
  const intl = useIntl();

  const meta = useMemo(() => {
    const title = intl.formatMessage(messages.searchWindowTitle, { keywords });
    const description = intl.formatMessage(messages.searchMetaDescription, { keywords });
    const canonical = getCanonicalLink(WEB_ROUTES.home);

    return {
      title,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'keywords', content: intl.formatMessage(messages.searchMetaKeywords, { keywords }) },
        { name: 'description', content: description },
        { name: 'robots', content: 'noindex' },

        { property: 'og:title', content: title },
        { property: 'og:image', content: tubiLogoURL },
        { property: 'og:image:height', content: tubiLogoSize },
        { property: 'og:image:width', content: tubiLogoSize },
        { property: 'og:url', content: canonical },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: description },

        { property: 'twitter:card', content: 'summary' },
        { property: 'twitter:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:image', content: tubiLogoURL },
        { property: 'twitter:image:alt', content: intl.formatMessage(messages.twitterImageAltText, { tubiLogoURL }) },

        // @todo Sam add deeplink when app supports deeplink search page
        // { property: 'al:android:url', content: `tubitv://media-details/${id}` },
        { property: 'al:android:package', content: 'com.tubitv' },
        { property: 'al:web:url', content: canonical },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords, hasSearchResult]);

  const trackSearchTileClick = useCallback((index: number, contentId: string) => {
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug: null,
      contentId,
      componentType: ANALYTICS_COMPONENTS.searchResultComponent,
    });
  }, []);

  // render logic
  return (
    <div className={classnames(styles.root, { [styles.loading]: isLoading })}>
      <Container className={classnames(styles.content, styles.withWebRefresh)}>
        <Helmet {...meta} />
        <div className={classnames(styles.header, styles.withWebRefresh)}>
          {intl.formatMessage(messages.searchHeading, {
            accent: ([text]: React.ReactNode[]) => <span className={classnames(styles.accent, styles.withWebRefresh)}>{text}</span>,
            keywordsHeading: ([keywds]: React.ReactNode[]) => (
              <h1 className={classnames(styles.keywords, styles.withWebRefresh)}>{(keywds as string || '').trim()}</h1>
            ),
            keywords,
          })}
        </div>
        {isLoading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner className={styles.spinner} />
          </div>
        ) : (
          <ResultSection items={items} hasSearchResult={hasSearchResult} trackClick={trackSearchTileClick} />
        )}
      </Container>
      <FloatingCastButton />
      <Footer useRefreshStyle />
    </div>
  );
};

SearchContainer.fetchDataDeferred = async ({ getState, dispatch, params }) => {
  // ensure that anonymous token exists or is generated before the search request for guest users
  if (!isLoggedInSelector(getState())) {
    await syncAnonymousTokensClient();
  }

  // construct the parameters to the search epic function manually
  let keywords = decodeURIComponent(params.keywords);

  // Video detail pages use a slug for person names to make links SEO friendly
  // person-brad-pitt => "brad pitt"
  if (keywords.startsWith('person-')) {
    keywords = decodePersonName(keywords);
  }

  const initiatingAction = searchBy({
    key: keywords,
    // don't flag web searches as using an external keyboard input type, because that is obvious.
    directKeyPressed: false,
  });

  return dispatch(initiatingAction);
};

const emptyArray: unknown[] = [];
const emptyItemIds = emptyArray as string[];

// @todo(zhiye) 1. several useless re-render when no results 2. show loading icon when loading search result
export const mapStateToProps = (state: StoreState) => {
  const { search } = state;
  const { key, hash, loading } = search;
  const items: string[] = hash[trim(key)] || [];
  const hasSearchResult: boolean = !!items.length;

  let itemIds: string[];
  if (hasSearchResult) {
    itemIds = items;
  } else if (search.recommendedContainerIds.length) {
    itemIds = recommendationSelector(state);
  } else {
    itemIds = emptyItemIds;
  }

  // Make `true` and `undefined` both evaluate to `true` so that before the loading map has even been populated, it is
  // considered to be in loading state.
  const isLoading = loading !== undefined && loading[trim(key)] !== false;
  return {
    keywords: key,
    items: itemIds,
    isLoading,
    hasSearchResult,
  };
};

export const fetchDataDeferred = SearchContainer.fetchDataDeferred;

// Using fetchDataDeferred to prevent fetching search results from Algolia
// on the server, because that wastes our Algolia usage allowance for no reason.
SearchContainer.hasDynamicMeta = true;

const connectedComponent = hoistNonReactStatics(connect(mapStateToProps)(SearchContainer), SearchContainer);

export default connectedComponent;
