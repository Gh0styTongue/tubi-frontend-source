import type { Location } from 'history';
import { shallowEqual } from 'react-redux';
import type { Params } from 'react-router/lib/Router';
import { createSelector } from 'reselect';

import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import {
  FREEZED_EMPTY_ARRAY,
  FREEZED_EMPTY_OBJECT,
  PURPLE_CARPET_CONTAINER_ID,
  RESUME_TIME_QUERY,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { useLocation, useParams } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import { isPurpleCarpetContent } from 'common/features/purpleCarpet/util';
import { SKINS_AD_TAG } from 'common/features/skinsAd/constants';
import useAppSelector from 'common/hooks/useAppSelector';
import { containerSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { vodPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { isDRMSupportedVersionOnSamsung, isNativeDRMAvailableSelector } from 'common/selectors/fire';
import { appVersionSelector } from 'common/selectors/fireUtils';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
import type { WebCaptionSettingsState } from 'common/types/captionSettings';
import type { AppVersion } from 'common/types/fire';
import type { StoreState } from 'common/types/storeState';
import type { AdBreaks, autoPlayContent, ThumbnailSprites, Video } from 'common/types/video';
import { BgPageType, getPageType } from 'common/utils/backgroundImages';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { findEpisodeIdx } from 'common/utils/episode';
import { getResumeInfo } from 'common/utils/getResumeInfo';

import { DRM_NOT_SUPPORT_REASON } from '../constants/drm';
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
  isFromAutoplay: boolean;
  isFromVideoPreview: boolean;
  isFromBrowseWhileWatching: boolean;
  autoplayData: autoPlayContent;
  isLoggedIn: boolean;
  userId?: number | null;
  isDRMSupported: boolean;
  isDRMSource: boolean;
  drmNotSupportReason: string;
  videoResourceManager?: VideoResourceManager;
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

export const contentSelector = (state: StoreState, ownProps: RouterProps) => {
  const { params, location } = ownProps;
  const { id: contentId } = params || { id: '' };
  const { byId } = state.video;
  let content = byId[contentId] || byId[`0${contentId}`];

  if (content) {
    return content;
  }

  const currentPage = getPageType(location?.pathname || '');
  if (![BgPageType.HOME, BgPageType.MY_STUFF, BgPageType.DETAILS, BgPageType.CONTAINER_DETAILS].includes(currentPage)) {
    return content || FREEZED_EMPTY_OBJECT;
  }

  if (__WEBPLATFORM__) {
    return content || FREEZED_EMPTY_OBJECT;
  }

  if (currentPage === BgPageType.CONTAINER_DETAILS) {
    const { activePreviewVideoId } = state.ottUI.containerGrid;
    const { byId } = state.video;
    if (activePreviewVideoId) {
      content = byId[activePreviewVideoId];
    }
    return content || FREEZED_EMPTY_OBJECT;
  }

  // Reset content to currently selected home container item if on Home and Details page for preview
  const forceCurrentMode = currentContentModeSelector(state, { pathname: location.pathname });
  const { containerChildrenIdMap } = containerSelector(state, { forceCurrentMode, pathname: location.pathname });
  const { debouncedGridUI: { activeContainerId, gridIndex } } = state.ottUI;
  const activeContainerChildren = containerChildrenIdMap[activeContainerId];
  if (activeContainerChildren) {
    let activeContainerChildrenIndex = activeContainerChildren[gridIndex];
    // For purple carpet content, we should always use the first content in the container
    if (activeContainerId === PURPLE_CARPET_CONTAINER_ID) {
      activeContainerChildrenIndex = activeContainerChildren[0];
    }
    if (activeContainerChildrenIndex) {
      const { byId } = state.video;
      content = byId[activeContainerChildrenIndex];
    }
  }

  return content || FREEZED_EMPTY_OBJECT;
};

export const previewSelector = (state: StoreState, ownProps: RouterProps) => {
  const content = contentSelector(state, ownProps);
  return content.video_preview_url;
};

export const isComingSoonSelector = (state: StoreState, ownProps: RouterProps) => {
  const content = contentSelector(state, ownProps);
  return isComingSoonContent(content.availability_starts);
};

export const isSkinsAdContentSelector = (state: StoreState, ownProps: RouterProps) => {
  const content = contentSelector(state, ownProps);
  return content.tags?.includes(SKINS_AD_TAG);
};

export const isEarlyAccessSelector = createSelector(
  contentSelector,
  isLoggedInSelector,
  (content, isLoggedIn) => {
    return !isLoggedIn && content.needs_login && content.login_reason === 'EARLY_ACCESS';
  },
);

const authSelector = ({ auth }: StoreState) => {
  const isLoggedIn = !!(auth && auth.user);
  return {
    isLoggedIn,
    userId: isLoggedIn ? auth.user?.userId : null,
  };
};

const metadataSelector = (state: StoreState, ownProps: RouterProps) => {
  const content = contentSelector(state, ownProps);
  const { video: { byId } } = state;
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
};

export const drmSelector = (state: StoreState) => {
  let isDRMSupported = __IS_HYB_APP__ ? isNativeDRMAvailableSelector(state) : true;
  let drmNotSupportReason = isDRMSupported ? '' : DRM_NOT_SUPPORT_REASON.app;
  if (__OTTPLATFORM__ === 'TIZEN') {
    isDRMSupported = !!isDRMSupportedVersionOnSamsung(state);
    drmNotSupportReason = isDRMSupported ? '' : DRM_NOT_SUPPORT_REASON.device;
  }

  if (!FeatureSwitchManager.isDefault(['DRM', 'NativeCompatibility'])) {
    isDRMSupported = FeatureSwitchManager.isEnabled(['DRM', 'NativeCompatibility']);
  }
  return { isDRMSupported, drmNotSupportReason };
};

export const resumePositionAndTargetIDSelector = (state: StoreState, ownProps: RouterProps, contentOverride?: Video) => {
  const { location } = ownProps;
  const content = contentOverride || contentSelector(state, ownProps);
  const { [RESUME_TIME_QUERY]: resumeTimeFromQuery } = location?.query || FREEZED_EMPTY_OBJECT as any;
  const { video: { resumePositionById, byId }, history } = state;
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
  return {
    targetId,
    resumePosition,
  };
};

export const purpleCarpetContentSelector = (state: StoreState, ownProps: RouterProps) => {
  const content = contentSelector(state, ownProps);
  return isPurpleCarpetContent(content);
};

export const videoPlayerPageSelector = (state: StoreState, ownProps: RouterProps) => {
  const { seriesId } = metadataSelector(state, ownProps);
  const isPurpleCarpetContent = purpleCarpetContentSelector(state, ownProps);
  const { location } = ownProps;

  const currentPage = getPageType(location?.pathname || '');
  let page = VideoPlayerPageType.HOME_PAGE;
  if (currentPage === BgPageType.DETAILS) {
    if (isPurpleCarpetContent) {
      page = VideoPlayerPageType.LINEAR_DETAILS_PAGE;
    } else {
      page = seriesId ? VideoPlayerPageType.SERIES_DETAIL_PAGE : VideoPlayerPageType.VIDEO_PAGE;
    }
  } else if (currentPage === BgPageType.CONTAINER_DETAILS) {
    page = VideoPlayerPageType.CATEGORY_PAGE;
  } else if (currentPage === BgPageType.MY_STUFF) {
    page = VideoPlayerPageType.MY_STUFF_PAGE;
  }
  return page;
};

function isTrailerRouterParams(params: RouterProps['params']): params is TrailerPageParams {
  return typeof (params as TrailerPageParams)?.trailerId === 'string';
}

export const videoPlaybackPropSelector = createSelector(
  (state: StoreState, ownProps: RouterProps) => contentSelector(state, ownProps),
  (state: StoreState, ownProps: RouterProps) => previewSelector(state, ownProps),
  (
    {
      video: {
        adBreaksById, autoPlayContentsById, thumbnailSpritesById,
      },
    }: StoreState,
    props: RouterProps
  ) => {
    const contentId = props.params?.id ?? '';
    return ({
      adBreaks: maybeOverrideCuePoints(adBreaksById[contentId]) || FREEZED_EMPTY_ARRAY,
      autoplayData: autoPlayContentsById[contentId] || FREEZED_EMPTY_OBJECT,
      thumbnailSprites: thumbnailSpritesById[contentId] || FREEZED_EMPTY_OBJECT,
    });
  },
  ({ captionSettings }: StoreState) => captionSettings,
  authSelector,
  (state: StoreState, ownProps: RouterProps) =>
    metadataSelector(state, ownProps),
  drmSelector,
  (state: StoreState, ownProps: RouterProps) =>
    resumePositionAndTargetIDSelector(state, ownProps),
  (state: StoreState) => appVersionSelector(state),
  (state: StoreState) => vodPerformanceMetricEnabledSelector(state),
  (state: StoreState, ownProps: RouterProps) =>
    videoPlayerPageSelector(state, ownProps),
  (_state: StoreState, ownProps: RouterProps) => ownProps,
  (
    content,
    previewUrl,
    byContentId,
    captionSettings,
    auth,
    contentProps,
    drm,
    resumePositionAndTargetID,
    hybridAppVersion,
    performanceCollectorEnabled,
    page,
    props
  ): VideoPlaybackProps => {
    const contentId = props.params?.id ?? '';
    const trailerId = isTrailerRouterParams(props.params)
      ? props.params.trailerId
      : '';
    const {
      retry_count: retryCount,
      autoplay,
      video_preview: videoPreview,
      bww,
    } = props.location?.query || FREEZED_EMPTY_OBJECT as any;
    const { isLoggedIn, userId } = auth;
    const {
      title,
      seriesId,
      seriesTitle,
      seriesBackground,
      activeSeasonIndex,
      activeEpisodeIndex,
    } = contentProps;
    const { isDRMSupported, drmNotSupportReason } = drm;
    const { defaultCaptions, defaultAudioTracks } = captionSettings;
    const { adBreaks, autoplayData, thumbnailSprites } = byContentId;

    let retry = 0;
    if (typeof retryCount === 'number' && !isNaN(retryCount as number)) {
      retry = retryCount;
    } else if (typeof retryCount === 'string') {
      retry = parseInt(retryCount, 10);
    }

    const videoResourceManager = getCachedVideoResourceManager({
      videoResources: content.video_resources || [],
      isDRMSupported,
      rememberFallback: true,
    });

    const isDRMSource = !!(content.video_resources || [])
      .find(video_resource => video_resource.license_server);

    return {
      video: content,
      previewUrl,
      adBreaks,
      captionSettings,
      defaultCaptions,
      defaultAudioTracks,
      isFromAutoplay: !!autoplay,
      isFromVideoPreview: !!videoPreview,
      isFromBrowseWhileWatching: !!bww,
      autoplayData,
      isLoggedIn,
      userId,
      title,
      seriesId,
      seriesTitle,
      seriesBackground,
      activeSeasonIndex,
      activeEpisodeIndex,
      isDRMSupported,
      isDRMSource,
      drmNotSupportReason,
      videoResourceManager,
      retryCount: retry,
      resumePosition: resumePositionAndTargetID.resumePosition,
      resumeTargetId: resumePositionAndTargetID.targetId,
      thumbnailSprites,
      hybridAppVersion,
      performanceCollectorEnabled,
      page,
      contentId,
      trailerId,
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
