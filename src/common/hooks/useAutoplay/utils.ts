import type { QueryClient } from '@tanstack/react-query';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import type { VideoContentResponse } from 'client/utils/clientDataRequest';
import { type LoadAutoPlayContentsRequestData, makeLoadAutoPlayContentsRequest } from 'common/api/autopilot';
import { UAPIAutoplayMode } from 'common/constants/autoplay';
import type { ParentalRating } from 'common/constants/ratings';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { AutoplayAPIResponse, AutoplayQueryData, Video } from 'common/types/video';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { formatContent } from 'common/utils/transformContent';
import { formatVideoContentData } from 'common/utils/video';

export const DEFAULT_AUTOPLAY_LIMIT = 5;

interface BuildAutoplayRequestParams {
  contentId: string;
  isAutoPlayVideo?: boolean;
  videoResourceTag?: string;
  limit?: number;
  parentalRating?: ParentalRating;
  isKidsModeEnabled?: boolean;
  enableHEVC?: boolean;
  enable4K?: boolean;
  isMobile?: boolean;
  shouldFetchArtTitle?: boolean;
}

/**
 * Helper function to build request parameters for autoplay contents
 */
export const buildAutoplayContentsRequestParams = async (
  {
    contentId,
    isAutoPlayVideo,
    videoResourceTag,
    limit = 5,
    parentalRating,
    isKidsModeEnabled,
    enableHEVC,
    enable4K,
    isMobile,
    shouldFetchArtTitle,
  }: BuildAutoplayRequestParams
): Promise<LoadAutoPlayContentsRequestData> => {
  // should set kids mode to false when user is in little kids or older kids parental ratings
  const isKidsModeParam = (() => {
    if (parentalRating === null || parentalRating === undefined) return isKidsModeEnabled;
    return isParentalRatingOlderKidsOrLess(parentalRating as number) ? false : isKidsModeEnabled;
  })();

  const { fromAutoplayDeliberate } = trackingManager.getState();
  const mode = isAutoPlayVideo && !fromAutoplayDeliberate ? UAPIAutoplayMode.AUTOPLAY : UAPIAutoplayMode.NON_AUTOPLAY;

  const videoResourceParams = await getVideoResourceQueryParameters({
    enableHEVC,
    enable4K,
  });

  const imageQuery = getImageQueryFromParams({ isMobile, useArtTitle: shouldFetchArtTitle });

  // Format the request options
  const requestOptions: LoadAutoPlayContentsRequestData = {
    content_id: contentId,
    limit,
    images: imageQuery,
    mode,
    include_series: true,
    ...(videoResourceTag && { video_resource_tag: videoResourceTag }),
    ...(isKidsModeParam && { is_kids_mode: isKidsModeParam }),
    ...videoResourceParams,
  };

  return requestOptions;
};

type AutoplayContentsQueryKey = [
  'autoplay',
  string, // contentId
  number, // limit
  boolean, // isKidsModeParam
  boolean, // enableHEVC
  boolean, // enable4K
  string | undefined, // videoResourceTag
  boolean | undefined, // isAutoPlayVideo
  boolean | undefined, // shouldFetchArtTitle
];

/**
 * Helper function to build the query key that matches useAutoplayContents
 */
export const buildAutoplayContentsQueryKey = (
  {
    contentId,
    isAutoPlayVideo,
    videoResourceTag,
    limit = 5,
    parentalRating,
    isKidsModeEnabled,
    enableHEVC,
    enable4K,
    shouldFetchArtTitle,
  }: BuildAutoplayRequestParams
): AutoplayContentsQueryKey => {

  // should set kids mode to false when user is in little kids or older kids parental ratings
  const isKidsModeParam = (() => {
    if (parentalRating === null || parentalRating === undefined) return isKidsModeEnabled;
    return isParentalRatingOlderKidsOrLess(parentalRating as number) ? false : isKidsModeEnabled;
  })();

  return [
    'autoplay',
    contentId,
    limit,
    !!isKidsModeParam,
    !!enableHEVC,
    !!enable4K,
    videoResourceTag,
    isAutoPlayVideo,
    shouldFetchArtTitle,
  ];
};

/**
 * We want each episode to be available and associated with the source content id.
 */
export const buildQueryKeyForAutoplaySeriesChildren = ({ sourceContentId, seriesId, episodeId }: { sourceContentId: string, seriesId: string, episodeId: string; }) => {
  return ['autoplay', 'series', sourceContentId, seriesId, episodeId];
};

/**
 * Query function to fetch autoplay data
 */
export const fetchAutoplayContentsData = async (
  contentId: string,
  dispatch: TubiThunkDispatch,
  options: Omit<BuildAutoplayRequestParams, 'contentId'>,
): Promise<AutoplayAPIResponse> => {
  const requestOptions = await buildAutoplayContentsRequestParams({
    contentId,
    ...options,
  });
  return await makeLoadAutoPlayContentsRequest(dispatch, requestOptions) as AutoplayAPIResponse;
};

/**
 * Do some processing on the response.
 * For series response types, we want to keep the full episode data cached in the query client.
 * Then call formatContent to transform the response to Video type.
 */
export const processAutoplayContentsResponse = ({ sourceContentId, response, queryClient }: { sourceContentId: string, response: AutoplayAPIResponse, queryClient: QueryClient; }): AutoplayQueryData => {
  const formattedVideoContentData = ((response?.contents || []) as VideoContentResponse[]).map(formatVideoContentData);

  // SIDE EFFECT
  // for each series, go through each episode, formatContent, and cache the result in the query client
  formattedVideoContentData.forEach((videoContent) => {
    if (videoContent.type === 's') {
      (videoContent.children || []).forEach(season => {
        (season.children || []).forEach((episode) => {
          queryClient.setQueryData<Video>(buildQueryKeyForAutoplaySeriesChildren({ sourceContentId, seriesId: videoContent.id, episodeId: episode.id }), formatContent(episode));
        });
      });
    }
  });

  // Proceed with processing the response to return
  const resultVideos = formattedVideoContentData.map((videoContent) => formatContent(videoContent));
  const personalizationId = response.personalization_id;

  return { contents: resultVideos, personalizationId };
};
