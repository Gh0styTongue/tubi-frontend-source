import type { AnyAction } from 'redux';

import {
  SET_SUPPORT_TICKET_FIELDS,
  SET_SUPPORT_DYNAMIC_CONTENT_LOCALE_MAP,
  SET_SUPPORT_MOBILE_METADATA_HEADERS,
  SET_HELP_CATEGORIES,
  SET_HELP_CATEGORY_SECTIONS,
  SET_HELP_CATEGORY_ARTICLES,
  LOAD_HELP_CATEGORY,
  LOAD_HELP_CATEGORY_SUCCESS,
  LOAD_HELP_CATEGORY_FAIL,
  SET_HELP_ARTICLE,
} from 'common/constants/action-types';
import type { SupportState } from 'common/types/support';

export const initialState = {
  ticketFields: [],
  ticketFieldIdMap: {},
  dynamicContentLocaleMap: {},
  mobileMetadataHeaders: {},
  helpCategoryIdList: [],
  helpCategoryIdMap: {},
  helpCategorySectionsIdMap: {},
  helpSectionIdMap: {},
  helpSectionArticlesIdMap: {},
  helpArticleIdMap: {},
} as SupportState;

export default function supportReducer(state: SupportState = initialState, action: AnyAction): SupportState {
  switch (action.type) {
    case SET_SUPPORT_TICKET_FIELDS:
      return {
        ...state,
        ticketFields: action.ticketFields,
        ticketFieldIdMap: action.ticketFieldIdMap,
      };
    case SET_SUPPORT_DYNAMIC_CONTENT_LOCALE_MAP:
      return {
        ...state,
        dynamicContentLocaleMap: action.dynamicContentLocaleMap,
      };
    case SET_SUPPORT_MOBILE_METADATA_HEADERS:
      return {
        ...state,
        mobileMetadataHeaders: action.mobileMetadataHeaders,
      };
    case SET_HELP_CATEGORIES:
      return {
        ...state,
        helpCategoryIdList: action.helpCategoryIdList,
        helpCategoryIdMap: action.helpCategoryIdMap,
      };
    case SET_HELP_CATEGORY_SECTIONS:
      return {
        ...state,
        helpCategorySectionsIdMap: {
          ...state.helpCategorySectionsIdMap,
          [action.categoryId]: action.sectionIdList,
        },
        helpSectionIdMap: {
          ...state.helpSectionIdMap,
          ...action.helpSectionIdMap,
        },
      };
    case SET_HELP_CATEGORY_ARTICLES:
      return {
        ...state,
        helpSectionArticlesIdMap: {
          ...state.helpSectionArticlesIdMap,
          ...action.helpSectionArticlesIdMap,
        },
        helpArticleIdMap: {
          ...state.helpArticleIdMap,
          ...action.helpArticleIdMap,
        },
      };
    case SET_HELP_ARTICLE:
      return {
        ...state,
        helpArticleIdMap: {
          ...state.helpArticleIdMap,
          [action.article.id]: action.article,
        },
      };
    case LOAD_HELP_CATEGORY:
      return {
        ...state,
        helpCategoryIdMap: {
          ...state.helpCategoryIdMap,
          [action.id]: {
            ...state.helpCategoryIdMap[action.id],
            articlesLoaded: false,
            articlesLoading: true,
          },
        },
      };
    case LOAD_HELP_CATEGORY_SUCCESS:
      return {
        ...state,
        helpCategoryIdMap: {
          ...state.helpCategoryIdMap,
          [action.id]: {
            ...state.helpCategoryIdMap[action.id],
            articlesLoaded: true,
            articlesLoading: false,
          },
        },
      };
    case LOAD_HELP_CATEGORY_FAIL:
      return {
        ...state,
        helpCategoryIdMap: {
          ...state.helpCategoryIdMap,
          [action.id]: {
            ...state.helpCategoryIdMap[action.id],
            articlesLoaded: false,
            articlesLoading: false,
          },
        },
      };
    default:
      return state;
  }
}
