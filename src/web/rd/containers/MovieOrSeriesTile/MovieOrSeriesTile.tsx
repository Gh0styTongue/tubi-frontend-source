import { durationToHourAndMinute } from '@adrise/utils/lib/time';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { FetchPriority, PreviewAnchor, TileOrientation } from '@tubitv/web-ui';
import { ContentTile } from '@tubitv/web-ui';
import debounce from 'lodash/debounce';
import React, { memo, useMemo, useCallback, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { createSelector } from 'reselect';

import { remove as removeFromHistory } from 'common/actions/history';
import { loadVideoById } from 'common/actions/video';
import TileBadge from 'common/components/TileBadge/TileBadge';
import * as actions from 'common/constants/action-types';
import {
  AUTO_START_CONTENT,
  SHOULD_FETCH_DATA_ON_SERVER,
  LINEAR_CONTENT_TYPE,
  PERSONAL_COMING_SOON_CONTAINER_ID,
  VIDEO_CONTENT_TYPE,
  SERIES_CONTENT_TYPE,
  CONTENT_DETAILS_MODAL_ID,
} from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { TUPIAN_SRCSET_MEDIA_QUERY, TUPIAN_POSTERART_PREFIX } from 'common/constants/style-constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebDetailsPageRedesign from 'common/experiments/config/webDetailsPageRedesign';
import WebLandscape from 'common/experiments/config/webLandscape';
import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import { doesVideoSupport4K } from 'common/features/playback/utils/doesVideoSupport4K';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isTilePreviewEnabledSelector } from 'common/selectors/experiments/webVideoPreview';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { isAdultsModeSelector, isDesktopHomeGridPages, isMobileDeviceSelector } from 'common/selectors/ui';
import { ImpressionTile } from 'common/services/ImpressionsManager';
import trackingManager from 'common/services/TrackingManager';
import type { History as HistoryType } from 'common/types/history';
import type StoreState from 'common/types/storeState';
import type { Video, VideoType } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { buildDialogEvent } from 'common/utils/analytics';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { parseContentImages, formatSrcSet } from 'common/utils/imageResolution';
import { generateRatingDescriptorString } from 'common/utils/ratings';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import { trackEvent } from 'common/utils/track';
import { getUrl } from 'common/utils/urlConstruction';
import { addLocalePrefix } from 'common/utils/urlManipulation';
import { isWebDetailsPageUrl, isWebHomeRelatedPages } from 'common/utils/urlPredicates';
import type { LocaleOptionType } from 'i18n/constants';
import AddToQueueProvider from 'web/components/AddToQueue/AddToQueueProvider/AddToQueueProvider';
import { formatComingSoonString } from 'web/components/ContentDetail/ComingSoonLabel';
import LazyItem from 'web/components/LazyItem/LazyItem';
import { getPoster } from 'web/features/playback/utils/getPoster';
import useReminder from 'web/rd/components/ContentDetail/RemindButton/useReminder';
import TilePreviewPlayer from 'web/rd/components/TilePreviewPlayer/TilePreviewPlayer';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

export interface NavigationParams {
  index: number;
  contentId: string;
}

export interface MovieOrSeriesTileProps {
  containerId?: string;
  fetchPriority?: FetchPriority;
  id: string; // id with "0" prefix for series
  indexInContainer: number;
  lazyLoad?: boolean;
  disableLazyRender?: boolean;
  onNavigation?: (params: NavigationParams) => void;
  preload?: boolean;
  previewAnchor?: PreviewAnchor;
  showProgress: boolean;
  tileOrientation: TileOrientation;
  isMyStuffPage?: boolean;
  isLikedSelectableTile?: boolean;
  hideMetadata?: boolean;
  handleLikeClick?: (contentId: string | undefined, liked: boolean) => void;
  personalizationId?: string;
  containerPosition?: number;
  colInContainer?: number;
  rowIndexOffset?: number;
  previewDisabled?: boolean;
}

const makeHistorySelector = () =>
  createSelector(
    (state: StoreState) => state.history.contentIdMap,
    (_state: StoreState, contentId: string) => contentId,
    (contentIdMap, contentId) => contentIdMap[contentId] as HistoryType | undefined
  );

const makeContentSelector = () =>
  createSelector(
    (state: StoreState) => state.video.byId,
    (_state: StoreState, contentId: string) => contentId,
    (byId, contentId) => byId[contentId] as Video | undefined
  );

export const messages = defineMessages({
  addToMyList: {
    description: 'Add to My List button label',
    defaultMessage: 'Add to My List',
  },
  removeFromMyList: {
    description: 'Remove from My List button label',
    defaultMessage: 'Remove from My List',
  },
  removeFromHistory: {
    description: 'Delete from Continue Watching button label',
    defaultMessage: 'Delete from Continue Watching',
  },
  remindMe: {
    description: 'text for remind label',
    defaultMessage: 'Remind Me',
  },
  reminderSet: {
    description: 'text for reminded status',
    defaultMessage: 'Remove Reminder',
  },
  play: {
    description: 'Play button label',
    defaultMessage: 'Play',
  },
  movieTileLinkTitle: {
    description: 'Link title for the SEO purpose',
    defaultMessage: 'Watch {title} Movie',
  },
  seriesTileLinkTitle: {
    description: 'Link title for the SEO purpose',
    defaultMessage: 'Watch {title} Show',
  },
  seasons: {
    description: 'seasons label text',
    defaultMessage: '{seasonNumber} Seasons',
  },
  season: {
    description: 'season label text',
    defaultMessage: '{seasonNumber} Season',
  },
});

interface GetLinkUrlOptions {
  showProgress?: boolean;
  preferredLocale?: LocaleOptionType;
}

const getLinkUrl = (content: Video, contentHistory: HistoryType | undefined, { showProgress, preferredLocale }: GetLinkUrlOptions) => {
  let url: string = '';
  const { id, title, type } = content;
  if (showProgress && contentHistory && contentHistory.contentType === 'series') {
    // Episode may not be in byId, so we use id from history store and omit title
    const { contentId } = contentHistory.episodes[contentHistory.position];
    url = getUrl({
      id: String(contentId),
      seriesId: String(contentHistory.contentId),
      type: VIDEO_CONTENT_TYPE,
    });
  } else {
    url = getUrl({ id, title, type });
  }
  return addLocalePrefix(preferredLocale, url);
};

// Debounce tracking preview dialog event in case too many events when mouse moving on the row
const debouncedTrackPreviewDialogEvent = debounce((id: string, videoType?: VideoType) => {
  const contentId = parseInt(id, 10);
  const extraCtx = videoType === SERIES_CONTENT_TYPE ? { series_id: contentId } : { video_id: contentId };
  trackEvent(
    eventTypes.DIALOG,
    buildDialogEvent(getCurrentPathname(), DialogType.EXTENDED_CONTENT_TILE, '', DialogAction.SHOW, extraCtx)
  );
}, 500);

function MovieOrSeriesTile({
  containerId,
  fetchPriority,
  id,
  indexInContainer,
  lazyLoad,
  disableLazyRender,
  onNavigation,
  preload,
  previewAnchor,
  showProgress,
  tileOrientation,
  isMyStuffPage,
  isLikedSelectableTile,
  hideMetadata,
  handleLikeClick,
  personalizationId,
  containerPosition,
  colInContainer,
  rowIndexOffset = 0,
  previewDisabled = false,
}: MovieOrSeriesTileProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const historySelector = useMemo(makeHistorySelector, []);
  const contentSelector = useMemo(makeContentSelector, []);
  const history = useAppSelector((state) => historySelector(state, id));
  const content = useAppSelector((state) => contentSelector(state, id));
  const resumeEpisodeHistory = history?.contentType === 'series' ? history.episodes[history.position] : undefined;
  const resumeEpisodeId = resumeEpisodeHistory ? resumeEpisodeHistory.contentId.toString() : '';
  const resumeEpisode = useAppSelector((state) => contentSelector(state, resumeEpisodeId));
  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const preferredLocale = useAppSelector((state) => state.ui.preferredLocale);
  const isAdultMode = useAppSelector(isAdultsModeSelector);
  const intl = useIntl();
  const contentId = content?.id;
  const isMobileDevice = useAppSelector(isMobileDeviceSelector);
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);
  const majorEventFailsafeMessages = useAppSelector(majorEventFailsafeMessageSelector);
  const pathname = useLocation().pathname;
  const webLandscape = useExperiment(WebLandscape);
  const isWebLandscapeExperimentEnabled = useAppSelector(state => isDesktopHomeGridPages(state, pathname));
  const isInLandscapeExperimentVariant = isWebLandscapeExperimentEnabled && webLandscape.getValue() !== 'none';
  const webDetailsPageRedesign = useExperiment(WebDetailsPageRedesign);
  const isNewDesign = webDetailsPageRedesign.getValue();

  const url = content && getLinkUrl(content, history, { showProgress, preferredLocale });

  const createNavigateToPageComponent = useCallback(() => {
    if (isMyStuffPage) {
      trackingManager.createNavigateToPageComponent({
        startX: indexInContainer,
        contentId,
        containerSlug: containerId,
        componentType: ANALYTICS_COMPONENTS.myStuffComponent,
      });
    }
  }, [containerId, contentId, indexInContainer, isMyStuffPage]);

  const onLikeClick = useCallback(
    (liked: boolean) => {
      const isSeries = content?.type === SERIES_CONTENT_TYPE;
      handleLikeClick?.(isSeries && contentId ? convertSeriesIdToContentId(contentId) : contentId, liked);
    },
    [content?.type, contentId, handleLikeClick]
  );

  const handleTileClick = useCallback(() => {
    const isFullDetailsPage = isWebDetailsPageUrl(location.pathname);

    // If the page is a full details page, we don’t want to show the details modal, but redirect to the new full details page
    if (id && !isFullDetailsPage) {
      webDetailsPageRedesign.logExposure();
      if (isNewDesign) {
        onNavigation?.({ index: indexInContainer, contentId: id });
        createNavigateToPageComponent();
        tubiHistory.push({
          ...location,
          query: {
            ...location.query,
            [CONTENT_DETAILS_MODAL_ID]: id,
          },
        });
        return;
      }
    }
    if (url) {
      if (contentId) {
        onNavigation?.({ index: indexInContainer, contentId });
      }
      const isComingSoonContainer = containerId === PERSONAL_COMING_SOON_CONTAINER_ID;
      createNavigateToPageComponent();
      tubiHistory.push({
        pathname: url,
        state: {
          ...(isComingSoonContainer && { from: PERSONAL_COMING_SOON_CONTAINER_ID }),
          [AUTO_START_CONTENT]: true,
        },
      });
    }
  }, [id, url, webDetailsPageRedesign, isNewDesign, contentId, containerId, createNavigateToPageComponent, onNavigation, indexInContainer, location]);
  const handleRemoveFromHistoryClick = useCallback(() => {
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'continueWatching',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }
    dispatch(removeFromHistory(location, id)); // History uses id with "0" prefix
  }, [currentDate, dispatch, id, intl, isMajorEventFailsafe, location, majorEventFailsafeMessages]);

  const label = useMemo(() => {
    if (content) {
      const isLinear = content.type === LINEAR_CONTENT_TYPE;
      if (isLinear) {
        return <TileBadge type="live" />;
      }
    }
  }, [content]);

  const {
    title,
    tags,
    ratings,
    posterarts,
    duration,
    year,
    availability_starts: availabilityStarts,
    images,
    video_renditions,
    num_seasons: seasonNumber,
  } = content ?? {};
  const readableDuration = duration && Number.isFinite(duration) ? durationToHourAndMinute(duration) : undefined;
  const posters = parseContentImages(images as Record<string, string[]>, TUPIAN_POSTERART_PREFIX);
  const posterSrcSet = formatSrcSet(posters);
  const artTitle = images?.title_art?.[0];
  let progress: number | undefined;
  let timeLeft: string = '';
  let subTitle: string | undefined;
  const hasHistory = !!history;
  const shouldShowHistoryForSeries = isInLandscapeExperimentVariant && showProgress && resumeEpisodeHistory;
  if (hasHistory && history.contentType === 'movie' && showProgress) {
    progress = history.position / history.contentLength;
    timeLeft = secondsToHoursAndMinutes(history.contentLength - history.position, { formatMessage: intl.formatMessage, remaining: true });
  } else if (shouldShowHistoryForSeries) {
    progress = resumeEpisodeHistory.position / resumeEpisodeHistory.contentLength;
    timeLeft = secondsToHoursAndMinutes(resumeEpisodeHistory.contentLength - resumeEpisodeHistory.position, { formatMessage: intl.formatMessage, remaining: true });
    subTitle = resumeEpisode?.title;
  }
  useEffect(() => {
    if (resumeEpisodeId && shouldShowHistoryForSeries) {
      dispatch(loadVideoById(resumeEpisodeId));
    }
  }, [dispatch, resumeEpisodeId, shouldShowHistoryForSeries]);

  const is4K = doesVideoSupport4K(video_renditions);

  const isComingSoonContainer = containerId === PERSONAL_COMING_SOON_CONTAINER_ID;
  const comingSoonLabel =
    isComingSoonContainer && availabilityStarts ? formatComingSoonString(availabilityStarts, intl) : '';
  const addToMyListLabel = intl.formatMessage(isComingSoonContainer ? messages.remindMe : messages.addToMyList);
  const removeFromMyListLabel = intl.formatMessage(
    isComingSoonContainer ? messages.reminderSet : messages.removeFromMyList
  );
  const videoRating = ratings?.[0];

  const season = seasonNumber ? intl.formatMessage(
    seasonNumber > 1 ? messages.seasons : messages.season,
    { seasonNumber }
  ) : undefined;
  const { dispatchReminderAction, hasReminderSet } = useReminder({
    contentId,
    contentTitle: content?.title,
    contentType: content?.type,
  });

  const isWebVideoPreviewEnabled = useAppSelector(isTilePreviewEnabledSelector);
  const hasVideoPreviewUrl = !!content?.video_preview_url;
  const isOnHomeRelatedPage = isWebHomeRelatedPages(pathname);
  const isVideoPreviewEnabled = !previewDisabled && ((isWebVideoPreviewEnabled && hasVideoPreviewUrl && isOnHomeRelatedPage) || isInLandscapeExperimentVariant);

  const renderPreviewPlayer = useCallback(() => {
    return !(__SERVER__ && SHOULD_FETCH_DATA_ON_SERVER) && !!content?.video_preview_url && !isInLandscapeExperimentVariant ? (
      <TilePreviewPlayer video={content} />
    ) : null;
  }, [content, isInLandscapeExperimentVariant]);
  const onPreviewEnter = useCallback(() => {
    dispatch(actionWrapper(actions.ADD_ACTIVE_TILE_PREVIEW));
    debouncedTrackPreviewDialogEvent(id, content?.type);
  }, [content?.type, dispatch, id]);
  const onPreviewExit = useCallback(() => {
    dispatch(actionWrapper(actions.REMOVE_ACTIVE_TILE_PREVIEW));
  }, [dispatch]);

  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, id));
  const isSeries = content?.type === SERIES_CONTENT_TYPE;

  return (
    <AddToQueueProvider id={id}>
      {({ dispatchQueueAction, isInQueue }) => (
        <LazyItem lazy={!disableLazyRender}>
          {({ active, ref }) => {
            const myListStatus = (isComingSoonContainer ? hasReminderSet : isInQueue) ? 'inList' : 'notInList';
            const linkTitle = intl.formatMessage(
              isSeries ? messages.seriesTileLinkTitle : messages.movieTileLinkTitle,
              {
                title,
              }
            );

            const tile = (
              <ContentTile
                lazyActive={active}
                ref={ref}
                isComingSoon={isComingSoonContainer}
                myListStatus={myListStatus}
                onMyListUpdate={isComingSoonContainer ? dispatchReminderAction : dispatchQueueAction}
                tileOrientation={tileOrientation}
                canRemoveFromHistory={hasHistory}
                title={title}
                artTitle={artTitle}
                linkTitle={linkTitle}
                tags={tags}
                label={label}
                posterSrc={posters[0]?.[1] || posterarts?.[0]}
                posterSrcSet={posterSrcSet}
                posterSizes={TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_POSTERART_PREFIX]}
                thumbnailSrc={content && getPoster(content, tileOrientation)}
                progress={progress}
                timeLeft={timeLeft}
                onClick={handleTileClick}
                onPlayClick={handleTileClick}
                onRemoveFromHistoryClick={handleRemoveFromHistoryClick}
                rating={videoRating?.value}
                descriptor={generateRatingDescriptorString(videoRating?.descriptors)}
                href={url}
                year={year}
                duration={readableDuration}
                season={season}
                subTitle={subTitle}
                removeFromHistoryLabel={intl.formatMessage(messages.removeFromHistory)}
                addToMyListLabel={addToMyListLabel}
                removeFromMyListLabel={removeFromMyListLabel}
                comingSoonLabel={comingSoonLabel}
                setReminderLabel={intl.formatMessage(messages.remindMe)}
                removeReminderLabel={intl.formatMessage(messages.reminderSet)}
                playLabel={intl.formatMessage(messages.play)}
                is4K={is4K}
                isPreviewEnabled={isVideoPreviewEnabled}
                shouldNotShowTitleOnHover={isInLandscapeExperimentVariant && webLandscape.getValue() === 'hover_no_title'}
                previewAnchor={previewAnchor}
                previewBackgroundImageSrc={content && content.backgrounds?.[0]}
                renderPreviewPlayer={renderPreviewPlayer}
                onPreviewEnter={onPreviewEnter}
                onPreviewExit={onPreviewExit}
                fetchPriority={fetchPriority}
                lazyLoad={lazyLoad}
                preload={preload}
                isLikedSelectableTile={isLikedSelectableTile}
                onLikeClick={onLikeClick}
                hideDetails
                isLocked={isMatureContentGated}
                isMobileDevice={isMobileDevice}
                hideMetadata={hideMetadata}
              />
            );

            const isShowImpressionTile =
              isAdultMode &&
              containerId &&
              personalizationId &&
              typeof containerPosition === 'number' &&
              !isMajorEventFailsafe;

            if (isShowImpressionTile) {
              const props = {
                contentId: id,
                containerId,
                row: containerPosition + rowIndexOffset + 1,
                col: typeof colInContainer === 'number' ? colInContainer + 1 : indexInContainer + 1,
                isSeries,
                personalizationId,
              };

              return <ImpressionTile {...props}>{tile}</ImpressionTile>;
            }

            return tile;
          }}
        </LazyItem>
      )}
    </AddToQueueProvider>
  );
}

export default memo(MovieOrSeriesTile);
