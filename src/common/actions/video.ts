import { getOngoingFetch, getTTL, isCacheValid, shouldFetch } from '@tubitv/refetch';
import flatMap from 'lodash/flatMap';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';
import omitBy from 'lodash/omitBy';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import { trackThumbnailDataFetchError } from 'client/features/playback/track/client-log/trackThumbnailDataFetchError';
import type { VideoContentResponse } from 'client/utils/clientDataRequest';
import { reportRequestTimings } from 'client/utils/performance';
import type { LoadAutoPlayContentsRequestData, LoadRelatedContentsRequestData } from 'common/api/autopilot';
import { makeLoadAutoPlayContentsRequest, makeLoadRelatedContentsRequest } from 'common/api/autopilot';
import type { LoadSeriesEpisodesData, LoadThumbnailSpritesData, LoadVideoContentByIdData } from 'common/api/content';
import { makeLoadVideoContentById, makeLoadThumbnailSpritesRequest, makeLoadSeriesEpisodesRequest } from 'common/api/content';
import * as actions from 'common/constants/action-types';
import { UAPIAutoplayMode } from 'common/constants/autoplay';
import { LINEAR_CONTENT_TYPE, RELATED_CONTENTS_LIMIT, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import * as errTypes from 'common/constants/error-types';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import platformHash from 'common/constants/platforms';
import { FEATURED_BILLBOARD_CONTROL } from 'common/experiments/config/webNewFeaturedBillboard';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { ottFireTVTitleTreatmentSelector } from 'common/selectors/experiments/ottFireTVTitleTreatment';
import { useFloatCuePointsSelector } from 'common/selectors/experiments/ottFloatCuePoint';
import { webNewFeaturedBillboardSelector } from 'common/selectors/experiments/webNewFeaturedBillboard';
import {
  enable4KSelector,
  enableHEVCSelector,
  enableHlsv6OnAndroidTVSelector,
  isDRMSupportedVersionOnSamsung,
  isPSSHv0Supported,
} from 'common/selectors/fire';
import { useHlsSelector as tizenUseHlsSelector } from 'common/selectors/tizen';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Pagination, Season, SeriesEpisodesResponse, EpisodeInfo, Series } from 'common/types/series';
import type { StoreState } from 'common/types/storeState';
import type {
  BatchAddVideosAction,
  LoadAutoPlayContentsAction,
  LoadByIdAction,
  LoadContentThumbnailSpritesAction,
  LoadRelatedContentsAction,
  LoadSeriesEpisodesMetadataSuccessAction,
  ThumbnailSpritesKeys,
  Video,
} from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { getContentById } from 'common/utils/containerTools';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { getPlatform } from 'common/utils/platform';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { isBetweenStartAndEndTime } from 'common/utils/remoteConfig';
import { trackLogging } from 'common/utils/track';
import { convertToHttps, formatContent } from 'common/utils/transformContent';
import { formatVideoContentData, formatVideosAutoPlayContentData } from 'common/utils/video';

const platform = getPlatform();

/**
 * If we found no cue points in response, send a log
 */
export function reportOnEmptyCuePoints(videoId: string, cuePoints?: number[], message?: string) {
  if (!cuePoints || (Array.isArray(cuePoints) && cuePoints.length === 0)) {
    trackLogging({
      type: TRACK_LOGGING.clientInfo,
      subtype: LOG_SUB_TYPE.EMPTY_CUE_POINTS_FROM_RESPONSE,
      message: {
        video_id: videoId,
        message,
      },
    });
  }
}

const getLastScheduleTime = (video?: Video) =>
  video?.schedules
    ?.map(schedule => new Date(schedule.start_time).getTime())
    .sort()
    .pop();

const nextChannelHasNewerSchedules = (prev: Video | undefined, next: Video) => {
  const prevScheduleTime = getLastScheduleTime(prev);
  const nextScheduleTime = getLastScheduleTime(next);
  return nextScheduleTime && (!prevScheduleTime || nextScheduleTime > prevScheduleTime);
};

interface BatchAddVideosOptions {
  deleteExistingVideos?: boolean,
  validDuration?: number,
  shouldReportEmptyCuePoints?: boolean,
}
/**
 * add contents array into store
 * @param {array} contents [Array] array of contents
 * @param {object} options
 *  - deleteExistingVideos - a flag to tell reducer you can remove existing videos
 *  - validDuration shared by all contents in contents argument
 * @returns {Promise}
 */
export function batchAddVideos(
  contents: Video[] | VideoContentResponse[],
  options: BatchAddVideosOptions = {}
): ThunkAction<
  Promise<void>,
  StoreState,
  ApiClient,
  BatchAddVideosAction | LoadSeriesEpisodesMetadataSuccessAction
> {
  return (dispatch, getState) => {
    const state = getState();
    const { video } = state;
    const { fullContentById, byId } = video;
    const { deleteExistingVideos = false, validDuration, shouldReportEmptyCuePoints = false } = options;

    const toAddContents = {};
    const fullContentsMap = {};
    const cuePointsMap = {};
    contents.forEach((item) => {
      // do not change the original object
      const content = { ...item };
      const isSeries = content.type === SERIES_CONTENT_TYPE;
      const prefix = isSeries ? '0' : '';
      const contentId = `${prefix}${content.id}`;

      // if we are deleting existing videos then we always add new content as it wont be a duplication
      // if full info of content has been loaded, don't override
      // @note there are duplicate videos across containers, avoid overwrite which will cause needless re-render
      const missingResources = !byId[contentId]?.video_resources && content.video_resources;
      const missingPrograms = !byId[contentId]?.programs && content.programs;
      const nextHasNewerSchedules = content.type === LINEAR_CONTENT_TYPE && nextChannelHasNewerSchedules(byId[contentId], content);
      const shouldOverwriteSeries = isSeries && !byId[contentId]?.seasons?.length && 'children' in content;
      /* istanbul ignore next */
      const needsLoginChanged = (content.needs_login ?? false) !== (byId[contentId]?.needs_login ?? false);
      if (
        !deleteExistingVideos
        && !missingResources
        && !missingPrograms
        && !nextHasNewerSchedules
        && !shouldOverwriteSeries
        && !needsLoginChanged
        && (fullContentById[contentId] || byId[contentId])
      ) {
        return;
      }
      const hasResources = !!content.video_resources?.length;
      const contentValidDuration = content.valid_duration || validDuration;
      if (typeof contentValidDuration !== 'undefined' && hasResources && !isNaN(contentValidDuration)) {
        content.ttl = getTTL(contentValidDuration);
      }
      delete content.valid_duration;

      toAddContents[contentId] = formatContent(content, byId[contentId]);

      fullContentsMap[contentId] = hasResources;

      if (!isSeries) {
        const cuePoints = getCuePoints(content);
        if (cuePoints) {
          cuePointsMap[contentId] = cuePoints;
        }
        if (shouldReportEmptyCuePoints) {
          reportOnEmptyCuePoints(contentId, cuePoints, 'empty cue points returned in batch requests');
        }
      }
    });

    if (Object.keys(toAddContents).length === 0) return Promise.resolve();

    // for some platforms we want to remove existing videos from store and only have those needed
    const action = deleteExistingVideos ? actions.BATCH_ADD_VIDEOS_AND_REMOVE_OLD : actions.BATCH_ADD_VIDEOS;
    dispatch(actionWrapper(action, { contents: toAddContents, fullContentsMap, cuePointsMap }));
    return Promise.resolve();
  };
}

interface LoadByIdOptions<T> {
  force?: boolean;
  pagination?: Pagination;
  onlyLoadChildren?: boolean;
  resolveFn: (result: VideoContentResponse & { seasons?: Season[] }, dispatch: TubiThunkDispatch, existingContent?: Video) => T;
  isKidsMode?: boolean;
  shouldTrackDuration?: boolean;
  trackDurationTags?: Record<string, string>;
}

function platformSpecificQueryParameters(state: StoreState) {
  const isTizen = __OTTPLATFORM__ === 'TIZEN';
  const isPS4 = __OTTPLATFORM__ === 'PS4';
  const isPS4orTizen = isPS4 || isTizen;
  const isDRMSupported = getDRMSupportStatus({ state });
  const { videoResourceTag } = platformHash[__OTTPLATFORM__] || {};

  return {
    ...(!isPS4orTizen || isPS4 || (isTizen && isDRMSupported)) && { video_resource_tag: videoResourceTag },
    ...(isTizen && { isDRMSupported }),
  };
}

export const loadById = <T>(
  contentId: string,
  {
    force,
    onlyLoadChildren,
    pagination,
    resolveFn,
    isKidsMode,
    shouldTrackDuration,
    trackDurationTags,
  }: LoadByIdOptions<T>
): TubiThunkAction<LoadByIdAction<T>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const { video: { statusById, fullContentById, byId }, auth, ui: { isMobile } } = state;
    const contentStatus = statusById[contentId];
    const { ttl: contentTTL } = byId[contentId] || {};

    // early reject when video id is not valid
    if (isNaN(Number(contentId))) {
      return Promise.reject({ errType: errTypes.INVALID_CONTENT_ID, contentId });
    }

    const isFullLoaded = fullContentById[contentId];
    // if the content cache is still valid
    if (typeof contentTTL !== 'undefined' && isCacheValid(contentTTL) && isFullLoaded && !force && !onlyLoadChildren) {
      return Promise.resolve();
    }

    const needToFetch = !contentStatus || shouldFetch(contentStatus);
    if (!needToFetch && isFullLoaded && !force) {
      return getOngoingFetch(contentStatus);
    }

    const videoResourceParams = await getVideoResourceQueryParameters({
      isPSSHv0Supported: isPSSHv0Supported(state),
      enableHEVC: enableHEVCSelector(state),
      enable4K: enable4KSelector(state),
      androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
      tizenUseHls: tizenUseHlsSelector(state),
    });

    const useFloatCuePoints = useFloatCuePointsSelector(state);
    const useArtTitle = ottFireTVTitleTreatmentSelector(state) || webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL;

    const clientConfig = {
      retryCount: 2,
      retryExcludedStatusCodes: [404],
      shouldTrackDuration,
      trackDurationTags,
    };

    const imageQuery = getImageQueryFromParams({ isMobile, ...(useArtTitle && { useArtTitle }) });
    let { video_resources } = videoResourceParams;
    const { limit_resolutions } = videoResourceParams;

    /* istanbul ignore next */
    if (typeof video_resources === 'string') {
      video_resources = [video_resources];
    }
    /* istanbul ignore next */
    const qsData: LoadVideoContentByIdData = {
      app_id: 'tubitv',
      platform,
      content_id: contentId,
      device_id: auth.deviceId,
      include_channels: true,
      video_resources,
      limit_resolutions,
      // In the node proxy we are not correctly passing is_kids_mode param to content api
      // content API expects is_kids_mode but in the node proxy it is passed as isKidsMode
      // so fixing that here, but not sure of the effects @cbengtson
      ...(isKidsMode && { is_kids_mode: true }),
      ...(imageQuery ? { images: imageQuery } : {}),
      ...(pagination && {
        pagination: {
          season: pagination.season,
          page_in_season: pagination.page,
          page_size_in_season: pagination.size,
          ...(onlyLoadChildren && { fields: 'children,id,type' }),
        },
      }),

    };

    const payload = () => makeLoadVideoContentById(dispatch, qsData, clientConfig, state).then(result => {
      const formattedResponse = !useFloatCuePoints ? formatVideoContentData(result) : result;
      return resolveFn(formattedResponse, dispatch, byId[contentId]);
    })
      .catch((error) => {
        if (error.httpCode === 404) {
          error.errType = errTypes.CONTENT_NOT_FOUND;
        } else {
          error.errType = errTypes.LOAD_CONTENT_FAIL;
        }

        return Promise.reject(error);
      });

    /* istanbul ignore next */
    if (onlyLoadChildren) {
      return payload();
    }
    return dispatch({
      type: actions.LOAD_CONTENT_RF,
      id: contentId,
      payload,
    });
  };
};

interface LoadVideoByIdOptions {
  force?: boolean,
  isKidsMode?: boolean,
}

export interface LoadVideoByIdResult {
  result: Video;
  validDuration: number | undefined;
  cuePoints: number[] | undefined;
}

/**
 * load content, with cache builtin. If either one at below is true, we will NOT send request
 *  - the content cache (content.ttl) is not expired. Note, content.ttl may have multiple source of true, except this
 *    action, could also from the batchAddVideos(used in search, or next api)
 *  - there is an ongoing request for the same content
 * @param contentId
 * @param force force request and ignore the cache policy
 * @param isKidsMode if enabled, it will ensure video is kid friendly
 */
export function loadVideoById(
  contentId: string,
  { force, isKidsMode }: LoadVideoByIdOptions = {}
) {
  return loadById(contentId, {
    force,
    resolveFn(result, _, existingContent): LoadVideoByIdResult {
      const { valid_duration: validDuration, ...contentFields } = result;
      const formattedResult = formatContent(contentFields as Video, existingContent);
      /**
       * TODO @cbengtson @JoshG
       * THIS IS A WORKAROUND
       * because oz/videos request does not return `vibes`, the `vibes` property is removed from the video object
       * (the vibes property exists from the homescreen API response video object)
       * a permanent fix would be for the /content API to return the vibes property
       */
      if (existingContent?.vibes) {
        formattedResult.vibes = existingContent.vibes;
      }

      let cuePoints: number[] | undefined = [];
      // don't report empty cue points for live content as cues are not expected
      // type = l => live, type = v => vod... etc
      /* istanbul ignore else */
      if (![SERIES_CONTENT_TYPE, LINEAR_CONTENT_TYPE].includes(result.type)) {
        cuePoints = getCuePoints(formattedResult);
        reportOnEmptyCuePoints(contentId, cuePoints, 'empty cue points returned from content api');
      }
      return {
        result: formattedResult,
        validDuration,
        cuePoints,
      };
    },
    isKidsMode,
  });
}

interface SeriesMetadata {
  id: string;
  seasons: Season[];
}

export type LoadSeriesEpisodeMetadataResponse = TubiThunkAction<
  ThunkAction<Promise<SeriesMetadata | null>, StoreState, ApiClient, AnyAction>
>;

export function loadSeriesEpisodeMetadataSuccess(response: SeriesEpisodesResponse) {
  // Currently, the IDs for the episodes come back as a number, but we want them as a string, so let's just
  // change that here. The amount of changes needed to deal with them as numbers is too much otherwise.
  const seasons = Object.entries(response.episodes_by_season).map(([number, episodesItems]) => {
    const episodes = episodesItems.map((episode): EpisodeInfo => {
      return { ...episode, id: `${episode.id}` };
    });

    // if a series is recurring, we want to display the seasons/episodes in reverse chronological order
    if (response.is_recurring) {
      episodes.reverse();
    }

    return {
      number,
      episodes,
    };
  });

  // if a series is recurring, we want to display the seasons/episodes in reverse chronological order
  if (response.is_recurring) {
    seasons.reverse();
  }

  const metadata = {
    id: `${response.series_id}`,
    seasons,
  };
  return actionWrapper(actions.LOAD_SERIES_EPISODES_METADATA_SUCCESS, metadata);
}

export function loadSeriesEpisodeMetadata(seriesId: string): LoadSeriesEpisodeMetadataResponse {
  return async (dispatch, getState): Promise<SeriesMetadata | null> => {
    const contentId = convertSeriesIdToContentId(seriesId);
    // We want to request the metadata about all the episode IDs in all the seasons if making a paginated request,
    // and we don't have it already.
    const series = getState().video.byId[contentId];
    const existingSeasons = series?.seasons;
    if (existingSeasons && series.isMetadataLoaded) {
      return {
        id: contentId,
        seasons: existingSeasons,
      };
    }
    try {
      let response: SeriesEpisodesResponse | null = null;
      const qsData: LoadSeriesEpisodesData = {
        platform,
        seriesId: contentId,
      };
      response = await makeLoadSeriesEpisodesRequest(dispatch, qsData, getState());
      // handle nullish or empty object responses by returning null and not saving the response in the store
      if (isEmpty(response)) {
        return null;
      }
      const action = loadSeriesEpisodeMetadataSuccess(response);
      dispatch(action);
      return { id: action.id, seasons: action.seasons };
    } catch (ex) {
      logger.error(ex, `Error when fetching episode metadata for series ${contentId}`);
    }
    return null;
  };
}

export interface LoadSeriesResult {
  result: Video;
  isPaginatedResult: boolean;
  validDuration: number | undefined;
}

export function loadEntireSeries(seriesId: string, force: boolean = false): TubiThunkAction<LoadByIdAction<LoadSeriesResult>> {
  return (dispatch: TubiThunkDispatch): Promise<LoadSeriesResult> => {
    const contentId = convertSeriesIdToContentId(seriesId);
    return dispatch(loadById(contentId, {
      force,
      resolveFn(result, dispatch, existingContent): LoadSeriesResult {
        const { children = [], valid_duration: validDuration } = result;

        const episodes = flatMap(children, (season) => season.children || []);

        // Send request duration to datadog without waiting for a route change, otherwise we risk not sending it.
        reportRequestTimings();

        // Must provide validDuration as not all contents in children have a valid_duration property
        dispatch(batchAddVideos(episodes, {
          validDuration,
          shouldReportEmptyCuePoints: true,
        }));
        const formattedResult = formatContent(result, existingContent);
        return {
          result: formattedResult,
          isPaginatedResult: false,
          validDuration,
        };
      },
    }));
  };
}

export interface LoadEpisodesInSeriesParams extends Pagination {
  seriesId: string;
  force?: boolean;
}

export function loadEpisodesInSeries({ seriesId, season, page, size, force }: LoadEpisodesInSeriesParams): ThunkAction<Promise<LoadSeriesResult>, StoreState, ApiClient, AnyAction> {
  const pagination = { season, page, size };
  return async (dispatch, getState) => {
    const contentId = convertSeriesIdToContentId(seriesId);
    /* istanbul ignore next */
    const isSubsequentEpisodesPagedRequest = page > 1 || (typeof season === 'number' && season > 1) || (typeof season === 'string' && Number(season.split('-')[0]) > 1);

    const { video } = getState();

    const seriesVideo = getContentById(video.byId, seriesId) as unknown as Series;

    const loadSeriesAction = loadById(contentId, {
      force,

      // In these cases, we should fetch all seasons without the pagination:
      // 1. It's a recurring series, the `1-2` seasons are not we want, we need to get the latest seasons
      // 2. In OTT deep link case we don't know if it is recurring before fetching, we just get all temporarily
      pagination: (seriesVideo?.is_recurring || (__ISOTT__ && !seriesVideo)) ? undefined : pagination,
      onlyLoadChildren: isSubsequentEpisodesPagedRequest,
      resolveFn: /* istanbul ignore next */(result, dispatch, existingContent): LoadSeriesResult => {
        const { children = [], valid_duration: validDuration } = result;

        const episodes = flatMap(children, (season) => season.children /* istanbul ignore else */ || []);

        // Send request duration to datadog without waiting for a route change, otherwise we risk not sending it.
        reportRequestTimings();

        // Must provide validDuration as not all contents in children have a valid_duration property
        dispatch(batchAddVideos(episodes, {
          validDuration,
          shouldReportEmptyCuePoints: true,
        }));
        const formattedResult = formatContent(result, existingContent);
        /**
       * TODO @cbengtson @JoshG
       * THIS IS A WORKAROUND
       * because oz/videos request does not return `vibes`, the `vibes` property is removed from the video object
       * (the vibes property exists from the homescreen API response video object)
       * a permanent fix would be for the /content API to return the vibes property
       */
        if (existingContent?.vibes) {
          formattedResult.vibes = existingContent.vibes;
        }
        return {
          result: formattedResult,
          isPaginatedResult: true,
          validDuration,
        };
      },
    });
    const series = await dispatch(loadSeriesAction);
    const metadata = await dispatch(loadSeriesEpisodeMetadata(seriesId));

    // if metadata fetching fails for a paginated request, just retry fetching the whole series,
    // so that users aren't affected.
    if (!metadata) {
      return dispatch(loadEntireSeries(seriesId));
    }
    return series;
  };

}

export function setResumePosition(contentId: string, position: number = 0) {
  return {
    type: actions.SET_RESUME_POSITION,
    id: contentId,
    resumePosition: position,
  };
}

/**
 * Remove resume position in video store
 * @param contentIds: string[]
 */
export function removeResumePosition(contentIds: string[]) {
  return {
    type: actions.REMOVE_RESUME_POSITION,
    ids: contentIds,
  };
}

/**
 * load YMAL contents
 * Currently, we don't have YMAL on OTT so it's only used for Web
 * if we add YMAL in OTT one day, we may need add specific code for different platform, eg, it may need to pass zipcode for COMCAST
 * @param videoId
 */
export function loadRelatedContents(videoId: string, limit?: number): ThunkAction<
  Promise<void>,
  StoreState,
  ApiClient,
  LoadRelatedContentsAction
> {
  return async (dispatch, getState) => {
    const state = getState();
    const { ui: { isKidsModeEnabled, isMobile }, userSettings: { parentalRating } } = state;

    const videoResourceParams = await getVideoResourceQueryParameters({
      isPSSHv0Supported: isPSSHv0Supported(state),
      enableHEVC: enableHEVCSelector(state),
      enable4K: enable4KSelector(state),
      androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
      tizenUseHls: tizenUseHlsSelector(state),
    });

    // should set kids mode to false when user is in little kids or older kids parental ratings
    const isKidsMode = isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;

    const { video_resource_tag } = platformSpecificQueryParameters(state);
    const imageQuery = getImageQueryFromParams({ isMobile, useArtTitle: webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL });
    const requestOptions: LoadRelatedContentsRequestData = {
      content_id: videoId,
      limit: limit || RELATED_CONTENTS_LIMIT,
      images: imageQuery,
      ...(isKidsMode && { is_kids_mode: isKidsMode }),
      ...(!!video_resource_tag && { video_resource_tag }),
      ...videoResourceParams,
    };

    return makeLoadRelatedContentsRequest(dispatch, requestOptions, state)
      .then((result) => {
        const relatedRows = result.related_rows || [];
        if (!relatedRows.length) {
          return;
        }
        const relatedContents = relatedRows.map(({ id: rowId, title, contents }) => {
          const contentIds: string[] = [];
          if (contents.length) {
            contents.forEach(({ id, type }) => {
              contentIds.push(type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id);
            });

            dispatch(batchAddVideos(contents, { shouldReportEmptyCuePoints: true }));
          }
          return {
            id: rowId,
            title,
            contents: contentIds,
          };
        });
        dispatch(actionWrapper(actions.LOAD_RELATED_CONTENTS_SUCCESS, { id: videoId, result: relatedContents }));
      });
  };
}

interface LoadAutoPlayContentsOptions {
  isAutoPlayVideo?: boolean;
  limit?: number;
}
/**
 * load autoplay contents
 * @param {String} videoId
 * @param {Object} [options]
 * @param {Boolean} [options.isAutoPlayVideo] - Whether the current video is an autoplay video
 * @param {Number} [options.limit=5] - Number of autoplay records to retrieve
 * @return {Function}
 */
export function loadAutoPlayContents(videoId: string, { isAutoPlayVideo, limit = 5 }: LoadAutoPlayContentsOptions = {}):
  ThunkAction<
    Promise<void>,
    StoreState,
    ApiClient,
    LoadAutoPlayContentsAction
  > {
  return async (dispatch, getState) => {
    const state = getState();
    const {
      video: { autoPlayContentsById },
      userSettings: { parentalRating },
      ui: { isKidsModeEnabled, isMobile },
    } = state;

    const { loaded: autoPlayLoaded, loading: autoPlayLoading } = autoPlayContentsById[videoId] || {};
    if (autoPlayLoaded || autoPlayLoading) return Promise.resolve();
    const { fromAutoplayDeliberate } = trackingManager.getState();
    const mode = isAutoPlayVideo && !fromAutoplayDeliberate ? UAPIAutoplayMode.AUTOPLAY : UAPIAutoplayMode.NON_AUTOPLAY;

    const videoResourceParams = await getVideoResourceQueryParameters({
      isPSSHv0Supported: isPSSHv0Supported(state),
      enableHEVC: enableHEVCSelector(state),
      enable4K: enable4KSelector(state),
      androidTVUseHlsv6: enableHlsv6OnAndroidTVSelector(state),
      tizenUseHls: tizenUseHlsSelector(state),
    });
    const { video_resource_tag } = platformSpecificQueryParameters(state);
    const imageQuery = getImageQueryFromParams({ isMobile, useArtTitle: webNewFeaturedBillboardSelector(state) !== FEATURED_BILLBOARD_CONTROL });
    const isKidsMode = isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;

    const requestOptions: LoadAutoPlayContentsRequestData = {
      content_id: videoId,
      limit,
      images: imageQuery,
      mode,
      include_series: true,
      ...(isKidsMode && { is_kids_mode: isKidsMode }),
      ...(!!video_resource_tag && { video_resource_tag }),
      ...videoResourceParams,
    };
    dispatch(actionWrapper(actions.LOAD_AUTOPLAY_CONTENTS, { contentId: videoId }));
    return makeLoadAutoPlayContentsRequest(dispatch, requestOptions, state)
      .then((resultBody) => {
        const rawBody = omitBy(resultBody as object, isNull);
        const result = formatVideosAutoPlayContentData(rawBody.contents as unknown as Video[]) as unknown as VideoContentResponse[];

        if (result.length === 0) {
          return Promise.reject(`The response for "/oz/videos/${videoId}/next" is empty.`);
        }
        dispatch(batchAddVideos(result, { shouldReportEmptyCuePoints: true }));
        // For web we need to add the episodes because the data is needed on the episode playback page
        if (!__ISOTT__) {
          result.forEach(({ type, children = [], valid_duration: validDuration }) => {
            if (type === SERIES_CONTENT_TYPE && children) {
              /* istanbul ignore next */
              const episodes = flatMap(children, (season) => season.children || []);
              dispatch(batchAddVideos(episodes, { validDuration, shouldReportEmptyCuePoints: true }));
            }
          });
        }
        dispatch(actionWrapper(actions.LOAD_AUTOPLAY_CONTENTS_SUCCESS, {
          id: videoId,
          result: result.map(content => content.type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(content.id) : content.id),
        }));
      })
      .catch((error: unknown) => {
        logger.error({ error, videoId }, `load autoplay contents ${videoId} v3 fail`);
        dispatch(actionWrapper(actions.LOAD_AUTOPLAY_CONTENTS_FAIL, { contentId: videoId }));
      });
  };
}

/**
 * load thumbnail sprites of a content
 * @param {String} contentId
 * @param {ThumbnailSpritesKeys} type
 */
export function loadContentThumbnailSprites(contentId: string, type: ThumbnailSpritesKeys = '5x'):
  ThunkAction<
    Promise<void>,
    StoreState,
    ApiClient,
    LoadContentThumbnailSpritesAction
  > {
  return async (dispatch, getState) => {
    const { video: { thumbnailSpritesById }, auth: { deviceId }, remoteConfig: { major_event_failsafe_start, major_event_failsafe_end } } = getState();

    const thumbnailSpritesDisabled = isBetweenStartAndEndTime(major_event_failsafe_start, major_event_failsafe_end);
    if (thumbnailSpritesById[contentId]) return;

    const qsData: LoadThumbnailSpritesData = {
      platform,
      app_id: 'tubitv',
      page_enabled: false,
      device_id: deviceId!,
      type,
      contentId,
    };

    const emptyResult = {
      columns: 0,
      count_per_sprite: 0,
      duration: 0,
      frame_width: 0,
      height: 0,
      id: '',
      rows: 0,
      sprites: [],
      type,
    };

    try {
      if (thumbnailSpritesDisabled) {
        dispatch(actionWrapper(actions.LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS, {
          contentId,
          result: emptyResult,
        }));
        return;
      }
      const result = await makeLoadThumbnailSpritesRequest(dispatch, qsData, getState());
      if (result) {
        dispatch(actionWrapper(actions.LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS, {
          contentId,
          result: convertToHttps(result) as any,
        }));
      }
    } catch (error) {
      trackThumbnailDataFetchError({ error });
      dispatch(actionWrapper(actions.LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS, {
        contentId,
        result: emptyResult,
      }));
    }
  };
}

export function getCuePoints(model: Video | VideoContentResponse): number[] | undefined {
  return get(model, 'monetization.cue_points');
}

export function getDRMSupportStatus({ state }: { state: StoreState }) {
  if (!FeatureSwitchManager.isDefault(['DRM', 'NativeCompatibility'])) {
    return FeatureSwitchManager.isEnabled(['DRM', 'NativeCompatibility']);
  }
  if (__OTTPLATFORM__ === 'TIZEN') {
    return !!isDRMSupportedVersionOnSamsung(state);
  }
  return true;
}
