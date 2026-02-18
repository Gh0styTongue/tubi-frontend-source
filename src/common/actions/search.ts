import LRUCache from '@adrise/utils/lib/lru';
import { InputDeviceType } from '@tubitv/analytics/lib/genericEvents';
import throttle from 'lodash/throttle';
import trim from 'lodash/trim';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import * as actionTypes from 'common/constants/action-types';
import * as constants from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import type { ParentalRating } from 'common/constants/ratings';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { ApiClientMethodOptions } from 'common/helpers/ApiClient';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { shouldShowLinearContent } from 'common/selectors/experiments/liveNews';
import { enable4KSelector, enableHEVCSelector, enableHlsv6OnAndroidTVSelector, isPSSHv0Supported } from 'common/selectors/fire';
import { useHlsSelector as tizenUseHlsSelector } from 'common/selectors/tizen';
import type { TubiThunkDispatch, TubiThunkAction } from 'common/types/reduxThunk';
import type { Payload } from 'common/types/search';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { buildSearchEventObject } from 'common/utils/analytics';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getDebugLog } from 'common/utils/debug';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { clearAnonymousTokens, syncAnonymousTokensClient } from 'common/utils/token';
import { trackEvent, trackLogging } from 'common/utils/track';

import { batchAddVideos } from './video';

export type SearchResponse = Video[];

/**
 * Set the index of the currently highlighted tile in the search results
 * @param {number | null} activeIdx The
 * @return {{activeIdx: number, type: string}}
 */
export function setActiveTileIndex(activeIdx: number | null) {
  return {
    type: actionTypes.SEARCH_SET_ACTIVE_IDX,
    activeIdx,
  };
}

let pendingSearches: (() => void)[] = [];

function removePendingSearch(abort: () => void): void {
  const pending = pendingSearches.indexOf(abort);
  if (pending !== -1) {
    pendingSearches.splice(pending, 1);
  }
}

function abortPendingSearches(): void {
  for (const pendingSearch of pendingSearches) {
    pendingSearch();
  }
  pendingSearches = [];
}

function abortSearchesAndDispatch(actionType: typeof actionTypes.ABORT_SEARCH | typeof actionTypes.CLEAR_SEARCH): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch) => {
    abortPendingSearches();
    return dispatch(actionWrapper(actionType));
  };
}

export function abortSearch(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return abortSearchesAndDispatch(actionTypes.ABORT_SEARCH);
}

export function clearSearch(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return abortSearchesAndDispatch(actionTypes.CLEAR_SEARCH);
}

export function clearSearchStoreKeys(): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch) => {
    searchResultsCache.clear();
    return dispatch(actionWrapper(actionTypes.CLEAR_SEARCH_STORE_KEYS));
  };
}

export const searchStart = (key: string, path?: string) => ({ type: actionTypes.LOAD_SEARCH_START, key, path });

// FIXME: directKeyPressed, path and query are not consumed in the reducer. Need to review and clean up.
export function searchBy(payload: Payload): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return (dispatch, getState, client) => {
    const search = {
      ...payload,
      key: payload.key.slice(0, constants.OTT_SEARCH_MAX_KEYWORD_LEN),
    };
    // starts the search process
    dispatch(actionWrapper(actionTypes.LOAD_SEARCH_EPIC, { key: search.key }));
    if (trim(search.key).length === 0) {
      return Promise.resolve();
    }
    return performSearch(dispatch, payload, getState(), client);
  };
}

export const setIsVoiceSearch = (isVoiceSearch: boolean) => {
  return {
    type: actionTypes.SET_IS_VOICE_SEARCH,
    result: isVoiceSearch,
  };
};

export const searchSuccess = (contentIds: string[], key: string) => {
  return {
    type: actionTypes.LOAD_SEARCH_SUCCESS,
    result: contentIds || [],
    key,
  };
};
export const searchFail = (key: string, error: Error) => actionWrapper(actionTypes.LOAD_SEARCH_FAIL, { error, key });

// export for test only
export const searchResultsCache = new LRUCache<{ observable: { promise: Promise<SearchResponse | undefined>, abort:() => void }; expiry: number }>(
  constants.SEARCH_RESULTS_CACHE_COUNT
);

export const isSearchResultsCacheEmpty = () => searchResultsCache.isEmpty();
export const addToSearchCache = (cacheKey: string, observable: { promise: Promise<SearchResponse | undefined>, abort: () => void }) => {
  const entry = { observable, expiry: Date.now() + constants.OTT_SEARCH_RESULTS_CACHE_DURATION };
  searchResultsCache.set(cacheKey, entry);
  return entry.observable;
};

const hasSearchCacheEntry = (cacheKey: string) => {
  const cacheEntry = searchResultsCache.peek(cacheKey);
  if (!cacheEntry) return false;
  return cacheEntry.expiry > Date.now();
};

// export for test only
export const getSearchCacheEntry = (cacheKey: string) => {
  const cacheEntry = searchResultsCache.get(cacheKey);
  if (!(hasSearchCacheEntry(cacheKey) && cacheEntry)) return undefined;
  return cacheEntry.observable;
};

const buildCacheKey = (key: string, query?: Record<string, unknown>) => {
  return [key, query].filter(Boolean).join('__');
};

const searchLog = getDebugLog('search');

/**
 * Add kidsMode as query param to search URL.
 * Set isKidsMode to false if parentalRating is 0/1 (little or older kids)
 * The reason being if kidsMode is set to true then UAPI will return incorrect movie ratings
 * for a given parental rating.
 */
export const getIsKidsMode = (parentalRating: ParentalRating, isKidsModeEnabled: boolean = false) => {
  return isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;
};

interface AddToCacheParams {
  cacheKey: string,
  client: ApiClient,
  key: string,
  query: Record<string, unknown>,
  isKidsModeEnabled?: boolean,
  parentalRating: ParentalRating,
  useLinearHeader: boolean,
  useAnonymousToken: boolean,
  isMobile?: boolean;
  state: StoreState;
  personalizationId?: string;
}

function observableGet(client: ApiClient, url: string, options: ApiClientMethodOptions): { promise: Promise<SearchResponse | undefined>, abort: () => void } {
  let abort: () => void = () => {};
  const promise = new Promise<SearchResponse | undefined>((resolve, reject) => {
    abort = client.getInstanceValue('get', url, options)((body: unknown) => resolve(body as SearchResponse | undefined), reject, !!options?.useAnonymousToken).abort;
  });
  return { promise, abort };
}

async function addToCache({
  cacheKey,
  client,
  key,
  query,
  isKidsModeEnabled,
  parentalRating,
  useLinearHeader,
  useAnonymousToken,
  isMobile,
  state,
  personalizationId,
}: AddToCacheParams) {
  searchLog('Adding to cache:', cacheKey);
  const isKidsMode = getIsKidsMode(parentalRating, isKidsModeEnabled);

  const options: ApiClientMethodOptions = {
    timeout: 5000, // 5 secs to receive first byte
    deadline: 20000, // 20 secs to receive full response (might be a big search result query)
    useAnonymousToken,
  };

  /**
   * Add kidsMode as query param to search URL.
   * Set isKidsMode to false if parentalRating is 0/1 (little or older kids)
   * The reason being if kidsMode is set to true then UAPI will return incorrect movie ratings
   * for a given parental rating.
   */
  const url = `/oz/search/${encodeURIComponent(trim(key))}?isKidsMode=${isKidsMode}`;

  // we would like to run the experiment in FIRETV
  const videoResourceParams = __OTTPLATFORM__ === 'FIRETV_HYB' ? await getVideoResourceQueryParameters({
    isPSSHv0Supported: isPSSHv0Supported(state),
    enableHEVC: enableHEVCSelector(state),
    enable4K: enable4KSelector(state),
    androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
    tizenUseHls: tizenUseHlsSelector(state),
  }) : {};

  options.params = {
    ...query,
    ...videoResourceParams,
    useLinearHeader,
    isMobile,
    largerPoster: __ISOTT__,
    personalizationId,
  };

  return addToSearchCache(cacheKey, observableGet(client, url, options));
}

export function processSearchResponse(result: SearchResponse, deleteExistingVideos?: boolean) {
  // preprocess contents
  const contentIds = result.map((content) => {
    const id = content.id;
    return content.type === constants.SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id;
  });

  return {
    result: contentIds,
    action: batchAddVideos(result, {
      deleteExistingVideos,
    }) as unknown as AnyAction,
  };
}

const getInputDeviceType = (directKeyPressed: boolean) =>
  directKeyPressed ? InputDeviceType.KEYBOARD : InputDeviceType.NATIVE;

const throttledSyncToken = throttle(
  (errorMessage: string, errorCode: number) => {
    clearAnonymousTokens();
    syncAnonymousTokensClient();
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN, TODO @cbengtson
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_Search',
      message: {
        errorMessage,
        errorCode,
      },
    });
  },
  10000,
  { leading: true, trailing: false }
);

/**
 * perform send search request
 * @param payload
 * @param state$ the store stream
 * @param client injected dependency, instance of ApiClient
 */
// export for test only
export const performSearch = async (dispatch: TubiThunkDispatch, payload: Payload, storeState: StoreState, client: ApiClient) => {
  const {
    userSettings: { parentalRating },
    ui: { isKidsModeEnabled, isMobile },
    search: { isVoiceSearch },
  } = storeState;
  const { key, path, query, directKeyPressed, personalizationId } = payload;
  const cacheKey = buildCacheKey(key, query);
  const cacheKeyTrimmed = buildCacheKey(trim(key), query);
  const hasCacheKey = hasSearchCacheEntry(cacheKey);
  const actualCacheKey = hasCacheKey ? cacheKey : cacheKeyTrimmed;
  const sameAsMostRecentCacheEntry = searchResultsCache.indexOf(actualCacheKey) === 0; // deliberately ignores expired check
  const searchQuery = {
    ...query,
  };

  let cacheEntry = getSearchCacheEntry(actualCacheKey);

  if (cacheEntry) {
    searchLog(`Found in cache: "${actualCacheKey}"`);
  } else {
    if (pendingSearches.length) {
      abortPendingSearches();
    }

    cacheEntry = await addToCache({
      cacheKey: actualCacheKey,
      client,
      key,
      query: searchQuery,
      state: storeState,
      isKidsModeEnabled,
      parentalRating,
      useLinearHeader: shouldShowLinearContent(storeState),
      useAnonymousToken: !isLoggedInSelector(storeState),
      isMobile,
      personalizationId,
    });
  }

  dispatch(searchStart(key, path));

  // if this is a new search query for the most recent search, don't clear the tile index, otherwise the previously
  // selected tile will be lost and the user will be annoyed.
  if (!sameAsMostRecentCacheEntry) {
    dispatch(setActiveTileIndex(null));
  }

  try {
    pendingSearches.push(cacheEntry.abort);

    const response = await cacheEntry.promise;
    removePendingSearch(cacheEntry.abort);
    if (response === undefined) {
      searchLog(`Aborted removing from cache: ${actualCacheKey}`);
      searchResultsCache.remove(actualCacheKey);
      return;
    }

    const { result, action } = processSearchResponse(response);
    const searchSuccessAction = searchSuccess(result, key);

    const searchEventBody = buildSearchEventObject(
      key,
      isVoiceSearch ? InputDeviceType.VOICE : getInputDeviceType(directKeyPressed)
    );
    trackEvent(eventTypes.SEARCH, searchEventBody);
    dispatch(action);
    dispatch(searchSuccessAction);
  } catch (error) {
    searchResultsCache.remove(actualCacheKey);
    // We only want to sync the token once, instead of every error when a user types character
    const errorCode = error.status || error.httpCode;
    if (errorCode === 401 || errorCode === 403) {
      throttledSyncToken(error.message, errorCode);
    }

    logger.error({ error, key }, 'error when loading data for Search container');
    dispatch(searchFail(key, error));
  }
};

/**
 * store src path, used to back to src path when exit search
 * @param path src page path, will only store non-search page
 */
export function storeSrcPath(path: string): TubiThunkAction {
  return (dispatch) => {
    if (path.indexOf(WEB_ROUTES.search) === 0) return Promise.resolve();

    return dispatch(actionWrapper(actionTypes.SEARCH_STORE_SRC_PATH, { fromPath: path }));
  };
}

/**
 * Set the indexes of the currently highlighted key in the keyboard grid
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @return {{columnIndex: number, rowIndex: number, type: string}}
 */
export function setKeyboardIndexes(rowIndex: number, columnIndex: number) {
  return {
    type: actionTypes.SEARCH_SET_KEYBOARD_INDEXES,
    rowIndex,
    columnIndex,
  };
}

/**
 * Sets the active section on search page. Must be either keyboard, grid or categories
 * @param {*} activeSection
 * @returns
 */
export function setActiveSearchSection(activeSection: number) {
  return {
    type: actionTypes.SET_ACTIVE_SEARCH_SECTION,
    activeSection,
  };
}
