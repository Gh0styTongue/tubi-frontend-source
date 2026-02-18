import { secs } from '@adrise/utils/lib/time';
import type FormData from 'form-data';
import type { Action, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import * as actions from 'common/constants/action-types';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { StoreState } from 'common/types/storeState';
import type { DynamicContentItem, DynamicContentLocaleMap, DynamicContentVariant, HelpArticle, HelpCategory, HelpSection, TicketField } from 'common/types/support';

const SUBMIT_SUPPORT_FORM_TIMEOUT_MS = secs(90);
const SUBMIT_SUPPORT_FORM_DEADLINE_MS = secs(95);

export function submitSupport(data: FormData | Record<string, unknown>): ThunkAction<Promise<void>, StoreState, ApiClient, Action> {
  return (dispatch, getState, client) => {
    /* istanbul ignore next */
    const headers = getState().support?.mobileMetadataHeaders ?? {};
    return client.post('/oz/support', {
      data,
      headers,
      // Timeout is the time to receive the first byte while deadline is the time to receive the full response. And deadline must be larger than timeout.
      // We need longer request timeout and deadline than the default for uploading large images
      timeout: SUBMIT_SUPPORT_FORM_TIMEOUT_MS,
      deadline: SUBMIT_SUPPORT_FORM_DEADLINE_MS,
    }).catch((err: Error) => {
      logger.error(err, 'submit support action fails');
      return Promise.reject(err);
    });
  };
}

export const setSupportTicketFields = (ticketFields: TicketField[], ticketFieldIdMap: Record<number, TicketField>) => ({
  type: actions.SET_SUPPORT_TICKET_FIELDS,
  ticketFields,
  ticketFieldIdMap,
});

export function loadSupportTicketFields(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    return client.get('/oz/support/ticket_fields').then((ticketFields: TicketField[]) => {
      const ticketFieldIdMap: Record<number, TicketField> = {};
      ticketFields.forEach(field => {
        ticketFieldIdMap[field.id] = field;
      });
      dispatch(setSupportTicketFields(ticketFields, ticketFieldIdMap));
    }).catch((err: Error) => {
      logger.error(err, 'load support ticket fields fails');
      return Promise.reject(err);
    });
  };
}

export const setSupportDynamicContentLocaleMap = (dynamicContentLocaleMap: DynamicContentLocaleMap) => ({
  type: actions.SET_SUPPORT_DYNAMIC_CONTENT_LOCALE_MAP,
  dynamicContentLocaleMap,
});

export function loadSupportDynamicContent(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    return client.get('/oz/support/dynamic_content').then((dynamicContentItems) => {
      const dynamicContentLocaleMap: Record<number, Record<string, string>> = {};
      dynamicContentItems.forEach(({ placeholder, variants }: DynamicContentItem) => {
        variants.forEach(({ content, locale_id: localeId }: DynamicContentVariant) => {
          if (!dynamicContentLocaleMap[localeId]) {
            dynamicContentLocaleMap[localeId] = {};
          }
          dynamicContentLocaleMap[localeId][placeholder] = content;
        });
      });
      dispatch(setSupportDynamicContentLocaleMap(dynamicContentLocaleMap));
    }).catch((err: Error) => {
      logger.error(err, 'load support dynamic content fails');
      return Promise.reject(err);
    });
  };
}

export function loadHelpCategoryList(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    const { support: { helpCategoryIdList }, ui: { userLanguageLocale } } = getState();
    if (helpCategoryIdList.length > 0) {
      return Promise.resolve();
    }
    const options = { params: { userLanguageLocale } };
    return client.get('/oz/support/help_center/categories', options).then((categories: HelpCategory[]) => {
      const helpCategoryIdMap: Record<number, HelpCategory> = {};
      categories.forEach(category => {
        helpCategoryIdMap[category.id] = {
          ...category,
          articlesLoaded: false,
          articlesLoading: false,
        };
      });
      dispatch({
        type: actions.SET_HELP_CATEGORIES,
        helpCategoryIdList: categories.map(({ id }) => id),
        helpCategoryIdMap,
      });
    }).catch((err: Error) => {
      logger.error(err, 'load help categories fails');
      return Promise.reject(err);
    });
  };
}

export function loadCategorySections(categoryId: number)
: ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    const { ui: { userLanguageLocale } } = getState();
    const options = { params: { userLanguageLocale } };
    return client.get(`/oz/support/help_center/categories/${categoryId}/sections`, options).then((sections: HelpSection[]) => {
      const helpSectionIdMap: Record<number, HelpSection> = {};
      sections.forEach(section => {
        helpSectionIdMap[section.id] = section;
      });
      dispatch({
        type: actions.SET_HELP_CATEGORY_SECTIONS,
        categoryId,
        sectionIdList: sections.map(({ id }) => id),
        helpSectionIdMap,
      });
    }).catch((err: Error) => {
      logger.error(err, 'load help sections fails');
      return Promise.reject(err);
    });
  };
}

export function loadCategoryArticles(categoryId: number)
: ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    const { ui: { userLanguageLocale } } = getState();
    const options = { params: { userLanguageLocale } };
    return client.get(`/oz/support/help_center/categories/${categoryId}/articles`, options).then((articles: HelpArticle[]) => {
      const helpArticleIdMap: Record<number, HelpArticle> = {};
      const helpSectionArticlesIdMap: Record<number, number[]> = {};
      articles.forEach(article => {
        helpArticleIdMap[article.id] = article;
        if (!helpSectionArticlesIdMap[article.section_id]) {
          helpSectionArticlesIdMap[article.section_id] = [];
        }
        helpSectionArticlesIdMap[article.section_id].push(article.id);
      });
      dispatch({
        type: actions.SET_HELP_CATEGORY_ARTICLES,
        helpArticleIdMap,
        helpSectionArticlesIdMap,
      });
    }).catch((err: Error) => {
      logger.error(err, 'load help articles fails');
      return Promise.reject(err);
    });
  };
}

export function loadHelpArticle(articleId: number)
: ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    const { support: { helpArticleIdMap }, ui: { userLanguageLocale } } = getState();
    if (helpArticleIdMap[articleId]) {
      return Promise.resolve();
    }
    const options = { params: { userLanguageLocale } };
    return client.get(`/oz/support/help_center/articles/${articleId}`, options).then((article: HelpArticle) => {
      dispatch({
        type: actions.SET_HELP_ARTICLE,
        article,
      });
    }).catch((err: Error) => {
      logger.error(err, 'load help article fails');
      return Promise.reject(err);
    });
  };
}

export function loadHelpCategory(categoryId: number): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch) => {
    dispatch({
      type: actions.LOAD_HELP_CATEGORY,
      id: categoryId,
    });
    return Promise.all([
      dispatch(loadCategorySections(categoryId)),
      dispatch(loadCategoryArticles(categoryId)),
    ]).then(() => {
      dispatch({
        type: actions.LOAD_HELP_CATEGORY_SUCCESS,
        id: categoryId,
      });
    }).catch(() => {
      dispatch({
        type: actions.LOAD_HELP_CATEGORY_FAIL,
        id: categoryId,
      });
    });
  };
}
