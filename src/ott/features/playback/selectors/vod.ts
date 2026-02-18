import type { Location } from 'history';
import { shallowEqual } from 'react-redux';
import type { Params } from 'react-router/lib/Router';
import { createSelector } from 'reselect';

import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import {
  FREEZED_EMPTY_ARRAY,
  FREEZED_EMPTY_OBJECT,
  RESUME_TIME_QUERY,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { useLocation, useParams } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { SKINS_AD_TAG } from 'common/features/skinsAd/constants';
import useAppSelector from 'common/hooks/useAppSelector';
import { containerSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { ottFireTVNewCategoryPageSelector } from 'common/selectors/experiments/ottFireTVNewCategoryPage';
import { vodPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { appVersionSelector } from 'common/selectors/fireUtils';
import { recommendationSelector } from 'common/selectors/search';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
import type { WebCaptionSettingsState } from 'common/types/captionSettings';
import type { AppVersion } from 'common/types/fire';
import type { StoreState } from 'common/types/storeState';
import type { AdBreaks, autoPlayContent, ThumbnailSprites, Video } from 'common/types/video';
import { BgPageType, getPageType } from 'common/utils/backgroundImages';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { findEpisodeIdx } from 'common/utils/episode';
import { getResumeInfo } from 'common/utils/getResumeInfo';

import { isComingSoonContent } from '../utils/isComingSoonContent';

interface ContentProps {
  title: string;
  seriesId?: string;
  seriesTitle?: string;
  seriesBackground?: string;
  activeSeasonIndex?: number;
  activeEpisodeIndex?: number;
}

export interface VideoPlaybackProps extends ContentProps {
  video: Video;
  previewUrl?: string;
  adBreaks: AdBreaks;
  captionSettings: StoreState['captionSettings'];
  defaultCaptions: WebCaptionSettingsState['defaultCaptions'];
  defaultAudioTracks: string;
  autoplayData: autoPlayContent;
  isLoggedIn: boolean;
  userId?: number | null;
  retryCount: number;
  resumePosition: number | undefined;
  resumeTargetId: string | null;
  thumbnailSprites: ThumbnailSprites;
  hybridAppVersion: Partial<AppVersion>
  performanceCollectorEnabled: boolean;
  page: VideoPlayerPageType;
  contentId: Video['id'];
  trailerId: string;
}

interface ContentPageParams {
  id: string;
}

interface TrailerPageParams {
  id: string;
  trailerId: string;
}

export interface RouterProps {
  params?: ContentPageParams | TrailerPageParams | Params;
  location: Location;
}

export interface ResumeProps {
  resumePosition?: number;
  targetId: string | null;
}

const videoSelector = createSelector(
  (state: StoreState) => state.video,
  (video) => video,
);
const activePreviewVideoIdSelector = createSelector(
  (state: StoreState) => state.ottUI?.containerGrid,
  (containerGrid) => containerGrid?.activePreviewVideoId,
);
const forceCurrentModeSelector = (state: StoreState, ownProps: RouterProps) => currentContentModeSelector(state, { pathname: ownProps.location.pathname });
const pathnameSelector = (_: StoreState, ownProps: RouterProps) => ownProps.location?.pathname;
const containerChildrenIdMapSelector = createSelector(
  (state: StoreState) => state,
  pathnameSelector,
  forceCurrentModeSelector,
  (state, pathname, forceCurrentMode) => {
    const { containerChildrenIdMap } = containerSelector(state, { forceCurrentMode, pathname });
    return containerChildrenIdMap;
  }
);
const activeContainerIdSelector = (state: StoreState) => state.ottUI?.debouncedGridUI.activeContainerId;
const gridIndexSelector = (state: StoreState) => state.ottUI?.debouncedGridUI.gridIndex;
const resumeTimeFromQuerySelector = (_: StoreState, ownProps: RouterProps) => {
  const { location } = ownProps;
  const { [RESUME_TIME_QUERY]: resumeTimeFromQuery } = location?.query || FREEZED_EMPTY_OBJECT as any;
  return resumeTimeFromQuery;
};
const historySelector = createSelector(
  (state: StoreState) => state.history,
  (history) => history,
);

export const contentSelector = createSelector(
  videoSelector,
  activePreviewVideoIdSelector,
  containerChildrenIdMapSelector,
  activeContainerIdSelector,
  gridIndexSelector,
  ottFireTVNewCategoryPageSelector,
  recommendationSelector,
  (store: StoreState) => store.search,
  (_: StoreState, ownProps: RouterProps) => ownProps,
  (video, activePreviewVideoId, containerChildrenIdMap, activeContainerId, gridIndex, ottFireTVNewCategoryPageEnabled, recommendations, search, ownProps) => {
    const { params, location } = ownProps;
    const { id: contentId } = params || { id: '' };
    const { byId } = video;
    let content = byId[contentId] || byId[`0${contentId}`];

    if (content) {
      return content;
    }

    const currentPage = getPageType(location?.pathname || '');
    const isNewContainerListPage = ottFireTVNewCategoryPageEnabled && currentPage === BgPageType.CONTAINER_LIST;
    const isOldContainerListPage = !ottFireTVNewCategoryPageEnabled && currentPage === BgPageType.CONTAINER_LIST;

    if (![BgPageType.HOME, BgPageType.MY_STUFF, BgPageType.DETAILS, BgPageType.CONTAINER_DETAILS, BgPageType.CONTAINER_LIST].includes(currentPage) || isOldContainerListPage) {
      if (BgPageType.SEARCH === currentPage && search.activeIdx !== null && search.activeSection === 1) {
        const { activeIdx, hash, key } = search;
        const trimmedKey = (key || '').trim();
        const searchResult = hash[trimmedKey] || [];
        const contentIds = key ? searchResult : recommendations;
        const contentId = contentIds[activeIdx];
        const content = byId[contentId];
        return content || FREEZED_EMPTY_OBJECT;
      }
      return content || FREEZED_EMPTY_OBJECT;
    }

    if (__WEBPLATFORM__) {
      return content || FREEZED_EMPTY_OBJECT;
    }

    if ([BgPageType.CONTAINER_DETAILS].includes(currentPage) || isNewContainerListPage) {
      const { byId } = video;
      if (activePreviewVideoId) {
        content = byId[activePreviewVideoId];
      }
      return content || FREEZED_EMPTY_OBJECT;
    }

    // Reset content to currently selected home container item if on Home and Details page for preview
    const activeContainerChildren = containerChildrenIdMap[activeContainerId];
    if (activeContainerChildren) {
      const activeContainerChildrenIndex = activeContainerChildren[gridIndex];
      if (activeContainerChildrenIndex) {
        const { byId } = video;
        content = byId[activeContainerChildrenIndex];
      }
    }

    return content || FREEZED_EMPTY_OBJECT;
  });

export const previewSelector = createSelector(
  contentSelector,
  (content) => content.video_preview_url,
);

export const thumbnailSpritesSelector = createSelector(
  (state: StoreState) => state.video.thumbnailSpritesById,
  (_state: StoreState, contentId: string) => contentId,
  (thumbnailSpritesById, contentId) => thumbnailSpritesById[contentId] || FREEZED_EMPTY_OBJECT,
);

const videoExtrasSelector = createSelector(
  (_state: StoreState, ownProps: RouterProps) => ownProps.params?.id ?? '',
  (state: StoreState) => state.video.adBreaksById,
  (state: StoreState) => state.video.autoPlayContentsById,
  (state: StoreState) => state.video.thumbnailSpritesById,
  (contentId, adBreaksById, autoPlayContentsById, thumbnailSpritesById) => ({
    adBreaks: maybeOverrideCuePoints(adBreaksById[contentId]) || FREEZED_EMPTY_ARRAY,
    autoplayData: autoPlayContentsById[contentId] || FREEZED_EMPTY_OBJECT,
    thumbnailSprites: thumbnailSpritesById[contentId] || FREEZED_EMPTY_OBJECT,
  })
);

export const isComingSoonSelector = createSelector(
  contentSelector,
  (content) => isComingSoonContent(content.availability_starts),
);

export const isSkinsAdContentSelector = createSelector(
  contentSelector,
  (content) => content.tags?.includes(SKINS_AD_TAG),
);

export const isEarlyAccessSelector = createSelector(
  contentSelector,
  isLoggedInSelector,
  (content, isLoggedIn) => {
    return !isLoggedIn && content.needs_login && content.login_reason === 'EARLY_ACCESS';
  },
);

const authSelector = createSelector(
  (state: StoreState) => state.auth,
  (auth) => {
    const isLoggedIn = !!auth.user;
    return {
      isLoggedIn,
      userId: isLoggedIn ? auth.user?.userId : null,
    };
  },
);

const metadataSelector = createSelector(
  contentSelector,
  videoSelector,
  (content, video) => {
    const { byId } = video;
    const { title } = content;
    const seriesId = content.series_id || (content.type === SERIES_CONTENT_TYPE ? content.id : undefined);
    const selection: ContentProps = { title, seriesId };
    if (seriesId) {
      // If part of series, $title is an episode title and get $seriesTitle.
      const series = byId[`0${seriesId}`] || FREEZED_EMPTY_OBJECT;
      selection.seriesTitle = series.title;
      selection.seriesBackground = (series.backgrounds || [])[0];

      const {
        season: latestSeasonIndex,
        episode: latestEpisodeIndex,
      } = findEpisodeIdx(content.id, series.seasons) || {};

      selection.activeSeasonIndex = latestSeasonIndex || 0;
      selection.activeEpisodeIndex = latestEpisodeIndex || 0;
    }
    return selection;
  },
);

export const resumePositionAndTargetIDSelector = createSelector(
  (state: StoreState, ownProps: RouterProps, contentOverride?: Video) => contentOverride || contentSelector(state, ownProps),
  videoSelector,
  historySelector,
  resumeTimeFromQuerySelector,
  (content, video, history, resumeTimeFromQuery) => {
    const { resumePositionById, byId } = video;
    const { series_id: seriesId, type, id: contentId } = content;
    const resumeTime = parseInt(resumeTimeFromQuery as string, 10);

    let resumePosition: number | undefined = !isNaN(resumeTime) ? resumeTime : resumePositionById[contentId];
    let targetId = isNaN(resumeTime) && resumePositionById[contentId] ? contentId : null;
    if (typeof resumePosition === 'undefined') {
      const isSeriesContent = type === SERIES_CONTENT_TYPE;
      const parentId = seriesId
        ? convertSeriesIdToContentId(seriesId)
        : contentId;
      const resumeInfo = isSeriesContent
        ? getResumeInfo({
          history: history.contentIdMap[convertSeriesIdToContentId(contentId)],
          byId,
          contentId,
          isSeries: isSeriesContent,
        })
        : getResumeInfo({ byId, contentId, history: history.contentIdMap[parentId] });
      resumePosition = resumeInfo.position === -1 ? undefined : resumeInfo.position;
      targetId = resumeInfo.contentId;
    }
    return { targetId, resumePosition };
  },
);

export const videoPlayerPageSelector = createSelector(
  metadataSelector,
  pathnameSelector,
  (metadata, pathname) => {
    const { seriesId } = metadata;

    const currentPage = getPageType(pathname || '');
    let page = VideoPlayerPageType.HOME_PAGE;
    if (currentPage === BgPageType.DETAILS) {
      page = seriesId ? VideoPlayerPageType.SERIES_DETAIL_PAGE : VideoPlayerPageType.VIDEO_PAGE;
    } else if (currentPage === BgPageType.CONTAINER_DETAILS) {
      page = VideoPlayerPageType.CATEGORY_PAGE;
    } else if (currentPage === BgPageType.CONTAINER_LIST) {
      page = VideoPlayerPageType.CATEGORY_LIST_PAGE;
    } else if (currentPage === BgPageType.MY_STUFF) {
      page = VideoPlayerPageType.MY_STUFF_PAGE;
    }
    return page;
  },
);

function isTrailerRouterParams(params: RouterProps['params']): params is TrailerPageParams {
  return typeof (params as TrailerPageParams)?.trailerId === 'string';
}

export const videoPlaybackPropSelector = createSelector(
  contentSelector,
  previewSelector,
  videoExtrasSelector,
  ({ captionSettings }: StoreState) => captionSettings,
  authSelector,
  metadataSelector,
  resumePositionAndTargetIDSelector,
  appVersionSelector,
  vodPerformanceMetricEnabledSelector,
  videoPlayerPageSelector,
  (_state: StoreState, ownProps: RouterProps) => ownProps,
  (
    video,
    previewUrl,
    videoExtras,
    captionSettings,
    auth,
    contentProps,
    resumeInfo,
    hybridAppVersion,
    performanceCollectorEnabled,
    page,
    props
  ): VideoPlaybackProps => {
    const contentId = props.params?.id ?? '';
    const trailerId = isTrailerRouterParams(props.params) ? props.params.trailerId : '';

    const { retry_count: retryCount } = props.location?.query || FREEZED_EMPTY_OBJECT as any;
    let retry = 0;
    if (typeof retryCount === 'number' && !isNaN(retryCount as number)) {
      retry = retryCount;
    } else if (typeof retryCount === 'string') {
      retry = parseInt(retryCount, 10);
    }

    return {
      video,
      previewUrl,
      captionSettings,
      defaultCaptions: captionSettings.defaultCaptions,
      defaultAudioTracks: captionSettings.defaultAudioTracks,
      retryCount: retry,
      resumePosition: resumeInfo.resumePosition,
      resumeTargetId: resumeInfo.targetId,
      hybridAppVersion,
      performanceCollectorEnabled,
      page,
      contentId,
      trailerId,
      ...auth,
      ...contentProps,
      ...videoExtras,
    };
  }
);

export function useVideoPlaybackProps<P = Record<string, unknown>>(props?: P) {
  const location = useLocation();
  const params = useParams();
  return useAppSelector(
    (state) => videoPlaybackPropSelector(state, { location, params, ...(props || {}) }),
    shallowEqual
  );
}
