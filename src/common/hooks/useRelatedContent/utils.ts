import type { QueryClient } from '@tanstack/react-query';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import type { RelatedVideoContentResponse } from 'client/utils/clientDataRequest';
import { batchAddVideos } from 'common/actions/video';
import { type LoadRelatedContentsRequestData, makeLoadRelatedContentsRequest } from 'common/api/autopilot';
import { CONTAINER_ID_FOR_RELATED_RANKING, RELATED_CONTENTS_LIMIT, SERIES_CONTENT_TYPE, FREEZED_EMPTY_ARRAY } from 'common/constants/constants';
import { shouldFetchArtTitleSelector } from 'common/selectors/artTitle';
import { enable4KSelector, enableHEVCSelector } from 'common/selectors/fire';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { RelatedContent, Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { formatVideoContentData } from 'common/utils/video';

type RelatedContentQueryKey = ['relatedContent', string, number, boolean, boolean, boolean, string | undefined];
/**
 * Helper function to build the query key that matches useRelatedContent
 */
export const buildRelatedContentQueryKey = ({
  contentId,
  limit = RELATED_CONTENTS_LIMIT,
  videoResourceTag,
  isKidsModeEnabled,
  parentalRating,
  enableHEVC,
  enable4K,
}: {
  contentId: string;
  limit?: number;
  videoResourceTag?: string;
  isKidsModeEnabled: boolean;
  parentalRating: number;
  enableHEVC: boolean;
  enable4K: boolean;
}): RelatedContentQueryKey => {
  // should set kids mode to false when user is in little kids or older kids parental ratings
  const isKidsModeParam = isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;

  return ['relatedContent', contentId, limit, isKidsModeParam, !!enableHEVC, !!enable4K, videoResourceTag];
};

/**
 * Helper function to build request parameters for related content
 */
export const buildRelatedContentRequestParams = async (
  contentId: string,
  state: StoreState,
  limit: number = RELATED_CONTENTS_LIMIT,
  videoResourceTag?: string,
): Promise<LoadRelatedContentsRequestData> => {
  const isKidsModeEnabled = state.ui.isKidsModeEnabled;
  const parentalRating = state.userSettings.parentalRating;
  const isMobile = state.ui.isMobile;
  const enableHEVC = enableHEVCSelector(state);
  const enable4K = enable4KSelector(state);

  // should set kids mode to false when user is in little kids or older kids parental ratings
  const isKidsModeParam = isParentalRatingOlderKidsOrLess(parentalRating) ? false : isKidsModeEnabled;

  const imageQuery = getImageQueryFromParams({ isMobile, useArtTitle: shouldFetchArtTitleSelector() });

  // Format the request options
  const videoResourceParams = await getVideoResourceQueryParameters({
    enableHEVC,
    enable4K,
  });

  return {
    content_id: contentId,
    limit,
    images: imageQuery,
    video_resource_tag: videoResourceTag,
    ...(isKidsModeParam && { is_kids_mode: isKidsModeParam }),
    ...videoResourceParams,
  };
};

/**
 * Helper function to process the related content API response.
 */
const processRelatedContentResponse = (
  result: RelatedVideoContentResponse,
  dispatch: TubiThunkDispatch,
): RelatedContent => {
  // Handle side effects following a successful fetch
  const relatedRows = result.related_rows || [];
  if (!relatedRows.length) {
    return { contents: [], personalizationId: undefined };
  }

  // @todo-liam Remove the batchAddVideos call here. Call formatVideoContentData and formatContent on the videos before returning them from the queryFn
  const relatedContents = relatedRows.map(({ id: rowId, title, contents }) => {
    const contentIds: string[] = [];
    if (contents.length) {
      contents.forEach(({ id, type }) => {
        contentIds.push(type === SERIES_CONTENT_TYPE ? convertSeriesIdToContentId(id) : id);
      });

      const videosToAdd = contents.map(formatVideoContentData);
      dispatch(batchAddVideos(videosToAdd, { shouldReportEmptyCuePoints: true }));
    }
    return {
      id: rowId,
      title,
      contents: contentIds,
    };
  });

  const personalizationId = result.personalization_id;

  return { contents: relatedContents, personalizationId };
};

/**
 * Main query function for fetching related content
 */
export const fetchRelatedContentData = async (
  contentId: string,
  state: StoreState,
  dispatch: TubiThunkDispatch,
  limit: number = RELATED_CONTENTS_LIMIT,
  videoResourceTag?: string,
): Promise<RelatedContent> => {
  const requestOptions = await buildRelatedContentRequestParams(contentId, state, limit, videoResourceTag);
  const result = await makeLoadRelatedContentsRequest(dispatch, requestOptions);
  return processRelatedContentResponse(result, dispatch);
};

/**
 * Helper function to extract YMAL content from QueryClient cache
 */
export const getYmalContentFromCache = ({ queryClient, video, state, videoResourceTag, limit }: { queryClient: QueryClient; video: Video; state: StoreState; videoResourceTag?: string, limit: number }) => {
  const isKidsModeEnabled = state.ui.isKidsModeEnabled;
  const parentalRating = state.userSettings.parentalRating;
  const enableHEVC = enableHEVCSelector(state);
  const enable4K = enable4KSelector(state);
  const queryKey = buildRelatedContentQueryKey({
    contentId: video.id,
    limit,
    videoResourceTag,
    isKidsModeEnabled,
    parentalRating,
    enableHEVC: !!enableHEVC,
    enable4K: !!enable4K,
  });
  const cachedData = queryClient.getQueryData<RelatedContent>(queryKey);

  if (!cachedData?.contents?.length) {
    return FREEZED_EMPTY_ARRAY;
  }

  // Find the YMAL container
  const ymalContainer = cachedData.contents.find(container =>
    container.id === CONTAINER_ID_FOR_RELATED_RANKING
  );

  if (!ymalContainer?.contents?.length) {
    return FREEZED_EMPTY_ARRAY;
  }

  return ymalContainer.contents;
};

/**
 * Helper function to trigger the related content query
 */
export const triggerRelatedContentQuery = async ({
  video,
  queryClient,
  dispatch,
  state,
  limit = RELATED_CONTENTS_LIMIT,
  videoResourceTag,
}: {
  video: Video;
  queryClient: QueryClient;
  dispatch: TubiThunkDispatch;
  state: StoreState;
  limit?: number;
  videoResourceTag?: string;
}): Promise<void> => {
  const isKidsModeEnabled = state.ui.isKidsModeEnabled;
  const parentalRating = state.userSettings.parentalRating;
  const enableHEVC = enableHEVCSelector(state);
  const enable4K = enable4KSelector(state);
  const queryKey = buildRelatedContentQueryKey({
    contentId: video.id,
    limit,
    videoResourceTag,
    isKidsModeEnabled,
    parentalRating,
    enableHEVC: !!enableHEVC,
    enable4K: !!enable4K,
  });

  // Check if data is already cached and fresh
  const cachedData = queryClient.getQueryData<RelatedContent>(queryKey);
  if (cachedData) {
    return;
  }

  await queryClient.fetchQuery({
    queryKey,
    queryFn: () => fetchRelatedContentData(video.id, state, dispatch, limit, videoResourceTag),
    // The default config for gcTime is some smaller value. Because `triggerRelatedContentQuery`
    // is used in an imperative mechanism in BWW (as of this commit) that triggers a fetch just
    // once, if the content is purged from the cache, we will get buggy behavior and no automatic
    // refetch. For this reason, we pass `Infinity` to prevent the content from being purged
    // from the cache, ever. Doesn't this create a memory leak? We only fetch BWW content once
    // per playback session, so for very long autoplay sessions this can be a problem-- albeit
    // no more of a problem than it was for the redux implementation which react-query replaced.
    // Thus, we need this:
    // TODO: refactor to use a more declarative mechanism for fetching BWW content.
    gcTime: Infinity,
  });
};
