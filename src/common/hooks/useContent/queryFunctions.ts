import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { getVideoResourceQueryParameters } from 'client/features/playback/props/query';
import { reportRequestTimings } from 'client/utils/performance';
import { insertProcessedContents } from 'common/actions/video';
import type { LoadVideoContentByIdData } from 'common/api/content';
import { makeLoadSeriesEpisodesRequest, makeLoadVideoContentById } from 'common/api/content';
import { EPISODE_PAGINATION_PAGE_SIZE } from 'common/constants/constants';
import * as errTypes from 'common/constants/error-types';
import { shouldFetchArtTitleSelector } from 'common/selectors/artTitle';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { ottMajorPlatformsVideoResourceTagSelector } from 'common/selectors/experiments/ottMajorVideoSelector';
import { enable4KSelector, enableHEVCSelector } from 'common/selectors/fire';
import { isKidsModeEnabledSelector, uiSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { EpisodeInfo, Season, SeriesEpisodesResponse } from 'common/types/series';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getImageQueryFromParams } from 'common/utils/imageResolution';
import { getPlatform } from 'common/utils/platform';
import { type SeasonWithFullEpisodes, transformContent } from 'common/utils/transformContent';
import { formatVideoContentData } from 'common/utils/video';

import type { SeriesPaginationInfo } from './useSeriesPaginationInfo';

const platform = getPlatform();

export interface ContentQueryOptions {
  trackDurationTags?: Record<string, string>;
  shouldTrackDuration?: boolean;
  // Pagination support (for series)
  pagination?: SeriesPaginationState;
}

/**
 * Pagination state for series episodes - tracks what's loaded for each season
 */
export interface SeriesPaginationState {
  season: string | number; // Which season(s) to load: '1', '1-2', 2, etc.
  page: number; // Page number within the season(s)
  size: number | undefined; // Number of episodes to load per season. undefined means load all
}

export interface ContentApiOptions {
  isKidsMode?: boolean;
  videoResourceTag?: string;
  pagination?: SeriesPaginationState;
}

/**
 * Compute pagination param for series based on recurrence and caller-provided options
 */
export const getPaginationParam = (
  options: ContentQueryOptions | undefined,
  isRecurring: boolean = false,
): SeriesPaginationState | undefined => {
  if (isRecurring) {
    return undefined;
  }
  return options?.pagination || { season: 1, page: 1, size: EPISODE_PAGINATION_PAGE_SIZE };
};

/**
 * Build React Query key for content
 * Used by both useContent hook and prefetchContent function
 */
export const buildContentQueryKey = (contentId: string, options: ContentApiOptions = {}) => {
  const { videoResourceTag, isKidsMode, pagination } = options;

  const apiOptions: ContentApiOptions = {};
  if (videoResourceTag) apiOptions.videoResourceTag = videoResourceTag;
  if (isKidsMode) apiOptions.isKidsMode = isKidsMode;

  const key = ['content', contentId, apiOptions];

  // For infinite queries, pagination params (season, page, size) are fetching details, not cache boundaries
  // All episodes from any season/page go into the same cache for this content
  if (pagination) {
    key.push('paginated');
  }

  return key;
};

interface StateValues {
  deviceId: string;
  isMobile: boolean;
  enableHEVC: boolean | undefined; // Allow undefined to match selector behavior
  enable4K: boolean | undefined; // Allow undefined to match selector behavior
  shouldFetchArtTitle: boolean;
  isKidsMode: boolean;
  videoResourceTag: string | undefined;
}

/**
 * Query function for individual content
 * Used by both useContent hook and prefetchContent function
 */
export const contentQueryFn = async (
  contentId: string,
  options: ContentQueryOptions,
  dispatch: TubiThunkDispatch,
  stateOrGetState: StateValues | (() => StoreState),
  queryClient: QueryClient,
): Promise<Video> => {
  // Handle both state values (from hooks) and getState function (from prefetch)
  const stateValues: StateValues = typeof stateOrGetState === 'function'
    ? {
      deviceId: deviceIdSelector(stateOrGetState()) || 'unknown',
      isMobile: uiSelector(stateOrGetState()).isMobile,
      enableHEVC: enableHEVCSelector(stateOrGetState()), // Don't convert undefined to false
      enable4K: enable4KSelector(stateOrGetState()), // Don't convert undefined to false
      shouldFetchArtTitle: shouldFetchArtTitleSelector(stateOrGetState()),
      isKidsMode: isKidsModeEnabledSelector(stateOrGetState()),
      videoResourceTag: ottMajorPlatformsVideoResourceTagSelector(stateOrGetState()),
    }
    : stateOrGetState;

  const { trackDurationTags, shouldTrackDuration, pagination } = options;

  // Build API parameters
  const qsData: LoadVideoContentByIdData = {
    app_id: 'tubitv',
    platform,
    content_id: contentId,
    device_id: stateValues.deviceId,
    include_channels: true,
  };

  if (stateValues.isKidsMode) qsData.is_kids_mode = stateValues.isKidsMode;
  if (stateValues.videoResourceTag) qsData.video_resource_tag = stateValues.videoResourceTag;

  // @todo-liam Refine this
  // Handle pagination (for series) - ignored by API for movies
  if (pagination) {
    const { season, page, size } = pagination;

    if (size === undefined) {
      // Load everything - no pagination (backward compatibility with full series loading)
    } else if (season === 'all') {
      // Load all seasons but with limited episodes per season
      qsData.pagination = {
        season: '1-20', // Use wide range to cover most series (API limitation workaround)
        page_in_season: page,
        page_size_in_season: size,
      };
    } else {
      // Load specific season(s) with pagination
      qsData.pagination = {
        season, // Specific season(s): 1, "1-2", "1-3", etc.
        page_in_season: page,
        page_size_in_season: size,
      };
    }
  }

  // Add video resource query parameters (async call with HEVC/4K params like Redux)
  const videoResourceParams = await getVideoResourceQueryParameters({
    enableHEVC: stateValues.enableHEVC,
    enable4K: stateValues.enable4K,
  });
  Object.assign(qsData, videoResourceParams);

  // Add image query parameters
  const imageQuery = getImageQueryFromParams({
    isMobile: stateValues.isMobile,
    ...(stateValues.shouldFetchArtTitle && { useArtTitle: stateValues.shouldFetchArtTitle }),
  });
  if (imageQuery) qsData.images = imageQuery;

  const clientConfig = {
    retryCount: 2,
    retryExcludedStatusCodes: [404],
    shouldTrackDuration: shouldTrackDuration ?? true,
    trackDurationTags,
  };

  try {
    const result = await makeLoadVideoContentById(dispatch, qsData, clientConfig);
    reportRequestTimings();

    // Apply formatVideoContentData first (for cue point processing, etc.)
    const formattedContent = formatVideoContentData(result);

    // Use centralized transformation with TTL inheritance for all content types
    const finalContent = transformContent(formattedContent);

    const episodes =
      Array.isArray(finalContent.seasons)
        ? finalContent.seasons.flatMap(
          season =>
            Array.isArray(season.episodes)
              ? season.episodes as unknown as Video[]
              : [],
        )
        : [];

    // Set the queryCache for each episode using InfiniteData shape, so `useContent(episodeId)`
    // (which uses useInfiniteQuery) receives the expected structure.
    episodes.forEach(episode => {
      const infiniteEpisodeData: InfiniteData<Video, unknown> = {
        pageParams: [undefined],
        pages: [episode],
      };
      // Match the query key used by the useContent hook
      queryClient.setQueryData(buildContentQueryKey(episode.id, { isKidsMode: stateValues.isKidsMode, videoResourceTag: stateValues.videoResourceTag }), infiniteEpisodeData);
    });

    // Add to byId - Note this is temporary as we migrate away from the global video store.
    // We will gradually refactor utils that depend on the global video store.
    dispatch(insertProcessedContents([finalContent, ...episodes]));

    return finalContent;
  } catch (error: any) {
    // Handle specific error types if needed
    if (error.httpCode === 404) {
      error.errType = errTypes.CONTENT_NOT_FOUND;
    } else if (!error.errType) {
      error.errType = errTypes.LOAD_CONTENT_FAIL;
    }
    throw error;
  }
};

/**
 * Merging function that combines multiple series pages into a unified series object
 * Each page contains a complete Video (series) object with different episodes loaded.
 * A simple movie is also a valid input.
 * // @todo-liam make sure the order is correct for recurring series
 */
export const mergeVideoQueryData = (infiniteData: InfiniteData<Video, unknown>): Video => {
  const pages = infiniteData.pages;

  if (pages.length === 0) {
    throw new Error('No pages available to merge');
  }

  if (pages.length === 1) {
    // Single page (movie or initial series load) - return as-is
    return pages[0];
  }

  // Multiple pages - merge series data intelligently
  const baseSeries = pages[0]; // Use first page as base structure
  const mergedSeasons = new Map<string, SeasonWithFullEpisodes | Season>();

  // Collect all seasons from all pages
  pages.forEach(page => {
    if (page.seasons) {
      page.seasons.forEach(season => {
        const seasonKey = season.number || 'unknown';

        if (mergedSeasons.has(seasonKey)) {
          // Merge episodes within the same season
          const existingSeason = mergedSeasons.get(seasonKey)!;
          const newEpisodes = season.episodes || [];
          const existingEpisodes = existingSeason.episodes || [];

          // Combine and dedupe episodes by ID
          const episodeMap = new Map();
          [...existingEpisodes, ...newEpisodes].forEach(episode => {
            episodeMap.set(episode.id, episode);
          });

          existingSeason.episodes = Array.from(episodeMap.values())
            .sort((a, b) => {
              // Sort by episode_number if available, otherwise preserve order
              const aNum = typeof a.episode_number === 'string' ? parseInt(a.episode_number, 10) : 0;
              const bNum = typeof b.episode_number === 'string' ? parseInt(b.episode_number, 10) : 0;
              return aNum - bNum;
            });
        } else {
          // New season - deep copy to avoid mutation
          mergedSeasons.set(seasonKey, {
            ...season,
            episodes: season.episodes ? [...season.episodes] : [],
          });
        }
      });
    }
  });

  // Create final merged series
  const mergedSeries: Video = {
    ...baseSeries,
    seasons: Array.from(mergedSeasons.values())
      .sort((a, b) => {
        const aNum = parseInt(a.number || '0', 10);
        const bNum = parseInt(b.number || '0', 10);
        return aNum - bNum;
      }),
  };

  return mergedSeries;
};

// Util function to extract merged video data from the queryClient
// From the id and state options, construct a query key for content and series, we do not know if the id is a series or video.
// Check the cache for both keys, return the merged data.
export const getCachedVideoData = ({ queryClient, contentId, state }: {queryClient: QueryClient, contentId: string, state: StoreState}) => {
  const isKidsMode = isKidsModeEnabledSelector(state);
  const videoResourceTag = ottMajorPlatformsVideoResourceTagSelector(state);

  const contentQueryKey = buildContentQueryKey(contentId, { videoResourceTag, isKidsMode });
  const seriesQueryKey = [...contentQueryKey, 'paginated'];

  const seriesPages = queryClient.getQueryData<InfiniteData<Video, unknown>>(seriesQueryKey);
  const contentPages = queryClient.getQueryData<InfiniteData<Video, unknown>>(contentQueryKey);

  const pages = seriesPages ?? contentPages;
  const content = pages ? mergeVideoQueryData(pages) : undefined;

  return content;
};

/**
 * If there is no ttl, we consider it expired.
 * Ttl should be attached to Video entities within `transformContent`
 */
export const isContentExpired = (data: Video | undefined) => {
  return !data?.ttl || data.ttl < Date.now();
};

/**
 * Transform SeriesEpisodesResponse to Season[] format
 * Uses the same logic as loadSeriesEpisodeMetadataSuccess
 */
function transformSeriesEpisodesResponse(response: SeriesEpisodesResponse): SeriesPaginationInfo {
  // Convert episodes_by_season to Season[] format
  const seasons = Object.entries(response.episodes_by_season).map(([number, episodesItems]) => {
    const episodes = episodesItems.map((episode): EpisodeInfo => {
      return { ...episode, id: `${episode.id}` }; // Convert id from number to string
    });

    // If recurring series, reverse episode order within season
    if (response.is_recurring) {
      episodes.reverse();
    }

    return {
      number,
      episodes,
    };
  });

  // If recurring series, reverse season order
  if (response.is_recurring) {
    seasons.reverse();
  }

  return { seasons, isRecurring: response.is_recurring };
}

export const buildSeriesPaginationInfoQueryKey = (seriesId: string) => {
  return ['seriesPaginationInfo', seriesId];
};

export const seriesPaginationInfoQueryFn = async (seriesId: string, dispatch: TubiThunkDispatch) => {
  const qsData = {
    platform,
    seriesId,
  };

  const response = await makeLoadSeriesEpisodesRequest(dispatch, qsData);

  // Handle nullish or empty responses
  if (!response) {
    return { seasons: [], isRecurring: false };
  }

  return transformSeriesEpisodesResponse(response);
};
