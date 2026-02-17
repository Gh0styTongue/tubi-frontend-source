import { useRefMap } from '@adrise/utils/lib/useRefMap';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Play } from '@tubitv/icons';
import {
  Attributes,
  FeaturedCarousel,
  FeaturedCarouselWithDots,
  FeaturedCarouselWithPosters,
  EnterExitTransition,
  Poster,
  Button,
  useCarouselSwipe,
  CarouselShell,
} from '@tubitv/web-ui';
import classNames from 'classnames';
import { memoize } from 'lodash';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import { TransitionGroup } from 'react-transition-group';
import type { AnyAction } from 'redux';

import { setContainerContext } from 'common/actions/container';
import { loadEpisodesInSeries } from 'common/actions/video';
import {
  AUTO_START_CONTENT,
  FEATURED_CONTAINER_ID,
  SHOULD_FETCH_DATA_ON_SERVER,
  SERIES_CONTENT_TYPE,
} from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebNewFeaturedBillboard, { FEATURED_BILLBOARD_CONTROL, FEATURED_BILLBOARD_WITH_DOTS, FEATURED_BILLBOARD_WITH_POSTERS } from 'common/experiments/config/webNewFeaturedBillboard';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useContentTileInfo from 'common/hooks/useContentTileInfo';
import useExperiment from 'common/hooks/useExperiment';
import { containerIdMapSelector, personalizationIdSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { isFeaturedRowPreviewEnabledSelector } from 'common/selectors/experiments/webVideoPreview';
import { featuredVideosSelector } from 'common/selectors/featuredVideos';
import { firstEpisodeSelector, historyEpisodeSelector } from 'common/selectors/history';
import { showLinearProgramsInRowsSelector } from 'common/selectors/linearProgramsInRows';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import { isAdultsModeSelector, isMobileDeviceSelector, uiSelector } from 'common/selectors/ui';
import { byIdSelector } from 'common/selectors/video';
import { isMovieAndTVShowNavEnabledSelector } from 'common/selectors/webTopNav';
import { ImpressionTile } from 'common/services/ImpressionsManager/ImpressionTile';
import trackingManager from 'common/services/TrackingManager';
import type { Container } from 'common/types/container';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getImageUrlsFromContent } from 'common/utils/backgroundImages';
import { findActiveProgram, getLinearProgramTileImageUrl, isLinearVideo } from 'common/utils/epg';
import { getUrlByVideo, hashImageDomain } from 'common/utils/urlConstruction';
import { getViewportType } from 'common/utils/viewport';
import { useContainerRowPreviewPlayer } from 'web/hooks/useVideoPreview';
import AnimatedHeroBackground from 'web/rd/components/AnimatedHeroBackground/AnimatedHeroBackground';

import styles from './FeaturedBillboard.scss';

const LazyPreviewPlayer = React.lazy(() => import(/* webpackChunkName: "preview-player" */ 'common/features/playback/components/PreviewPlayer/PreviewPlayer'));

const AUTO_ROTATE_TIMEOUT = 5250;

const messages = defineMessages({
  watchNow: {
    description: 'Watch Now button text',
    defaultMessage: 'Watch Now',
  },
  freeTag: {
    description: 'Free, as in Watch Now (Free)',
    defaultMessage: 'Free',
  },
});

interface FeaturedBillboardSelectorOutput {
  videos: Video[];
  featuredContainerSlug: string;
  personalizationId?: string;
}

const featuredBillboardSelector = memoize((state: StoreState, { pathname }: { pathname: string }): FeaturedBillboardSelectorOutput => {
  const containerIdMap = containerIdMapSelector(state, { pathname });
  const personalizationId = personalizationIdSelector(state, { pathname });
  const containerMeta = containerIdMap[FEATURED_CONTAINER_ID] as Container | undefined;
  return {
    videos: containerMeta ? featuredVideosSelector(state, { pathname }) : [],
    featuredContainerSlug: containerMeta?.slug ?? '',
    personalizationId,
  };
});

function getVideoURL(video?: Video | null): string {
  return video ? getUrlByVideo({ video }) : '';
}

export function FeaturedBillboard() {
  const location = useLocation();
  const { videos, featuredContainerSlug, personalizationId } = useAppSelector(state => featuredBillboardSelector(state, { pathname: location.pathname }));
  const showLinearProgramsInRows = useAppSelector(showLinearProgramsInRowsSelector);
  const isAdultMode = useAppSelector(isAdultsModeSelector);
  const currentContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));
  const byId = useAppSelector(byIdSelector);
  const { currentDate } = useAppSelector(uiSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const intl = useIntl();
  const video: Video | undefined = videos[index];
  const videoURL = getVideoURL(video);
  const autoStartRoute = useMemo(() => ({
    pathname: videoURL,
    state: {
      [AUTO_START_CONTENT]: true,
    },
  }), [videoURL]);

  const {
    title,
    subTitle,
    year,
    rating,
    descriptor,
    duration,
    timeLeft,
    tags,
    labels,
    cc,
    artTitle,
  } = useContentTileInfo({ content: video, showLinearProgramsInRows });

  const previewPlayerWrapperRef = useRef<HTMLDivElement>(null);
  const isVideoPreviewEnabled = useAppSelector(isFeaturedRowPreviewEnabledSelector);
  const {
    isPreviewVisible,
    isPreviewPaused,
    onPreviewStart,
    onPreviewComplete,
    onPreviewError,
  } = useContainerRowPreviewPlayer({ isVideoPreviewEnabled, activeIndex: index, playerWrapperRef: previewPlayerWrapperRef });
  const webNewFeaturedBillboard = useExperiment(WebNewFeaturedBillboard);
  const isLoggedInUser = useAppSelector(isLoggedInSelector);
  const isMovieAndTVShowNavEnabled = useAppSelector(isMovieAndTVShowNavEnabledSelector);
  const viewportType = getViewportType(isMovieAndTVShowNavEnabled);
  const isDesktopViewport = viewportType === 'desktop';
  const webNewFeaturedBillboardValue = webNewFeaturedBillboard.getValue();
  const isDefaultFeatureBillboard = !isDesktopViewport || webNewFeaturedBillboardValue === FEATURED_BILLBOARD_CONTROL;
  const isDotsFeatureBillboard = isDesktopViewport && webNewFeaturedBillboardValue === FEATURED_BILLBOARD_WITH_DOTS;
  const isPostersFeatureBillboard = isDesktopViewport && webNewFeaturedBillboardValue === FEATURED_BILLBOARD_WITH_POSTERS;
  const isEnabledNewFeatureBillboard = !isDefaultFeatureBillboard;
  const isShowFreeTag = !isEnabledNewFeatureBillboard || !isLoggedInUser;
  const isArtTitleEnabled = !isDefaultFeatureBillboard && !!artTitle;
  const isSeries = video?.type === SERIES_CONTENT_TYPE;
  const contentId = isSeries ? `0${video.id}` : video?.id;
  const historyEpisode = useAppSelector(state => historyEpisodeSelector(state, contentId));
  const firstEpisode = useAppSelector(state => firstEpisodeSelector(state, contentId));
  const videosKey = videos.map(v => v.id).join(',');
  const seriesSeasonNum = isSeries && isEnabledNewFeatureBillboard ? (video?.num_seasons ?? video?.seasons?.length ?? 0) : 0;
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);

  let videoBackgroundSrc = '';
  let usingCoverBackgroundImageOnMobile = false;
  if (video && !isPreviewVisible) {
    if (isLinearVideo(video)) {
      const [_, activeProgram] = showLinearProgramsInRows ? findActiveProgram(video, byId, currentDate.getTime()) : [];
      videoBackgroundSrc = getImageUrlsFromContent(activeProgram || video, false).imageUrls[0];
    }
    if (!videoBackgroundSrc) {
      if (isMobile && !video.images?.hero_feature?.[0]) {
        // if there is no hero_feature image on mobile, use the background image and set the background image to cover
        usingCoverBackgroundImageOnMobile = true;
        videoBackgroundSrc = hashImageDomain(video.backgrounds[0]);
      } else {
        videoBackgroundSrc = hashImageDomain((isMobile ? video.images?.hero_feature?.[0] : undefined) ?? video.hero_images[0] ?? video.backgrounds[0] ?? video.landscape_images[0]);
      }
    }
  }
  // load series episodes for watchNow button can go to the first episode
  useEffect(() => {
    if (isSeries) {
      dispatch(loadEpisodesInSeries({
        seriesId: video.id,
        season: 1,
        page: 1,
        size: 1,
      }) as unknown as AnyAction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, index]);

  useEffect(() => {
    if (isDesktopViewport) {
      webNewFeaturedBillboard.logExposure();
    }
  }, [isDesktopViewport, webNewFeaturedBillboard]);

  useEffect(() => {
    // Reset index if videos list changes
    setIndex(0);
  }, [videosKey]);

  const handleUserIndexChange = useCallback(({ itemIndex }: { itemIndex: number }) => {
    const video = videos[itemIndex];
    setIndex(itemIndex);
    trackingManager.trackCarouselTrigger({
      startX: itemIndex,
      endX: itemIndex,
      contentId: video.type === SERIES_CONTENT_TYPE ? `0${video.id}` : video.id,
      slug: featuredContainerSlug,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  }, [featuredContainerSlug, videos]);
  const handlePrevious = useCallback(() => {
    const nextIndex = index === 0 ? videos.length - 1 : index - 1;
    handleUserIndexChange({ itemIndex: nextIndex });
  }, [index, videos, handleUserIndexChange]);
  const handleNext = useCallback(() => {
    const nextIndex = index === videos.length - 1 ? 0 : index + 1;
    handleUserIndexChange({ itemIndex: nextIndex });
  }, [index, videos, handleUserIndexChange]);
  const trackLinkClick = useCallback(() => {
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug: featuredContainerSlug,
      contentId: video.type === SERIES_CONTENT_TYPE ? `0${video.id}` : video.id,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });

    dispatch(setContainerContext(FEATURED_CONTAINER_ID, currentContentMode));
  }, [video, featuredContainerSlug, index, dispatch, currentContentMode]);
  const handleNavigationAreaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackLinkClick();
    tubiHistory.push(autoStartRoute);
  }, [autoStartRoute, trackLinkClick]);

  const handleWatchNowButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackLinkClick();
    let videoInfo = video;
    if (isSeries) {
      if (historyEpisode) {
        videoInfo = { series_id: video.id, id: `${historyEpisode.contentId}` } as unknown as Video;
      } else if (firstEpisode) {
        videoInfo = { ...firstEpisode, series_id: video.id };
      }
    }
    tubiHistory.push({
      pathname: getVideoURL(videoInfo),
      state: {
        [AUTO_START_CONTENT]: true,
      },
    });
  }, [firstEpisode, historyEpisode, isSeries, trackLinkClick, video]);

  const handleActiveItemClick = useCallback(() => {
    trackLinkClick();
    tubiHistory.push(autoStartRoute);
  }, [autoStartRoute, trackLinkClick]);

  const timerRef = useRef<number>();
  useEffect(() => {
    if (isPreviewVisible) {
      window.clearTimeout(timerRef.current);
    } else {
      // Set timeout to rotate index if the preview is not visible
      timerRef.current = window.setTimeout(() => {
        setIndex(index === videos.length - 1 ? 0 : index + 1);
      }, AUTO_ROTATE_TIMEOUT);
    }
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [videos, index, isPreviewVisible]);
  const swipeHandlers = useCarouselSwipe({ onNext: handleNext, onPrevious: handlePrevious });

  const getLinearInfo = useCallback((video: Video) => {
    const isLinearProgram = showLinearProgramsInRows && isLinearVideo(video);
    const [_, activeProgram] = isLinearProgram ? findActiveProgram(video, byId, currentDate.getTime()) : [];
    return { isLinearProgram, activeProgram };
  }, [byId, currentDate, showLinearProgramsInRows]);

  const renderItem = useCallback(
    (video: Video, index: number, isActiveIndex?: boolean) => {
      const { isLinearProgram, activeProgram } = getLinearInfo(video);
      const tileOrientation = isLinearProgram ? 'landscape' : undefined;
      const imageURL = isLinearProgram ? getLinearProgramTileImageUrl(video, activeProgram) ?? video.landscape_images[0] ?? '' : video.posterarts[0] ?? '';
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const poster = <Poster src={hashImageDomain(imageURL)} tileOrientation={tileOrientation} />;
      return isAdultMode && isActiveIndex && personalizationId && featuredContainerSlug && !isMajorEventFailsafe ? (
        <ImpressionTile
          key={video.id}
          contentId={video.id}
          containerId={featuredContainerSlug}
          row={1}
          col={index + 1}
          isSeries={isSeries}
          personalizationId={personalizationId}
          className={styles.impressionTile}
        >
          {poster}
        </ImpressionTile>
      ) : poster;
    },
    [getLinearInfo, isAdultMode, personalizationId, featuredContainerSlug, isMajorEventFailsafe]
  );

  const renderDotPoster = useCallback(
    (video: Video) => {
      const { isLinearProgram, activeProgram } = getLinearInfo(video);
      const imageURL = isLinearProgram ? getLinearProgramTileImageUrl(video, activeProgram) ?? video.landscape_images[0] : video.landscape_images[0] ?? '';
      return <Poster src={hashImageDomain(imageURL)} tileOrientation="landscape" />;
    }, [getLinearInfo]
  );

  const featuredCarouselExtraKey = useCallback((item: Video, index: number) => `${currentContentMode}-${item.id}-${index}`, [currentContentMode]);

  const [getAttributesNodeRef] = useRefMap<HTMLDivElement | null>(null);

  const attributesAndWatchNow = video ? (<div
    className={styles.attributesAndWatchNow}
    onClick={handleNavigationAreaClick}
  >
    <TransitionGroup
      className={classNames(styles.attributesAnimationContainer, {
        [styles.oneLineAttribute]: isEnabledNewFeatureBillboard,
      })}
    >
      <EnterExitTransition
        key={video?.id}
        exitTransition="slideOutDown"
        entranceTransition="slideInUp"
        entranceStagger={2}
        nodeRef={getAttributesNodeRef(video?.id)}
      >
        <div ref={getAttributesNodeRef(video?.id)} className={styles.attributes}>
          <Attributes
            badges={labels}
            subTitle={subTitle}
            year={year}
            duration={duration}
            rating={rating}
            tags={tags}
            descriptor={descriptor}
            oneLineAttributes={isEnabledNewFeatureBillboard}
            seriesSeasonNum={seriesSeasonNum}
            cc={cc}
            timeLeft={timeLeft}
          />
        </div>
      </EnterExitTransition>
    </TransitionGroup>
    <Button
      className={styles.watchNowButton}
      tag={isShowFreeTag ? intl.formatMessage(messages.freeTag) : undefined}
      icon={Play}
      onClick={isEnabledNewFeatureBillboard ? handleWatchNowButtonClick : handleNavigationAreaClick}
    >
      {intl.formatMessage(messages.watchNow)}
    </Button>
  </div>) : null;

  let backgroundContainer = <div className={styles.backgroundContainer} onClick={handleNavigationAreaClick}>
    <AnimatedHeroBackground
      entranceTransition={isEnabledNewFeatureBillboard ? 'slideInMidRight' : undefined}
      exitTransition={isEnabledNewFeatureBillboard ? 'slideOutMidLeft' : undefined}
      entranceStagger={1}
      videoKey={video?.id}
      backgroundSrc={videoBackgroundSrc}
      customClass={usingCoverBackgroundImageOnMobile ? styles.coverBackground : undefined}
      isFullScreen={isEnabledNewFeatureBillboard}
    />
  </div>;
  if (isDotsFeatureBillboard) {
    backgroundContainer = (
      <CarouselShell absolutePosition iconVisibe showItemOverflow hasNext hasPrevious onNext={handleNext} onPrevious={handlePrevious}>
        {backgroundContainer}
      </CarouselShell>
    );
  }

  const [getTitleWrapperRef] = useRefMap<HTMLDivElement | null>(null);

  return (
    <div className={classNames(styles.featuredBillboard, { [styles.videoPreview]: isVideoPreviewEnabled, [styles.isEnabledNewFeatureBillboard]: isEnabledNewFeatureBillboard })} {...swipeHandlers}>
      <div className={styles.content}>
        <div className={styles.featuredCarouselContainer}>
          <div className={classNames(styles.featuredCarouselTitle, { [styles.withoutDivider]: isEnabledNewFeatureBillboard })}>
            <TransitionGroup className={styles.titleAnimationContainer}>
              <EnterExitTransition
                exitTransition="slideOutDown"
                entranceTransition="slideInUp"
                entranceStagger={1}
                key={video?.id}
                nodeRef={getTitleWrapperRef(video?.id)}
              >
                <div ref={getTitleWrapperRef(video?.id)} className={styles.titleWrapper}>
                  {labels && labels.length > 0 ? <div className={styles.badges}>{labels}</div> : null}
                  <Link
                    className={styles.title}
                    onClick={handleNavigationAreaClick}
                    to={videoURL}
                    data-test-id="featuredCarouselTitle"
                  >
                    {isArtTitleEnabled ? (
                      <div
                        style={{ backgroundImage: `url("${artTitle}")` }}
                        className={styles.artTitle}
                        data-test-id="content-art-title"
                      />
                    ) : (
                      title
                    )}
                  </Link>
                </div>
              </EnterExitTransition>
            </TransitionGroup>
            { !isEnabledNewFeatureBillboard ? <div className={styles.divider} /> : null }
          </div>
          {isDefaultFeatureBillboard ? (
            <FeaturedCarousel<Video>
              index={index}
              data={videos}
              landscapeForLinear={showLinearProgramsInRows}
              renderItem={renderItem}
              onIndexChange={handleUserIndexChange}
              onActiveItemClick={handleActiveItemClick}
            >
              {attributesAndWatchNow}
            </FeaturedCarousel>
          ) : null}
          {isDotsFeatureBillboard ? (
            <FeaturedCarouselWithDots<Video>
              index={index}
              data={videos}
              landscapeForLinear={showLinearProgramsInRows}
              renderItem={renderDotPoster}
              onIndexChange={handleUserIndexChange}
              onActiveItemClick={handleActiveItemClick}
              extraKey={featuredCarouselExtraKey}
            >
              {attributesAndWatchNow}
            </FeaturedCarouselWithDots>
          ) : null}
          {isPostersFeatureBillboard ? (
            <FeaturedCarouselWithPosters<Video>
              index={index}
              data={videos}
              landscapeForLinear={showLinearProgramsInRows}
              renderItem={renderDotPoster}
              onIndexChange={handleUserIndexChange}
              onActiveItemClick={handleActiveItemClick}
              extraKey={featuredCarouselExtraKey}
            >
              {attributesAndWatchNow}
            </FeaturedCarouselWithPosters>
          ) : null}
        </div>
      </div>
      <div className={styles.mobilePagination}>
        <span className={styles.mobilePaginationCurrent}>
          {index + 1}
        </span>
        {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
        <span>&nbsp;·&nbsp;{videos.length}</span>
      </div>
      {backgroundContainer}
      {!(__SERVER__ && SHOULD_FETCH_DATA_ON_SERVER) && isVideoPreviewEnabled ? (
        <Suspense fallback={null}>
          <div className={styles.backgroundContainer} ref={previewPlayerWrapperRef} onClick={handleNavigationAreaClick}>
            <LazyPreviewPlayer
              className={classNames(styles.previewPlayer, { [styles.visible]: isPreviewVisible })}
              video={video}
              previewUrl={video?.video_preview_url}
              isVisible={isPreviewVisible}
              isPaused={isPreviewPaused}
              onStart={onPreviewStart}
              onPlay={onPreviewStart}
              onError={onPreviewError}
              onComplete={onPreviewComplete}
              enableBackground
              backgroundClassname={styles.playerGradient}
              enableMuteButton
              muteButtonContainerClassname={styles.muteButtonContainer}
              muteButtonClassname={styles.muteButton}
            />
          </div>
        </Suspense>
      ) : null}
    </div>
  );
}

export default FeaturedBillboard;
