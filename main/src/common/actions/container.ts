/* eslint "@typescript-eslint/no-floating-promises": "error" */
import { supportsLocalStorage } from '@adrise/utils/lib/localStorage';
import Analytics from '@tubitv/analytics';
import { shouldFetch, getOngoingFetch, isCacheValid, getTTL } from '@tubitv/refetch';
import type { Location } from 'history';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import union from 'lodash/union';
import Cookie from 'react-cookie';
import { defineMessages } from 'react-intl';
import type { Action, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import { getLocalData, setCookie, getCookie } from 'client/utils/localDataStorage';
import { resetOTTHomeSelectedState } from 'common/actions/fire';
import { batchAddVideos, loadSeriesEpisodeMetadata } from 'common/actions/video';
import { fetchHomescreenContainers, fetchContentByContainerId } from 'common/api/containers';
import { makeLoadContentsByIdsRequest } from 'common/api/content';
import type { LoadContentsByIdsRequestData } from 'common/api/content';
import getApiConfig from 'common/apiConfig';
import * as actions from 'common/constants/action-types';
import type {
  CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  COOKIE_CONTAINERS_CACHE_KEY,
  CONTAINER_TYPES,
  HISTORY_CONTAINER_ID,
  HOME_DATA_SCOPE,
  FIRST_TIME_LOAD_ROW_NUM,
  QUEUE_CONTAINER_ID,
  CONTENT_MODES,
  HOMESCREEN_USER_PREFERENCES_PARAM,
  MY_LIKES_CONTAINER_ID,
  RECOMMENDED_LINEAR_CONTAINER_ID,
  FEATURED_CONTAINER_ID,
  PURPLE_CARPET_CONTAINER_ID,
} from 'common/constants/constants';
import * as errorTypes from 'common/constants/error-types';
import { CONTAINERS_REQUEST_TYPE, CUSTOM_TAGS } from 'common/constants/tracking-tags';
import { FEATURED_BILLBOARD_CONTROL } from 'common/experiments/config/webNewFeaturedBillboard';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { addSkinsAdCreatives } from 'common/features/skinsAd/action';
import { SKINS_AD_CONTAINER_ID } from 'common/features/skinsAd/constants';
import { isSkinsAdExperimentEnabledSelector, shouldShowSkinsAdSelector } from 'common/features/skinsAd/selector';
import type { Ads } from 'common/features/skinsAd/type';
import { parseSkinsAdToContainer } from 'common/features/skinsAd/utils';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { containerIdMapSelector, containerSelector, isContainerFullyLoaded, isContainersListFullyLoaded, containerLoadIdMapSelector, userModifiableContainerIdsSelector, showLikedTitlesSelector } from 'common/selectors/container';
import { currentContentModeSelector, isMyStuffPageActiveSelector } from 'common/selectors/contentMode';
import { shouldShowLinearContent } from 'common/selectors/experiments/liveNews';
import { ottFireTVRecommendedChannelsInCaSelector } from 'common/selectors/experiments/ottFireTVRecommendedChannelsInCa';
import { ottFireTVTitleTreatmentSelector } from 'common/selectors/experiments/ottFireTVTitleTreatment';
import { useFloatCuePointsSelector } from 'common/selectors/experiments/ottFloatCuePoint';
import { webNewFeaturedBillboardSelector } from 'common/selectors/experiments/webNewFeaturedBillboard';
import { enable4KSelector, enableHEVCSelector, enableHlsv6OnAndroidTVSelector, isPSSHv0Supported } from 'common/selectors/fire';
import { useHlsSelector as tizenUseHlsSelector } from 'common/selectors/tizen';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import type { SponsorshipPixelsScreen, Container, ContainerLoadState } from 'common/types/container';
import { ContainerChildType, ContainerType } from 'common/types/container';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Video, VideosResponseBody } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { getVideosInScope, isLinearContainer, preloadSponsorshipImages } from 'common/utils/containerTools';
import { isSeriesId } from 'common/utils/dataFormatter';
import { fireTrackingPixel } from 'common/utils/fireTrackingPixel';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { getPlatform } from 'common/utils/platform';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import {
  getAnonymousTokenExpiresFromStorage,
  getAnonymousTokenRequestOptions,
  getRefreshTokenExpiresFromStorage,
} from 'common/utils/token';
import { trackLogging } from 'common/utils/track';
import { makeProtocolRelativeUrl, formatContent } from 'common/utils/transformContent';
import { getContentModeParams } from 'common/utils/urlConstruction';
import { formatVideosContentData } from 'common/utils/video';
import type { LanguageLocaleType } from 'i18n/constants';
import { getIntl } from 'i18n/intl';
import { getDaysRemaining } from 'ott/utils/expiration';

import { fetchWithToken } from './fetch';
import { clearSearchStoreKeys } from './search';

const platform = getPlatform();

const messages = defineMessages({
  myList: {
    description: 'my list menu text',
    defaultMessage: 'My List',
  },
  myListDesc: {
    description: 'my list container description',
    defaultMessage: 'Your personal list',
  },
  myLikes: {
    description: 'my likes container title',
    defaultMessage: 'My Likes',
  },
  myLikesDesc: {
    description: 'my likes container description',
    defaultMessage: 'Your personal likes',
  },
  continueWatching: {
    description: 'continue watching container title',
    defaultMessage: 'Continue Watching',
  },
  continueWatchingDesc: {
    description: 'continue watching container description',
    defaultMessage: 'Add to your list now and be the first to stream once it\'s here',
  },
});

export interface ContentModeContainerSharedAction {
  type: string;
  contentMode?: CONTENT_MODE_VALUE;
  contentId?: string;
  containerId?: string;
}

// containers to render per page
const getContainersPerPage = () => __ISOTT__ ? 9 : 10;
export const PER_PAGE_MORE = 30;

export const getTTLForContainerValidDuration = (validDuration: unknown) =>
  typeof validDuration === 'number' && !isNaN(validDuration)
    ? getTTL(validDuration)
    : validDuration;

export function customizeContainerAlias(container: Container, userLanguageLocale?: LanguageLocaleType, contentMode?: CONTENT_MODE_VALUE): Container {
  const intl = getIntl(userLanguageLocale);

  if (contentMode === CONTENT_MODES.espanol) {
    return container;
  }
  /** @type {import('@formatjs/intl').MessageDescriptor} */
  let titleMsg;
  /** @type {import('@formatjs/intl').MessageDescriptor} */
  let descriptionMsg;
  switch (container.id) {
    case MY_LIKES_CONTAINER_ID:
      titleMsg = messages.myLikes;
      descriptionMsg = messages.myLikesDesc;
      break;
    case QUEUE_CONTAINER_ID:
      titleMsg = messages.myList;
      descriptionMsg = messages.myListDesc;
      break;
    case HISTORY_CONTAINER_ID:
      titleMsg = messages.continueWatching;
      descriptionMsg = messages.continueWatchingDesc;
      break;
    default:
      return container;
  }
  return {
    ...container,
    title: intl.formatMessage(titleMsg),
    description: intl.formatMessage(descriptionMsg),
  };
}

export type GetContainerRequestOptionsParams = {
  params?: {
    limit?: number;
    groupSize?: number | null;
    isKidsModeEnabled?: boolean;
    zipcode?: string;
    cacheKey?: string;
    groupStart?: number | null;
    isMobile?: boolean;
    userPreferences?: string,
    largerPoster?: boolean;
    useArtTitle?: boolean;
    includeComingSoon?: boolean;
    contentMode?: CONTENT_MODE_VALUE;
    includeWithheldContainers?: string | string[];
    limit_resolutions?: string | string[];
    video_resources?: string | string[];
    isCRM?: boolean;
    cursor?: number | null;
    expand?: number;
    expanded?: boolean;
  };
  shouldTrackDuration?: boolean;
  userIP?: string;
  useAnonymousToken?: boolean;
  trackDurationTags?: Record<string, string>,
};

export const getContainerRequestOptions = ({
  params = {},
  shouldTrackDuration,
  trackDurationTags,
  userIP,
  useAnonymousToken = false,
}: GetContainerRequestOptionsParams) => ({
  params,
  shouldTrackDuration,
  trackDurationTags,
  userIP,
  useAnonymousToken,
  ...getAnonymousTokenRequestOptions(useAnonymousToken),
});

export const formatContainerMetaData = (content: Container, userLanguageLocale: LanguageLocaleType, contentMode: CONTENT_MODE_VALUE) =>
  customizeContainerAlias(makeProtocolRelativeUrl(content), userLanguageLocale, contentMode);

export const getZipcodeIfOnComcast = () => __OTTPLATFORM__ === 'COMCAST' && Analytics.getAnalyticsConfig().postal_code || undefined;

export const createContainersLoaderParams = async (state: StoreState, location: Location, passedContentMode?: CONTENT_MODE_VALUE) => {
  const { experiments, userSettings: { parentalRating }, ui: { isKidsModeEnabled } } = state;
  const contentMode = passedContentMode || currentContentModeSelector(state, { pathname: location.pathname });

  const useArtTitle = ottFireTVTitleTreatmentSelector(state) || webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL;

  // we would like to run the experiment in FIRETV
  const videoResourceParams = __OTTPLATFORM__ === 'FIRETV_HYB' ? await getVideoResourceQueryParameters({
    isPSSHv0Supported: isPSSHv0Supported(state),
    enableHEVC: enableHEVCSelector(state),
    enable4K: enable4KSelector(state),
    androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
    tizenUseHls: tizenUseHlsSelector(state),
  }) : {};

  const params: GetContainerRequestOptionsParams['params'] = {
    ...experiments.overrides,
    // should set kids mode to false when user is in little kids or older kids parental ratings
    isKidsModeEnabled: isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled,
    ...getContentModeParams(contentMode),
    // default group paging params
    groupStart: 0,
    groupSize: FIRST_TIME_LOAD_ROW_NUM,
    largerPoster: __OTTPLATFORM__ !== 'LGTV', // larger poster has performance issue on LGTV
    includeComingSoon: __ISOTT__,
    ...videoResourceParams,
    ...(useArtTitle && { useArtTitle }),
  };

  if (contentMode === CONTENT_MODES.all && shouldShowLinearContent(state) && ottFireTVRecommendedChannelsInCaSelector(state)) {
    params.includeWithheldContainers = RECOMMENDED_LINEAR_CONTAINER_ID;
  }

  return params;
};

type FetchMyLikesContainerOptions = {
  cursor: string | null;
  client: ApiClient;
  useAnonymousToken: boolean;
  useFloatCuePoints: boolean;
  dispatch: TubiThunkDispatch;
  getState: () => StoreState;
};

export type FetchContainerResolvedValue = {
  containersHash: Record<string, Container>;
  contents: Record<string, Video>;
};

export type RatedContentResponseBody = { data: string[], next: string | null };

const fetchMyLikesContainer = async ({ cursor, useFloatCuePoints, dispatch, getState }: FetchMyLikesContainerOptions): Promise<FetchContainerResolvedValue | void> => {
  const apiConfig = getApiConfig();

  const result = await dispatch(fetchWithToken<RatedContentResponseBody>(`${apiConfig.accountServiceUserPrefix}/preferences/rate`, {
    params: {
      type: 'liked',
      target: 'title',
      // GOTCHA: The /user/preferences/rate endpoint can't reliably give us
      // the exact number of items we request, so they intentionally give us
      // up to twice as many as we ask for. Specifying a limit of 10 will
      // likely give us up to 20 results. This is expected.
      limit: 10,
      start: cursor,
    },
  }));
  // failsafe some container is blocked by remote_config
  /* istanbul ignore if */
  if (!result) return Promise.resolve();

  const { data: likedIds, next } = result;

  const id = MY_LIKES_CONTAINER_ID;

  const emptyContainer: Container = {
    children: [],
    childType: ContainerChildType.content,
    cursor: next,
    description: 'My Likes',
    id,
    slug: MY_LIKES_CONTAINER_ID,
    thumbnail: '',
    title: 'My Likes',
    type: ContainerType.regular,
  };

  if (likedIds.length === 0) {
    return {
      containersHash: {
        [id]: emptyContainer,
      },
      contents: {},
    };
  }

  const rawVideos = await fetchVideos({ contentIds: likedIds, useFloatCuePoints, dispatch, getState });
  // format the contents and filter out any that are no longer available
  const videos: Record<string, Video> = Object.fromEntries(
    Object.entries(rawVideos)
      .filter(([, content]) => content != null)
      .map(([key, content]) => [key, formatContent(content)] as const)
      .filter(([, video]) => getDaysRemaining(video) > 0)
  );

  return {
    containersHash: {
      [id]: {
        ...emptyContainer,
        children: likedIds.filter(likedId => videos[likedId] != null),
      },
    },
    contents: videos,
  };
};

export type FormattedHomescreenResult = {
  hash: Record<string, Container>;
  containersHash?: Record<string, Container>;
  containerMenuHash: Record<string, Container>;
  list: string[];
  containerMenuList: string[];
  contents: Record<string, Video>,
  next: number | null,
  personalizationId?: string;
  validDuration?: number;
  alert?: string;
  ads?: Ads[];
  isFailsafe?: boolean;
};

type FetchMyStuffContainersOptions = {
  client: ApiClient,
  showLikedTitles: boolean;
  useAnonymousToken: boolean;
  useFloatCuePoints: boolean;
  dispatch: TubiThunkDispatch;
  getState: () => StoreState;
};

type FetchMyStuffContainers = (opts: FetchMyStuffContainersOptions) => Promise<FormattedHomescreenResult>;

const fetchMyStuffContainers: FetchMyStuffContainers = async ({ client, showLikedTitles, useFloatCuePoints, dispatch, getState, ...requestOptions }) => {
  const [historyData, queueData, myLikesData] = await Promise.all([
    dispatch(fetchContentByContainerId(HISTORY_CONTAINER_ID, requestOptions)),
    dispatch(fetchContentByContainerId(QUEUE_CONTAINER_ID, requestOptions)),
    showLikedTitles ? fetchMyLikesContainer({ cursor: null, client, useAnonymousToken: requestOptions.useAnonymousToken, useFloatCuePoints, dispatch, getState }) : null,
  ]);
  const hash = {
    ...historyData?.containersHash,
    ...queueData?.containersHash,
    ...(myLikesData?.containersHash ?? {}),
  };
  const contents = {
    ...historyData?.contents,
    ...queueData?.contents,
    ...(myLikesData?.contents ?? {}),
  };
  const list = [
    HISTORY_CONTAINER_ID,
    QUEUE_CONTAINER_ID,
    ...(myLikesData ? [MY_LIKES_CONTAINER_ID] : []),
  ];
  return {
    hash,
    containerMenuHash: hash,
    list,
    containerMenuList: list,
    contents,
    next: null,
  };
};

type ContainersLoaderActionOptions = {
  contentMode: CONTENT_MODE_VALUE;
  groupSize?: number | null;
  groupStart?: number | null;
  keepLiveNews: boolean;
  limit?: number;
  location: Location,
};
export type ContainersLoaderReturnValue = {
  originalData: FormattedHomescreenResult;
  containerIds: string[];
  loadMap: Record<string, ContainerLoadState>;
  childrenMap: Record<string, string[]>;
  idMap: Record<string, Container>;
  nextContainerIndexToLoad?: number | null;
  validDuration?: number;
  containerMenuList: string[];
  personalizationId?: string;
};

const containersLoaderAction = ({
  contentMode,
  groupSize,
  groupStart,
  keepLiveNews,
  limit,
  location,
}: ContainersLoaderActionOptions): TubiThunkAction<ThunkAction<Promise<ContainersLoaderReturnValue>, StoreState, ApiClient, AnyAction>> =>
  async (dispatch, getState, client) => {
    const state = getState();
    const { auth } = state;

    // if there is a cache key, use it for the current request and delete it
    const cacheKey = Cookie.load(COOKIE_CONTAINERS_CACHE_KEY);
    if (cacheKey) {
      Cookie.remove(COOKIE_CONTAINERS_CACHE_KEY);
    }
    const containersLoaderParams = await createContainersLoaderParams(state, location, contentMode);
    const params = {
      ...containersLoaderParams,
      zipcode: getZipcodeIfOnComcast() || undefined,
      cacheKey,
      groupStart,
      groupSize,
      limit,
      isMobile: isMobileDeviceSelector(state) || undefined,
      userPreferences: getLocalData(HOMESCREEN_USER_PREFERENCES_PARAM) || undefined,
    };

    const isLoggedIn = isLoggedInSelector(state);

    const groupStartParam = Number(params.groupStart);

    const shouldTrackDuration = contentMode === 'all'; // only track contentMode is all
    let trackDurationTags: Record<string, string> | undefined;
    if (shouldTrackDuration) {
      trackDurationTags = {
        [CUSTOM_TAGS.CONTAINERS_REQUEST_TYPE]:
            groupStartParam > 0 ? CONTAINERS_REQUEST_TYPE.FOLLOWING : CONTAINERS_REQUEST_TYPE.INITIAL,
      };
    }

    const isMyStuffMode = contentMode === CONTENT_MODES.myStuff;

    const containerRequestOptions: ReturnType<typeof getContainerRequestOptions> & {headers?: Record<string, string>} = getContainerRequestOptions({
      params,
      shouldTrackDuration,
      trackDurationTags,
      userIP: auth.userIP,
      useAnonymousToken: !isLoggedIn,
    });
    containerRequestOptions.retryIncludedStatusCodes = [...(containerRequestOptions.retryIncludedStatusCodes || []), 500];
    containerRequestOptions.retryCount = containerRequestOptions.retryCount || 1;
    const showLikedTitles = showLikedTitlesSelector(state);
    const useFloatCuePoints = useFloatCuePointsSelector(state);

    // ensure that content data returned from backend has same language with user interface
    containerRequestOptions.headers = {
      ...containerRequestOptions.headers,
      'accept-language': state.ui.userLanguageLocale,
    };

    function processContainersResponse(data: FormattedHomescreenResult): ContainersLoaderReturnValue {
      const {
        list: containerIds,
        containerMenuHash,
        containerMenuList,
        hash: containerDetailHash,
        next: nextContainerIndexToLoad,
        validDuration,
        personalizationId,
        ads,
      } = data;
      const state = getState();
      const { ui: { userLanguageLocale } } = state;
      const shouldShowSkinsAd = shouldShowSkinsAdSelector(state, { contentMode });

      const childrenMap = {};
      const loadMap = {};
      const idMap = {};
      const containerIdList: string[] = [];

      for (const contId of containerMenuList) {
        // The browser_list data is used for container metadata but not load
        // state or children since those pertain to the container contents
        const containerMetadata = omit(containerMenuHash[contId], ['cursor', 'children', 'valid_duration']) as Omit<Container, 'cursor' | 'children' | 'valid_duration'>;
        idMap[contId] = formatContainerMetaData(containerMetadata, userLanguageLocale, contentMode);
      }

      containerIds.forEach((contId) => {
        const container = containerDetailHash[contId];
        const { cursor, children, valid_duration: containerValidDuration, ...rest } = container;

        const hasSkinsAdContainer = containerIdList.includes(SKINS_AD_CONTAINER_ID);
        // push the Skins Ad container to the top of the home container list
        if (shouldShowSkinsAd && ads && !hasSkinsAdContainer
          && [PURPLE_CARPET_CONTAINER_ID, FEATURED_CONTAINER_ID].includes(contId)) {
          const { container: skinsAdContainer, content: skinsAdContent } = parseSkinsAdToContainer(ads);
          if (skinsAdContainer && skinsAdContent) {
            containerIdList.push(SKINS_AD_CONTAINER_ID);
            childrenMap[SKINS_AD_CONTAINER_ID] = [skinsAdContent.id];
            loadMap[SKINS_AD_CONTAINER_ID] = {
              loading: false,
              loaded: true,
              cursor: null,
              ttl: null,
            };
            idMap[SKINS_AD_CONTAINER_ID] = skinsAdContainer;
            data.hash[SKINS_AD_CONTAINER_ID] = skinsAdContainer;
            data.contents[skinsAdContent.id] = skinsAdContent;
          }
        }

        if (contId === HISTORY_CONTAINER_ID) {
          if (auth.user || __ISOTT__) containerIdList.push(contId);
        } else if (isLinearContainer(container)) {
          if (keepLiveNews) containerIdList.push(contId);
        } else {
          containerIdList.push(contId);
        }

        data.list = containerIdList;

        // store children to containerChildrenIdMap
        if (__ISOTT__ && container.type === CONTAINER_TYPES.CHANNEL) {
          // insert placeholder child for channels, we render a channel icon as first element in the row
          childrenMap[contId] = [container.id].concat(children ?? []);
        } else {
          // no manipulation for web
          childrenMap[contId] = children;
        }

        // store cursor and ttl to containerLoadIdMap
        loadMap[contId] = {
          loading: false,
          loaded: true,
          cursor,
          ttl: getTTLForContainerValidDuration(containerValidDuration),
        };

        // all other fields go into containerIdMap
        idMap[contId] = formatContainerMetaData(rest, userLanguageLocale, contentMode);
      });

      return {
        originalData: data,
        containerIds: containerIdList,
        loadMap,
        childrenMap,
        idMap,
        nextContainerIndexToLoad,
        validDuration,
        containerMenuList,
        personalizationId,
      };
    }

    try {
      let data: FormattedHomescreenResult;
      if (isMyStuffMode) {
        data = await fetchMyStuffContainers({ client, showLikedTitles, useFloatCuePoints, dispatch, getState, ...containerRequestOptions });
      } else {
        data = await dispatch(fetchHomescreenContainers(containerRequestOptions.params, containerRequestOptions));
      }
      return processContainersResponse(data);
    } catch (serverError) {
      // TODO @cbengtson, temporary logging for anonymous token errors
      /* istanbul ignore next */
      if (!isLoggedInSelector(state)) {
        // testing if device is able to set cookies via javascript
        setCookie('tokenTest', 'tokenTest', 60);
        const testCookie = getCookie('tokenTest');
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_ContainerErr_home',
          message: {
            errorMessage: serverError.message,
            errorStatus: serverError.status || serverError.httpCode,
            accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
            refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
            canSetCookie: `${!!testCookie}`,
            cookiesEnabled: `${typeof navigator !== 'undefined' && navigator.cookieEnabled}`,
            userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
            localStorage: `${supportsLocalStorage()}`,
            pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
          },
        });
      }
      logger.error(
        serverError,
        (serverError.status === 401 || serverError.httpCode === 401) && !isLoggedInSelector(state)
          ? 'AnonymousTokenError making /oz/container request HOME'
          : 'Load containers from server fail.'
      );
      throw serverError;
    }
  };

/**
 * First several rows of containers are loaded with fetchData in OTTHome,
 * remaining containers could be lazy loaded with this function
 */
export function lazyloadHomeScreen({ groupSize = null, location }: { groupSize?: number | null; location: Location }): TubiThunkAction<ThunkAction<Promise<string | void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const state = getState();
    const keepLiveNews = shouldShowLinearContent(state);
    const container = containerSelector(state, { pathname: location.pathname });
    const contentMode = currentContentModeSelector(state, { pathname: location.pathname });
    const isMyStuffPageActive = isMyStuffPageActiveSelector(state, { pathname: location.pathname });
    const { nextContainerIndexToLoad, isFetching } = container;

    if (isContainerFullyLoaded(container) || isMyStuffPageActive) {
      return Promise.resolve('fully loaded');
    }

    const groupStart = nextContainerIndexToLoad;
    if (!isFetching) {
      // request next page
      dispatch({
        type: actions.LOAD_CONTAINERS.FETCH,
        ...getContentModeParams(contentMode),
      });
      return dispatch(
        containersLoaderAction({ groupStart, keepLiveNews, groupSize, contentMode, location })
      )
        .then((data) => {
          // ensure that we get latest container state when request is complete
          // otherwise, `container` might provide stale data if requests such as `loadContainer` have changed it
          // and also should ensure that we should get the container state form the correct contentMode
          // otherwise, `containerState` might provide wrong contentMode data if switching content mode before the request is completed
          const containerState = containerSelector(getState(), { forceCurrentMode: contentMode, pathname: location.pathname });
          const { containersList } = containerState;

          // pick out `idMap`, `childrenMap`, `loadMap` from data, that's what we want
          // NOTE: merge is recursive, but only for object, not array
          // thus concat `containersList`.
          dispatch({
            type: actions.LOAD_CONTAINERS.SUCCESS,
            payload: {
              ...data,
              idMap: {
                ...containerState.containerIdMap,
                ...data.idMap,
              },
              childrenMap: {
                ...containerState.containerChildrenIdMap,
                ...data.childrenMap,
              },
              loadMap: {
                ...containerState.containerLoadIdMap,
                ...data.loadMap,
              },
              containerIds: union([...containersList, ...data.containerIds]),
              personalizationId: data.personalizationId,
            },
            ...getContentModeParams(contentMode),
          });

          /* istanbul ignore next */
          if (__CLIENT__) {
            preloadSponsorshipImages(Object.values(data.idMap));
          }

          return dispatch(batchAddVideos(getVideosInScope(data.originalData, HOME_DATA_SCOPE.all)));
        })
        .catch((error) => {
          logger.error('error lazyLoadHomeScreen', error);
          dispatch({
            type: actions.LOAD_CONTAINERS.FAILURE,
            ...getContentModeParams(contentMode),
          });
        });
    }

    return Promise.resolve();
  };
}

export function loadLiveNewsContainers({ location }: {location: Location}): TubiThunkAction {
  return (dispatch, getState) => {
    const liveNewsContentMode = CONTENT_MODES.linear;
    const state = getState();

    const containers = state.contentMode[liveNewsContentMode];
    const { isFetching } = containers;
    if (isFetching || isContainersListFullyLoaded(containers)) {
      return Promise.resolve('fetching or loaded');
    }
    dispatch({
      type: actions.LOAD_CONTAINERS.FETCH,
      ...getContentModeParams(liveNewsContentMode),
    });
    return dispatch(
      containersLoaderAction({
        contentMode: liveNewsContentMode,
        keepLiveNews: true,
        location,
      })
    )
      .then((data) => {
        const newState = getState();
        const containerState = newState.contentMode[liveNewsContentMode];
        const container = containerSelector(newState, { forceCurrentMode: liveNewsContentMode, pathname: location.pathname });
        const { containersList } = container;

        dispatch({
          type: actions.LOAD_CONTAINERS.SUCCESS,
          payload: {
            ...data,
            idMap: {
              ...data.idMap,
              ...containerState.containerIdMap,
            },
            childrenMap: {
              ...data.childrenMap,
              ...containerState.containerChildrenIdMap,
            },
            loadMap: { ...containerState.containerLoadIdMap, ...data.loadMap },
            containerIds: union([...containersList, ...data.containerIds]),
            personalizationId: data.personalizationId,
          },
          ...getContentModeParams(liveNewsContentMode),
        });

        return dispatch(batchAddVideos(getVideosInScope(data.originalData)));
      })
      .catch((error) => {
        logger.error('error loadLiveNewsContainers', error);
        dispatch({
          type: actions.LOAD_CONTAINERS.FAILURE,
          ...getContentModeParams(liveNewsContentMode),
        });
      });
  };
}

type LoadHomeScreenConfig = {
  /** reset all containers */
  force?: boolean;

  /**
   * One of the following:
   *  - HOME_DATA_SCOPE.all: all containers and video details, won't request again if container meta data exists
   *  - HOME_DATA_SCOPE.firstScreen: all containers but only first few rows of video details
   */
  scope?: HOME_DATA_SCOPE;

  /** remove existing videos and containers if true */
  clearExisting?: boolean;

  /** specify to override the content mode requested */
  contentMode?: CONTENT_MODE_VALUE;

  limit?: number;
  loadChannelGuide?: boolean;

  location: Location;
};

export function loadHomeScreen({
  force = false,
  scope = HOME_DATA_SCOPE.all,
  clearExisting = false,
  location,
  ...restOptions
}: LoadHomeScreenConfig): TubiThunkAction<ThunkAction<Promise<Omit<ContainersLoaderReturnValue, 'originalData'>>, StoreState, ApiClient, Action>> {
  return async (dispatch, getState) => {
    const state = getState();

    const keepLiveNews = shouldShowLinearContent(state);
    const container = containerSelector(state, { forceCurrentMode: restOptions.contentMode, pathname: location.pathname });
    const contentMode = restOptions.contentMode || currentContentModeSelector(state, { pathname: location.pathname });

    const limit = restOptions.limit;
    const loadChannelGuide = restOptions.loadChannelGuide;

    const firstScreenGroupSize = FIRST_TIME_LOAD_ROW_NUM;
    const { ttl, nextContainerIndexToLoad } = container;
    const hasLoadedScope = scope === HOME_DATA_SCOPE.firstScreen
      ? nextContainerIndexToLoad === null || nextContainerIndexToLoad >= firstScreenGroupSize
      : nextContainerIndexToLoad === null;

    // When loading channel guide, always invalidate the current data
    if (!force && !shouldFetch(container) && hasLoadedScope && !loadChannelGuide) {
      return getOngoingFetch(container);
    }

    const isCacheExpiredFetch = ttl ? !isCacheValid(ttl) : false;

    if (force) {
      // search store results could be invalid
      await dispatch(clearSearchStoreKeys());

      if (__ISOTT__) {
        // reset idx for all rows, prevents err when trying to find idx that may now be removed
        // from parental change
        if (!isMyStuffPageActiveSelector(state, { pathname: location.pathname })) {
          dispatch(actionWrapper(actions.RESET_UI_CONTAINER_INDEX_MAP));
          dispatch(actionWrapper(actions.RESET_OTT_CONTAINER_INDEX_MAP));
        }

        // When `force` is true, it usually means we need to invalidate container related state.
        // So we also reset contentMode states for tv/movie.
        if (!state.auth.ottOneTapPending) {
          dispatch(actionWrapper(actions.RESET_CONTENT_MODE));
        }
      }
    }

    const deleteExistingVideos = clearExisting || (__IS_SLOW_PLATFORM__ ? force : false);

    const groupParams = scope === HOME_DATA_SCOPE.firstScreen ? {
      groupStart: 0,
      groupSize: firstScreenGroupSize,
    } : {};

    return dispatch({
      type: actions.LOAD_CONTAINERS,
      ...getContentModeParams(contentMode),
      payload: () => dispatch(containersLoaderAction({ contentMode, ...groupParams, keepLiveNews, limit, location }))
        .then(async (data) => {
          let finalScope = scope;
          // if failsafe, tensor returns all containers
          if (data.originalData.isFailsafe) {
            finalScope = HOME_DATA_SCOPE.all;
          }
          // add videos to video store
          await dispatch(batchAddVideos(getVideosInScope(data.originalData, finalScope), { deleteExistingVideos }));

          if (__ISOTT__ && isMyStuffPageActiveSelector(state, { pathname: location.pathname })) {
            // load video info for series in CW row to show the resume info and improve the speed direct to player page
            await Promise.all(((data.childrenMap[HISTORY_CONTAINER_ID] || []) as string[]).map(contentId => {
              if (isSeriesId(contentId)) {
                return dispatch(loadSeriesEpisodeMetadata(contentId));
              }
              return undefined;
            }));
          }

          // The user will get back to the first video in the first container when the cache is expired or force fetch.
          if (isCacheExpiredFetch || force) {
            if (__ISOTT__) {
              // For OTT
              if (!isMyStuffPageActiveSelector(state, { pathname: location.pathname })) {
                dispatch(resetOTTHomeSelectedState(location, data.containerIds[0]));
              }
            } else {
              // For WEB
              dispatch(actionWrapper(actions.RESET_UI_CONTAINER_INDEX_MAP));
            }
          }

          /* istanbul ignore if: got connect ECONNREFUSED error when override ____CLIENT__ */
          if (__CLIENT__) {
            preloadSponsorshipImages(Object.values(data.idMap));
          }

          const { originalData, ...rest } = data;

          if (isSkinsAdExperimentEnabledSelector(state, { contentMode })) {
            dispatch(addSkinsAdCreatives(originalData?.ads));
          }
          return rest;
        }).catch((error) => {
          error.errType = errorTypes.LOAD_HOME_SCREEN_FAIL;
          return Promise.reject(error);
        }),
    });
  };
}

/**
 * Loads the container menu list, which is used to enumerate all containers for
 * the containers page and other cases which do not rely on the home screen
 * being fully loaded.
 */
export function loadContainerMenuList(location: Location, forceContentMode?: CONTENT_MODE_VALUE): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const state = getState();
    const contentMode = forceContentMode || currentContentModeSelector(state, { pathname: location.pathname });
    const container = containerSelector(state, { forceCurrentMode: contentMode, pathname: location.pathname });

    if (container.isContainerMenuListLoaded) {
      return Promise.resolve();
    }

    const {
      experiments,
      userSettings: { parentalRating },
      ui: { isKidsModeEnabled, userLanguageLocale },
    } = state;

    const params: NonNullable<GetContainerRequestOptionsParams['params']> = {
      limit: 0,
      // Containers route doesn't allow groupSize=0, so just load the featured container
      groupSize: 1,
      isKidsModeEnabled: isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled,
      ...getContentModeParams(contentMode),
      ...experiments.overrides,
      includeComingSoon: __ISOTT__,
    };
    const zipcode = getZipcodeIfOnComcast();
    if (zipcode) {
      params.zipcode = zipcode;
    }
    const useAnonymousToken = !isLoggedInSelector(state);

    return dispatch(fetchHomescreenContainers(params, { useAnonymousToken }))
      .then((data) => {
        const idMap = {};
        const { containerMenuHash, containerMenuList } = data;
        for (const contId of containerMenuList) {
          const containerMetadata = omit(containerMenuHash[contId], ['cursor', 'children', 'valid_duration']) as Omit<Container, 'cursor' | 'children' | 'valid_duration'>;
          idMap[contId] = formatContainerMetaData(containerMetadata, userLanguageLocale, contentMode);
        }
        dispatch({
          type: actions.LOAD_CONTAINER_MENU_LIST_SUCCESS,
          idMap,
          containerMenuList,
          ...getContentModeParams(contentMode),
        });
      })
      .catch((error) => {
        // TODO @cbengtson, temporary logging for anonymous token errors
        /* istanbul ignore next */
        if (!isLoggedInSelector(state)) {
          // testing if device is able to set cookies via javascript
          setCookie('tokenTest', 'tokenTest', 60);
          const testCookie = getCookie('tokenTest');

          trackLogging({
            type: 'CLIENT:INFO',
            level: 'info',
            subtype: 'anonError_ContainerErr_list',
            message: {
              errorMessage: error.message,
              errorStatus: error.status || error.httpCode,
              accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
              refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
              canSetCookie: `${!!testCookie}`,
              cookiesEnabled: `${typeof navigator !== 'undefined' && navigator.cookieEnabled}`,
              localStorage: `${supportsLocalStorage()}`,
              userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
              pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
            },
          });
        }
        if ((error.status === 401 || /* istanbul ignore next */ error.httpCode === 401) && !isLoggedInSelector(state)) {
          logger.error(error, 'AnonymousTokenError making /oz/container request LIST');
        }
        logger.error(error, 'Load containers list fail.');
        return Promise.reject(error);
      });
  };
}

/**
 * start loading container
 * @param containerId
 * @param [contentMode]
 */
export function startLoadingContainer(containerId: string, contentMode: CONTENT_MODE_VALUE): TubiThunkAction {
  return (dispatch) => {
    const contentModeParams = getContentModeParams(contentMode);
    return dispatch({
      type: actions.LOAD_CONTAINER,
      id: containerId,
      ...contentModeParams,
    });
  };
}

/**
 * Add or update single container
 *
 * @deprecated Currently only exported for testing, should probably not be
 * called outside this file
 */
export function addContainer({ contId, containerInfo, contentMode, location, forceRefetch = false }: {
  contId: string,
  containerInfo: Container,
  contentMode: CONTENT_MODE_VALUE,
  location: Location,
  forceRefetch?: boolean;
}): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const state = getState();
    const { ui: { userLanguageLocale } } = state;
    const contentModeParams = getContentModeParams(contentMode);

    const children = containerInfo.children;
    const cursor = containerInfo.cursor;
    delete containerInfo.children;
    delete containerInfo.cursor;
    const ttl = getTTLForContainerValidDuration(containerInfo.valid_duration);
    delete containerInfo.valid_duration;

    const currentContentMode = currentContentModeSelector(state, { pathname: location.pathname });
    dispatch(actionWrapper(actions.LOAD_CONTAINER_SUCCESS, {
      id: contId,
      result: children,
      cursor,
      ttl,
      shouldOverride: forceRefetch,
      currentContentMode,
      container: formatContainerMetaData(containerInfo, userLanguageLocale, contentMode),
      ...contentModeParams,
    }));

    return Promise.resolve();
  };
}

export function loadContainersSuccess({ hash, contentMode, forceRefetch, location }: {
  hash: Record<string, Container>;
  contentMode: CONTENT_MODE_VALUE;
  forceRefetch?: boolean;
  location: Location;
}): TubiThunkAction {
  // change to this manner cuz `redux-logger` can't log action returns `return { type, val }`
  return (dispatch) => {
    const promises: Promise<unknown>[] = [];
    Object.keys(hash).forEach((key) => {
      promises.push(dispatch(addContainer({
        contId: key,
        containerInfo: hash[key],
        contentMode,
        forceRefetch,
        location,
      })));
    });

    return Promise.all(promises);
  };
}

type LoadContainerConfig = {
  /** the id of the container to load (not the index) */
  id: string;
  /** the level of container you want to expand to content, 0/1/2 */
  expand?: number;
  /** pagination limit */
  limit?: number | null;
  /** refetch container data regardless current state, override container state rather than merging. */
  forceRefetch?: boolean;
  expanded?: boolean;
  largerPoster?: boolean;
  /** refetch container data regardless current state */
  contentMode?: CONTENT_MODE_VALUE;
  isCRM?: boolean;
  location: Location;
};

/**
 * Load the specified container by doing any server-side calls necessary. If already loaded or currently loading,
 * do nothing
 */
export const loadContainer = ({
  id,
  expand,
  limit = null,
  forceRefetch = false,
  isCRM,
  location,
  ...restOptions
}: LoadContainerConfig): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> => async (dispatch, getState, client) => {
  const state = getState();
  const { userSettings: { parentalRating }, ui: { isKidsModeEnabled } } = state;
  const {
    containerLoadIdMap,
    containerChildrenIdMap,
  } = containerSelector(state, { forceCurrentMode: restOptions.contentMode, pathname: location.pathname });

  const contentMode = restOptions.contentMode || currentContentModeSelector(state, { pathname: location.pathname });
  const { auth, experiments } = state;
  const loadStatus = containerLoadIdMap[id] || {};
  const useAnonymousToken = isLoggedInSelector(state);
  const useFloatCuePoints = useFloatCuePointsSelector(state);

  if (!forceRefetch && (loadStatus.loading || (loadStatus.cursor === null && containerChildrenIdMap[id]))) {
    return Promise.resolve();
  }

  dispatch(startLoadingContainer(id, contentMode));

  try {
    const cursorParam = forceRefetch ? 0 : (loadStatus.cursor || 0);

    const data = await (async () => {
      switch (id) {
        case MY_LIKES_CONTAINER_ID:
          return fetchMyLikesContainer({ cursor: String(cursorParam), client, useAnonymousToken, useFloatCuePoints, dispatch, getState });
        default:
          const useArtTitle = ottFireTVTitleTreatmentSelector(state) || webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL;
          const videoResourceParams = __OTTPLATFORM__ === 'FIRETV_HYB' ? await getVideoResourceQueryParameters({
            isPSSHv0Supported: isPSSHv0Supported(state),
            enableHEVC: enableHEVCSelector(state),
            enable4K: enable4KSelector(state),
            androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
            tizenUseHls: tizenUseHlsSelector(state),
          }) : {};
          const options = getContainerRequestOptions({
            userIP: auth.userIP,
            params: {
              cursor: cursorParam,
              isCRM,
              limit: limit || getContainersPerPage(),
              /**
               * Set isKidsModeEnabled to false if parentalRatings is 0/1.
               * Else just use the current isKidsModeEnabled flag.
               */
              isKidsModeEnabled: isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled,
              ...getContentModeParams(contentMode),
              ...experiments.overrides,
              zipcode: getZipcodeIfOnComcast() || undefined,
              isMobile: isMobileDeviceSelector(state) || undefined,
              expand: typeof expand === 'number' ? expand : undefined,
              expanded: restOptions.expanded || undefined,
              largerPoster: restOptions.largerPoster || undefined,
              ...(useArtTitle && { useArtTitle }),
              ...videoResourceParams,
            },
          });
          return dispatch(fetchContentByContainerId(id, options));
      }
    })();

    // failsafe some container is blocked by remote_config
    /* istanbul ignore if */
    if (!data) {
      throw new Error('No data returned from fetchContentByContainerId');
    }

    const { contents, containersHash } = data;
    // convert contents Hash to an array
    const children = Object.keys(contents).map(key => contents[key]);
    await dispatch(batchAddVideos(children));

    if (__ISOTT__ && isMyStuffPageActiveSelector(state, { pathname: location.pathname })) {
      if (id === HISTORY_CONTAINER_ID) {
        // load video info for series in CW row to show the resume info and improve the speed direct to player page
        await Promise.all(
          (containersHash[HISTORY_CONTAINER_ID].children ?? /* istanbul ignore next */ [])
            .map(contentId => {
              if (isSeriesId(contentId)) {
                return dispatch(loadSeriesEpisodeMetadata(contentId));
              }
              return undefined;
            })
        );
      }
    }

    dispatch(loadContainersSuccess({
      hash: containersHash,
      contentMode,
      forceRefetch,
      location,
    }));
  } catch (error) {
    // log all errors for webott_samsung_homescreen_content_count experiment
    /* istanbul ignore next */
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: errorTypes.LOG_SUB_TYPE.HOMESCREEN_LOAD_MORE_API_ERROR,
      message: {
        cursor: loadStatus.cursor,
        containerId: id,
        errorMessage: error.message,
        errorStatus: error.status || error.httpCode,
        pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
      },
    });

    // TODO @cbengtson, temporary logging for anonymous token errors
    /* istanbul ignore next */
    if (!isLoggedInSelector(state)) {
      // testing if device is able to set cookies via javascript
      setCookie('tokenTest', 'tokenTest', 60);
      const testCookie = getCookie('tokenTest');
      trackLogging({
        type: 'CLIENT:INFO',
        level: 'info',
        subtype: 'anonError_ContainerErr_cont',
        message: {
          errorMessage: error.message,
          errorStatus: error.status || error.httpCode,
          accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
          refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
          canSetCookie: `${!!testCookie}`,
          cookiesEnabled: `${typeof navigator !== 'undefined' && navigator.cookieEnabled}`,
          localStorage: `${supportsLocalStorage()}`,
          userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
          pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
        },
      });
    }

    if ((error.status === 401 || error.httpCode === 401) && !isLoggedInSelector(state)) {
      logger.error(error, 'AnonymousTokenError making /oz/container request CONTAINER');
    }

    // no need to check for error, ApiClient always returns an error object
    if (error.httpCode === 404) {
      error.errType = errorTypes.CONTENT_NOT_FOUND;
    } else {
      error.errType = errorTypes.LOAD_CONTENT_FAIL;
    }
    const level = [error.status, error.httpCode].some(code => String(code).startsWith('5')) ? 'error' : 'warn';
    logger[level]({ error, containerId: id }, 'load container fail');
    dispatch(actionWrapper(actions.LOAD_CONTAINER_FAIL, { id, error }));
    throw error;
  }
};

// For mocking calls to loadContainer() in the unit tests
export const _loadContainerRef = {
  loadContainer,
};

export const loadUserModifiableContainersForContainerMenu = (location: Location): TubiThunkAction => (dispatch, getState) => {
  const state = getState();
  if (!isLoggedInSelector(state)) return Promise.resolve();
  const containerLoadIdMap = containerLoadIdMapSelector(state, { pathname: location.pathname });
  const userModifiableContainerIds = userModifiableContainerIdsSelector(state);
  const containersToLoad = userModifiableContainerIds.filter(id => {
    const loadState = containerLoadIdMap[id];
    if (!loadState) return true;
    const { loaded, loading, error } = loadState;
    return !loaded && !loading && !error;
  });
  return Promise.all(containersToLoad.map(id => dispatch(_loadContainerRef.loadContainer({
    id,
    contentMode: CONTENT_MODES.all,
    location,
  }))));
};

export const syncExpiredContainers = ({ location, forceContentMode, setIsLoading }: {
  location: Location,
  forceContentMode?: CONTENT_MODE_VALUE,
  setIsLoading?: (isLoading: boolean) => void
}): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> =>
  async (dispatch, getState) => {
    const state = getState();
    const { containersList, containerLoadIdMap, containerChildrenIdMap } = containerSelector(state, { forceCurrentMode: forceContentMode, pathname: location.pathname });
    const contentMode = forceContentMode || currentContentModeSelector(state, { pathname: location.pathname });
    const expiredContainers = containersList.filter(containerId => {
      const containerLoadState = containerLoadIdMap[containerId];
      if (!containerLoadState) return null;
      const { ttl } = containerLoadState;
      return ttl != null && !isCacheValid(ttl);
    });
    if (!expiredContainers.length) {
      return;
    }
    setIsLoading?.(true);
    try {
      await Promise.all(expiredContainers.map(async containerId => {
        const currentContainerIdList = containerChildrenIdMap[containerId] || [];
        const currentLoadedCount = currentContainerIdList.length || 0;
        await dispatch(_loadContainerRef.loadContainer({
          id: containerId,
          expand: 0,
          contentMode,
          forceRefetch: true,
          limit: Math.max(currentLoadedCount, getContainersPerPage()),
          location,
        }));
      }));
    } finally {
      setIsLoading?.(false);
    }
  };

/**
 * Sync container state from server for all possible content modes (all, tv, movie, espanol...).
 * Now it only support history/queue container. Restrict can be removed
 * if general container has such needs in the future.
 * @param {(HISTORY_CONTAINER_ID|QUEUE_CONTAINER_ID)} containerId the id of the container to load
 */
export function syncContainerForAllContentModes(containerId: string, location: Location): TubiThunkAction {
  return (dispatch, getState) => {
    if (![HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID].includes(containerId)) {
      return Promise.reject(
        new TypeError(`containerId only accepts ${HISTORY_CONTAINER_ID} or ${QUEUE_CONTAINER_ID}, receiving ${containerId}`)
      );
    }

    const state = getState();

    const { ui: { isKidsModeEnabled } } = state;

    let contentModes;
    if (__ISOTT__ && !isKidsModeEnabled) {
      contentModes = [
        CONTENT_MODES.all,
        CONTENT_MODES.movie,
        CONTENT_MODES.tv,
        CONTENT_MODES.espanol,
        CONTENT_MODES.myStuff,
      ];
    } else if (isKidsModeEnabled) {
      contentModes = [CONTENT_MODES.all, CONTENT_MODES.myStuff];
    } else {
      // Web
      contentModes = [
        CONTENT_MODES.all,
        CONTENT_MODES.espanol,
      ];
    }

    const requests = contentModes.map((contentMode) => {
      let containerState;
      if (contentMode === CONTENT_MODES.all) {
        containerState = state.container;
      } else {
        containerState = state.contentMode[contentMode];
      }
      const { containerChildrenIdMap, containersList } = containerState;
      const currentContainerIdList = containerChildrenIdMap[containerId] || [];
      const currentLoadedCount = currentContainerIdList.length || 0;

      // Prevent unnecessary refetching when there's no cached data for certain content mode
      if (containersList.includes(containerId)) {
        return dispatch(_loadContainerRef.loadContainer({
          id: containerId,
          forceRefetch: true,
          limit: Math.max(currentLoadedCount, getContainersPerPage()),
          contentMode,
          location,
        }));
      }
      return false;
    });

    return Promise.all(requests.filter((r): r is Promise<void> => Boolean(r)));
  };
}

export function loadMoreItems(
  location: Location,
  containerId: string,
  /** value to use for UAPI call. default 1 is set in routes/container.js */
  expand?: number,
  /** manually set contentMode, only use for use for live news on web currently. */
  contentMode?: CONTENT_MODE_VALUE,
): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch) => {
    return dispatch(loadContainer({ id: containerId, expand, limit: PER_PAGE_MORE, contentMode, location }));
  };
}

/** add content to containers store, insert to containerChildrenIdMap */
export function addNewContentToContainer(contentId: string, containerId: string, isEspanolContent: boolean) {
  return actionWrapper(actions.ADD_NEW_CONTENT_TO_CONTAINER, {
    contentId,
    containerId,
    isEspanolContent,
  });
}

/** remove a content from local store */
export function removeContentFromContainer(contentId: string, containerId: string, isEspanolContent?: boolean) {
  return {
    type: actions.REMOVE_CONTENT_FROM_CONTAINER,
    contentId,
    containerId,
    isEspanolContent,
  };
}

export function setContainerContext(containerId: string, contentMode?: CONTENT_MODE_VALUE) {
  return {
    type: actions.SET_CONTAINER_CONTEXT,
    id: containerId,
    contentMode,
  };
}

export function clearContainerContext() {
  return {
    type: actions.CLEAR_CONTAINER_CONTEXT,
  };
}

export function markPixelsFired(containerId?: string, screen?: SponsorshipPixelsScreen) {
  return {
    type: actions.MARK_PIXELS_FIRED,
    id: containerId,
    screen,
  };
}

export function clearPixelsFired(screen: SponsorshipPixelsScreen, containerId?: string) {
  return {
    type: actions.CLEAR_PIXELS_FIRED,
    id: containerId,
    screen,
  };
}

export function firePixels(location: Location, containerId: string, screen: SponsorshipPixelsScreen): TubiThunkAction {
  return (dispatch, getState, client) => {
    const state = getState();
    const pixelsAlreadyFired = get(state, ['container', 'sponsorship', 'pixelsFired', containerId, screen], false);
    if (pixelsAlreadyFired) {
      return;
    }
    const pixelUrls = containerIdMapSelector(state, { pathname: location.pathname })[containerId]?.sponsorship?.pixels[screen];
    if (isEmpty(pixelUrls)) {
      logger.warn({ containerId, screen }, 'No pixel URLs found for sponsored container');
      return;
    }
    pixelUrls?.forEach(url => fireTrackingPixel(client, url));
    // Don't hang around waiting for the pixel requests to succeed because we don't care if they do or not.
    dispatch(markPixelsFired(containerId, screen));
  };
}

export function setSponExp(sponExp: string) {
  return {
    type: actions.SET_SPON_EXP,
    sponExp,
  };
}

export function clearSponExp() {
  return {
    type: actions.CLEAR_SPON_EXP,
  };
}

export function updateContainerCursor(containerId: string, cursor: number | null) {
  return {
    type: actions.UPDATE_CONTAINER_CURSOR,
    containerId,
    cursor,
  };
}

export type InvalidateContainerAction = {
  type: typeof actions['INVALIDATE_CONTAINER'],
  contentMode: CONTENT_MODE_VALUE,
  containerId: string,
};

export const invalidateContainer = (location: Location, containerId: string, forceContentMode?: CONTENT_MODE_VALUE): TubiThunkAction => (dispatch, getState) => {
  const contentMode = forceContentMode || currentContentModeSelector(getState(), { pathname: location.pathname });
  dispatch({
    type: actions.INVALIDATE_CONTAINER,
    contentMode,
    containerId,
  });
};

export const fetchVideos = async ({
  contentIds,
  useFloatCuePoints,
  dispatch,
  getState,
}: {
  contentIds: string[];
  useFloatCuePoints: boolean;
  dispatch: TubiThunkDispatch;
  getState: () => StoreState;
}): Promise<VideosResponseBody> => {
  let videoMap: VideosResponseBody;
  try {
    const state = getState();
    const { auth } = state;

    const videoResourceParams = __OTTPLATFORM__ === 'FIRETV_HYB' ? await getVideoResourceQueryParameters({
      isPSSHv0Supported: isPSSHv0Supported(state),
      enableHEVC: enableHEVCSelector(state),
      enable4K: enable4KSelector(state),
      androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
      tizenUseHls: tizenUseHlsSelector(state),
    }) : {};

    const qsData: LoadContentsByIdsRequestData = {
      app_id: 'tubitv',
      platform,
      images: getImageQueryFromParams({ useArtTitle: webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL }),
      content_ids: contentIds.join(','),
      ...videoResourceParams,
    };

    /* istanbul ignore else */
    if (auth.deviceId) {
      const deviceId = auth.deviceId;
      qsData.device_id = deviceId;
    }

    if (auth.user?.userId) {
      qsData.user_id = auth.user.userId;
    }

    const response = await makeLoadContentsByIdsRequest(dispatch, qsData, state);
    // Disable float cue point on web platform temporarily to avoid illegal bot requests
    const rawBody = omitBy(response, isNull);
    const formattedBody = !useFloatCuePoints
      ? formatVideosContentData(rawBody)
      : rawBody;

    videoMap = formattedBody;
  } catch (error) {
    // When every id you pass to the endpoint is not found, it responds with
    // a 404 error, so if we're handling a 404, ignore the error.
    /* istanbul ignore else */
    if (error.status !== 404) {
      logger.error({ error }, 'Error fetching videos');
    }
    videoMap = {};
  }

  return videoMap;
};
