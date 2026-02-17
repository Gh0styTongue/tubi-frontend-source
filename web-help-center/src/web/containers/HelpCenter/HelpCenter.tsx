import { ChevronDown, ChevronRight } from '@tubitv/icons';
import { Button, Spinner } from '@tubitv/web-ui';
import algoliasearch from 'algoliasearch/lite';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { loadHelpCategoryList, loadHelpCategory, loadHelpArticle } from 'common/actions/support';
import { ACCESSIBILITY_ARTICLE_ID } from 'common/constants/accessibility';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import type { HelpArticle, HelpCategory, HelpSection } from 'common/types/support';
import type { TubiFC } from 'common/types/tubiFC';
import type { LanguageLocaleType } from 'i18n/constants';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

import styles from './HelpCenter.scss';
import Search from './Search';
import { ALGOLIA_SEARCH_API_KEY, ALGOLIA_SEARCH_APP_ID, DEFAULT_QUERY_SUGGESTION_PARAMS, DEFAULT_SEARCH_PARAMS, INSTANT_SEARCH_INDEX_NAME } from './Search/constants';

const messages = defineMessages({
  title: {
    description: 'the title of help center',
    defaultMessage: 'Tubi Help Center',
  },
  subtitle: {
    description: 'the subtitle of help center',
    defaultMessage: 'How can we help you?',
  },
  accessibilityTitle: {
    description: 'the title of Accessibility page',
    defaultMessage: 'Accessibility',
  },
  feedbackTitle: {
    description: 'the title of the feedback section',
    defaultMessage: 'Share your thoughts with us',
  },
  feedbackDescription: {
    description: 'the description of the feedback section',
    defaultMessage: 'Share your feedback with us about what you like or don\'t like about Tubi, and offer suggestions for features you\'d like to see on our platform.',
  },
  feedbackDescriptionInArticle: {
    description: 'the description of the feedback section in the article page',
    defaultMessage: 'Still need help?',
  },
  feedbackButton: {
    description: 'the feedback button text',
    defaultMessage: 'Provide Feedback',
  },
  feedbackButtonInArticle: {
    description: 'the feedback button text in the article page',
    defaultMessage: 'Contact Us',
  },
  searchResultsTitle: {
    description: 'the search results page breadcrumb text',
    defaultMessage: 'Search results',
  },
});

export const connectPathname = (name?: string) => encodeURIComponent(name?.split(' ').filter(Boolean).join('-') || '');
const disconnectPathname = (name?: string) => decodeURIComponent(name?.split('-').filter(Boolean).join(' ') || '');

const searchClient = algoliasearch(ALGOLIA_SEARCH_APP_ID, ALGOLIA_SEARCH_API_KEY);

export const Category = ({
  category,
  expanded,
  sections,
  helpSectionArticlesIdMap,
  helpArticleIdMap,
  handleCategoryToggle,
}: {
  category: HelpCategory;
  expanded: boolean;
  sections: HelpSection[];
  helpSectionArticlesIdMap: Record<number, number[]>;
  helpArticleIdMap: Record<number, HelpArticle>;
  handleCategoryToggle: (category: HelpCategory) => void;
}) => {
  const handleClick = useCallback(() => {
    handleCategoryToggle(category);
  }, [category, handleCategoryToggle]);

  const sectionList = useMemo(() => category.articlesLoaded ? (
    <div className={styles.sectionList}>
      {sections.map(({ id: sectionId, name }) => (
        <div className={styles.section} key={sectionId}>
          <div className={styles.sectionName}>{name}</div>
          {helpSectionArticlesIdMap[sectionId].map(articleId => (
            <div className={styles.articleLink} key={articleId}>
              <Link to={`/help-center/${connectPathname(category.name)}/articles/${articleId}`}>
                {helpArticleIdMap[articleId].title}
              </Link>
            </div>
          ))}
        </div>
      ))}
    </div>
  ) : null,
  [category.articlesLoaded, category.name, helpArticleIdMap, helpSectionArticlesIdMap, sections]);

  return (
    <div className={styles.category}>
      <div className={styles.categoryName} onClick={handleClick}>
        <div className={styles.chevronIcon}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </div>
        <h2>{category.name}</h2>
      </div>
      <p className={styles.description}>{category.description}</p>
      {category.articlesLoading ? <div className={styles.spinnerWrapper}><Spinner className={styles.spinner} /></div> : null}
      {expanded ? sectionList : null}
    </div>
  );
};

export const Article = ({
  article,
  categoryName,
}: {
  article: HelpArticle;
  categoryName: string;
}) => {
  const intl = useIntl();
  return (
    <div className={styles.article}>
      <div className={styles.breadcrumb}>
        <Link to={WEB_ROUTES.helpCenter}>{intl.formatMessage(messages.title)}</Link>
        <ChevronRight />
        {categoryName}
      </div>
      <h1 className={styles.articleTitle}>{article.title}</h1>
      <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: article.body }} />
    </div>
  );
};

export const SearchBox = ({
  showSearchResult,
  userLanguageLocale,
}: {
  showSearchResult: boolean;
  userLanguageLocale: LanguageLocaleType
}) => {
  const intl = useIntl();
  // en-US -> locale.locale:en-us
  const searchLocaleFacet = `locale.locale:${userLanguageLocale.toLocaleLowerCase()}`;

  const defaultQuerySuggestionParams = useMemo(() => ({
    ...DEFAULT_QUERY_SUGGESTION_PARAMS,
    facetFilters: [searchLocaleFacet],
  }), [searchLocaleFacet]);

  const defaultSearchParams = useMemo(() => ({
    ...DEFAULT_SEARCH_PARAMS,
    facetFilters: [searchLocaleFacet],
  }), [searchLocaleFacet]);

  const searchResultBreadcrumb = useMemo(() => (
    <div className={styles.breadcrumb}>
      <Link to={WEB_ROUTES.helpCenter}>{intl.formatMessage(messages.title)}</Link>
      <ChevronRight />
      {intl.formatMessage(messages.searchResultsTitle)}
    </div>
  ), [intl]);

  const search = useMemo(() => (
    <Search
      showSearchResult={showSearchResult}
      breadcrumbComponent={searchResultBreadcrumb}
      showSuggestionPanel={!showSearchResult}
      searchClient={searchClient}
      indexName={INSTANT_SEARCH_INDEX_NAME}
      defaultQuerySuggestionParams={defaultQuerySuggestionParams}
      defaultSearchParams={defaultSearchParams}
    />
  ), [searchResultBreadcrumb, defaultQuerySuggestionParams, defaultSearchParams, showSearchResult]);

  return search;
};

interface Props {
  params: {
    articleId?: string,
    category?: string,
  }
}

type Params = { articleId: string };

export const HelpCenter: TubiFC<Props, Params> = ({ params }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [categoryIdExpandedMap, setCategoryIdExpandedMap] = useState<Record<number, boolean>>({});
  const {
    helpCategoryIdList,
    helpCategoryIdMap,
    helpCategorySectionsIdMap,
    helpSectionIdMap,
    helpSectionArticlesIdMap,
    helpArticleIdMap,
  } = useAppSelector((state) => state.support);
  const { userLanguageLocale } = useAppSelector((state) => state.ui);

  const articleId = params.articleId ? parseInt(params.articleId, 10) : undefined;
  const categoryName = disconnectPathname(params.category);

  const handleCategoryToggle = useCallback((category: HelpCategory) => {
    const isExpanded = !!categoryIdExpandedMap[category.id];
    if (!isExpanded && !category.articlesLoaded && !category.articlesLoading) {
      dispatch(loadHelpCategory(category.id));
    }
    setCategoryIdExpandedMap((prevState) => ({
      ...prevState,
      [category.id]: !isExpanded,
    }));
  }, [categoryIdExpandedMap, setCategoryIdExpandedMap, dispatch]);

  const isArticle = articleId && helpArticleIdMap[articleId];
  const pathname = useLocation().pathname;
  const isSearchPage = useMemo(() => pathname === WEB_ROUTES.helpCenterSearch, [pathname]);

  let content: ReactNode;
  if (isArticle) {
    content = <Article article={helpArticleIdMap[articleId]} categoryName={categoryName} />;
  } else if (!isSearchPage) {
    content = helpCategoryIdList.map((categoryId) => {
      const sections = (helpCategorySectionsIdMap[categoryId] || []).map(
        (sectionId) => helpSectionIdMap[sectionId]
      );
      return (
        <Category
          key={categoryId}
          category={helpCategoryIdMap[categoryId]}
          expanded={categoryIdExpandedMap[categoryId]}
          sections={sections}
          helpSectionArticlesIdMap={helpSectionArticlesIdMap}
          helpArticleIdMap={helpArticleIdMap}
          handleCategoryToggle={handleCategoryToggle}
        />
      );
    });
  }
  const feedback = useMemo(() => (
    <div className={styles.feedbackWrapper}>
      <div className={styles.feedback}>
        {!isArticle ? <div className={styles.feedbackTitle}>{intl.formatMessage(messages.feedbackTitle)}</div> : null}
        <div className={styles.feedbackContent}>
          <div className={styles.feedbackDescription}>
            {intl.formatMessage(isArticle ? messages.feedbackDescriptionInArticle : messages.feedbackDescription)}
          </div>
          <Button
            className={styles.feedbackButton}
            onClick={() => { tubiHistory.push(WEB_ROUTES.support); }}
          >
            {intl.formatMessage(isArticle ? messages.feedbackButtonInArticle : messages.feedbackButton)}
          </Button>
        </div>
      </div>
    </div>
  ), [intl, isArticle]);

  const meta = useMemo(() => {
    const title = isArticle
      ? `${helpArticleIdMap[articleId].title} - ${intl.formatMessage(messages.title)}`
      : intl.formatMessage(messages.title);
    const canonical = isArticle ? getCanonicalLink(WEB_ROUTES.helpCenterArticle, params) : getCanonicalLink(WEB_ROUTES.helpCenter);
    // Currently we don't have description from Zendesk articles. So we keep it blank and Google can automatically generate a description.
    // https://docs.google.com/document/d/1DxjcLDwEP_M4E8NXPkPgWxmmcoFRF8yhUnbgGkMwAAI/edit?disco=AAAA88HJLIA
    const description = '';
    return {
      title,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };
  }, [articleId, helpArticleIdMap, intl, isArticle, params]);

  const isAccessibility = isArticle && articleId === ACCESSIBILITY_ARTICLE_ID;
  const title = intl.formatMessage(isAccessibility ? messages.accessibilityTitle : messages.title);
  const subtitle = isAccessibility ? undefined : intl.formatMessage(messages.subtitle);

  return (
    <div>
      <Helmet {...meta} />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {isArticle ? (
            <div className={styles.mainTitle}>{title}</div>
          ) : (
            <h1 className={styles.mainTitle}>{title}</h1>
          )}
          <div className={styles.subtitle}>{subtitle}</div>
          <SearchBox
            showSearchResult={isSearchPage}
            userLanguageLocale={userLanguageLocale}
          />
          <div>{content}</div>
        </div>
      </div>
      { feedback }
      <Footer />
    </div>
  );
};

HelpCenter.fetchData = ({ dispatch, params }) => {
  const articleId = parseInt(params.articleId, 10);
  if (articleId) {
    return dispatch(loadHelpArticle(articleId));
  }

  return dispatch(loadHelpCategoryList());
};
export default HelpCenter;
