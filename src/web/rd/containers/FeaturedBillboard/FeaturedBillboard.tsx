import { useRefMap } from '@adrise/utils/lib/useRefMap';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Play } from '@tubitv/icons';
import {
  Attributes,
  FeaturedCarouselWithDots,
  EnterExitTransition,
  Poster,
  Button,
  useCarouselSwipe,
  CarouselShell,
} from '@tubitv/web-ui';
import classNames from 'classnames';
import { memoize } from 'lodash';
import throttle from 'lodash/throttle';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import { TransitionGroup } from 'react-transition-group';

import { setContainerContext } from 'common/actions/container';
import {
  AUTO_START_CONTENT,
  FEATURED_CONTAINER_ID,
  SERIES_CONTENT_TYPE,
  BREAKPOINTS,
  CONTENT_DETAILS_MODAL_ID,
} from 'common/constants/constants';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebDetailsPageRedesign from 'common/experiments/config/webDetailsPageRedesign';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useContentTileInfo from 'common/hooks/useContentTileInfo';
import useExperiment from 'common/hooks/useExperiment';
import { containerIdMapSelector, personalizationIdSelector } from 'common/selectors/container';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { featuredVideosSelector } from 'common/selectors/featuredVideos';
import { firstEpisodeSelector, historyEpisodeSelector } from 'common/selectors/history';
import { showLinearProgramsInRowsSelector } from 'common/selectors/linearProgramsInRows';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import { isAdultsModeSelector, isMobileDeviceSelector, uiSelector } from 'common/selectors/ui';
import { byIdSelector } from 'common/selectors/video';
import { isWebFeaturedRowRotationEnabledSelector } from 'common/selectors/webFeaturedRow';
import { ImpressionTile } from 'common/services/ImpressionsManager/ImpressionTile';
import trackingManager from 'common/services/TrackingManager';
import type { Container } from 'common/types/container';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getImageUrlsFromContent } from 'common/utils/backgroundImages';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { findActiveProgram, getLinearProgramTileImageUrl, isLinearVideo } from 'common/utils/epg';
import { getSeasonDisplayText } from 'common/utils/getSeasonDisplayText';
import { getSeriesContentId } from 'common/utils/getSeriesContentId';
import { getUrlByVideo, hashImageDomain } from 'common/utils/urlConstruction';
import type { LocaleOptionType } from 'i18n/constants';
import AnimatedHeroBackground from 'web/rd/components/AnimatedHeroBackground/AnimatedHeroBackground';

import styles from './FeaturedBillboard.scss';

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

export function getVideoURL(video: Video | null, preferredLocale: LocaleOptionType | undefined): string {
  return video ? getUrlByVideo({ video, preferredLocale }) : '';
}

export function FeaturedBillboard() {
  const location = useLocation();
  const webDetailsPageRedesign = useExperiment(WebDetailsPageRedesign);
  const isNewDesign = webDetailsPageRedesign.getValue();
  const { videos, featuredContainerSlug, personalizationId } = useAppSelector(state => featuredBillboardSelector(state, { pathname: location.pathname }));
  const showLinearProgramsInRows = useAppSelector(showLinearProgramsInRowsSelector);
  const isAdultMode = useAppSelector(isAdultsModeSelector);
  const currentContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));
  const byId = useAppSelector(byIdSelector);
  const currentDate = useCurrentDate();
  const { preferredLocale } = useAppSelector(uiSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const [isReverseTransition, setIsReverseTransition] = useState(false);
  const [exitTx, setExitTx] = useState<string | undefined>(undefined);
  const intl = useIntl();
  const video: Video | undefined = videos[index];
  const videoURL = getVideoURL(video, preferredLocale);
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

  const isLoggedInUser = useAppSelector(isLoggedInSelector);
  const isShowFreeTag = !isLoggedInUser;
  const isArtTitleEnabled = !!artTitle;
  const isSeries = video?.type === SERIES_CONTENT_TYPE;
  const contentId = isSeries ? `0${video.id}` : video?.id;
  const historyEpisode = useAppSelector(state => historyEpisodeSelector(state, contentId));
  const firstEpisode = useAppSelector(state => firstEpisodeSelector(state, contentId));
  const videosKey = videos.map(v => v.id).join(',');
  const seriesSeasonNum = isSeries ? (video?.num_seasons ?? video?.seasons?.length ?? 0) : 0;
  const isMajorEventFailsafe = useAppSelector(isMajorEventFailsafeActiveSelector);

  const [viewport, setViewport] = useState(BREAKPOINTS.xxl);

  const handleResize = useCallback(() => {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    setViewport(width);
  }, [setViewport]);

  const throttledHandleResize = throttle(handleResize, 250);

  useEffect(() => {
    throttledHandleResize();
    addEventListener(window, 'resize', throttledHandleResize);
    return () => {
      removeEventListener(window, 'resize', throttledHandleResize);
    };
  }, [throttledHandleResize]);

  const { videoBackgroundSrc, usingCoverBackgroundImageOnMobile } = useMemo(() => {
    let videoBackgroundSrc = '';
    let usingCoverBackgroundImageOnMobile = false;
    const isGreatThan960 = viewport > BREAKPOINTS.lg;
    const isGreatThan540 = viewport > BREAKPOINTS.sMd;

    if (video) {
      if (isLinearVideo(video)) {
        const [_, activeProgram] = showLinearProgramsInRows ? findActiveProgram(video, byId, currentDate.getTime()) : [];
        videoBackgroundSrc = getImageUrlsFromContent(activeProgram || video, false).imageUrls[0];
      } else {
        if (isGreatThan960) {
          videoBackgroundSrc = hashImageDomain(video.images?.hero_feature_desktop_tablet?.[0] ?? '');
        } else if (isGreatThan540) {
          videoBackgroundSrc = hashImageDomain(video.images?.hero_feature_large_mobile?.[0] ?? '');
        } else {
          videoBackgroundSrc = hashImageDomain(video.images?.hero_feature_small_mobile?.[0] ?? '');
        }
      }
      if (!videoBackgroundSrc) {
        if (isMobile && !video.images?.hero_feature?.[0]) {
        // if there is no hero_feature image on mobile, use the background image and set the background image to cover
          usingCoverBackgroundImageOnMobile = true;
          videoBackgroundSrc = hashImageDomain(video.backgrounds[0]);
        } else {
          /* istanbul ignore next */
          videoBackgroundSrc = hashImageDomain((isMobile ? video.images?.hero_feature?.[0] : undefined) ?? video.hero_images[0] ?? video.backgrounds[0] ?? video.landscape_images[0]);
        }
      }
    }
    return { videoBackgroundSrc, usingCoverBackgroundImageOnMobile };
  }, [byId, currentDate, isMobile, showLinearProgramsInRows, video, viewport]);

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
      contentId: getSeriesContentId(video),
      slug: featuredContainerSlug,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  }, [featuredContainerSlug, videos]);
  const handlePrevious = useCallback(() => {
    // Set exit transition to slide out mid right
    flushSync(() => {
      setExitTx('slideOutMidRight');
    });
    // Set reverse transition to true
    setIsReverseTransition(true);
    const nextIndex = index === 0 ? videos.length - 1 : index - 1;
    handleUserIndexChange({ itemIndex: nextIndex });
  }, [index, videos, handleUserIndexChange]);
  const handleNext = useCallback(() => {
    // Set exit transition to slide out mid left
    flushSync(() => {
      setExitTx('slideOutMidLeft');
    });
    // Set reverse transition to false
    setIsReverseTransition(false);
    const nextIndex = index === videos.length - 1 ? 0 : index + 1;
    handleUserIndexChange({ itemIndex: nextIndex });
  }, [index, videos, handleUserIndexChange]);
  const trackLinkClick = useCallback(() => {
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug: featuredContainerSlug,
      contentId: getSeriesContentId(video),
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });

    dispatch(setContainerContext(FEATURED_CONTAINER_ID, currentContentMode));
  }, [video, featuredContainerSlug, index, dispatch, currentContentMode]);
  const handleNavigationAreaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackLinkClick();

    webDetailsPageRedesign.logExposure();
    if (isNewDesign) {
      tubiHistory.push({
        ...location,
        query: {
          ...location.query,
          [CONTENT_DETAILS_MODAL_ID]: contentId,
        },
      });
      return;
    }

    tubiHistory.push(autoStartRoute);
  }, [autoStartRoute, trackLinkClick, webDetailsPageRedesign, isNewDesign, contentId, location]);

  const handleWatchNowButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackLinkClick();

    const videoInfo = (() => {
      if (isSeries) {
        if (historyEpisode) {
          return { series_id: video.id, id: `${historyEpisode.contentId}` } as unknown as Video;
        }
        if (firstEpisode) {
          return { ...firstEpisode, series_id: video.id };
        }
      }
      return video;
    })();

    tubiHistory.push({
      pathname: getVideoURL(videoInfo, preferredLocale),
      state: {
        [AUTO_START_CONTENT]: true,
      },
    });
  }, [firstEpisode, historyEpisode, isSeries, trackLinkClick, video, preferredLocale]);

  const timerRef = useRef<number>();

  const isWebFeaturedRowRotationEnabled = useAppSelector(isWebFeaturedRowRotationEnabledSelector);
  useEffect(() => {
    if (isWebFeaturedRowRotationEnabled) {
      // Set timeout to rotate index if the preview is not visible
      timerRef.current = window.setTimeout(() => {
        // Set exit transition to slide out mid left
        flushSync(() => {
          setExitTx('slideOutMidLeft');
        });
        // Set reverse transition to false
        setIsReverseTransition(false);
        setIndex(index === videos.length - 1 ? 0 : index + 1);
      }, AUTO_ROTATE_TIMEOUT);
      return () => {
        window.clearTimeout(timerRef.current);
      };
    }
  }, [videos, index, isWebFeaturedRowRotationEnabled]);

  const swipeHandlers = useCarouselSwipe({ onNext: handleNext, onPrevious: handlePrevious });

  const getLinearInfo = useCallback((video: Video) => {
    const isLinearProgram = showLinearProgramsInRows && isLinearVideo(video);
    const [_, activeProgram] = isLinearProgram ? findActiveProgram(video, byId, currentDate.getTime()) : [];
    return { isLinearProgram, activeProgram };
  }, [byId, currentDate, showLinearProgramsInRows]);

  const renderItem = useCallback(
    (video: Video, index: number, isActiveIndex?: boolean) => {
      const { isLinearProgram, activeProgram } = getLinearInfo(video);
      const imageURL = isLinearProgram ? getLinearProgramTileImageUrl(video, activeProgram) ?? video.landscape_images[0] : video.landscape_images[0] ?? '';
      const isSeries = video.type === SERIES_CONTENT_TYPE;
      const poster = <Poster src={hashImageDomain(imageURL)} tileOrientation="landscape" />;
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

  const featuredCarouselExtraKey = useCallback((item: Video, index: number) => `${currentContentMode}-${item.id}-${index}`, [currentContentMode]);

  const [getAttributesNodeRef] = useRefMap<HTMLDivElement | null>(null);

  const attributesAndWatchNow = video ? (<div
    className={styles.attributesAndWatchNow}
    onClick={handleNavigationAreaClick}
  >
    <TransitionGroup
      className={classNames(styles.attributesAnimationContainer, styles.oneLineAttribute)}
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
            oneLineAttributes
            seriesSeasonNum={seriesSeasonNum}
            seriesSeasonNumDisplayText={getSeasonDisplayText(intl.formatMessage, seriesSeasonNum)}
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
      onClick={handleWatchNowButtonClick}
    >
      {intl.formatMessage(messages.watchNow)}
    </Button>
  </div>) : null;

  const backgroundContainer = (
    <CarouselShell absolutePosition iconVisibe showItemOverflow hasNext hasPrevious onNext={handleNext} onPrevious={handlePrevious}>
      <div className={styles.backgroundContainer} onClick={handleNavigationAreaClick}>
        <AnimatedHeroBackground
          entranceTransition={isReverseTransition ? 'slideInMidLeft' : 'slideInMidRight'}
          exitTransition={exitTx}
          entranceStagger={1}
          videoKey={video?.id}
          backgroundSrc={videoBackgroundSrc}
          customClass={usingCoverBackgroundImageOnMobile ? styles.coverBackground : undefined}
          isFullScreen
        />
      </div>
    </CarouselShell>
  );

  const [getTitleWrapperRef] = useRefMap<HTMLDivElement | null>(null);

  return (
    <div
      className={classNames(styles.featuredBillboard)}
      {...swipeHandlers}
    >
      <div className={styles.content}>
        <div className={styles.featuredCarouselContainer}>
          <div className={classNames(styles.featuredCarouselTitle, styles.withoutDivider)}>
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
          </div>
          <FeaturedCarouselWithDots<Video>
            index={index}
            data={videos}
            landscapeForLinear={showLinearProgramsInRows}
            renderItem={renderItem}
            onIndexChange={handleUserIndexChange}
            extraKey={featuredCarouselExtraKey}
          >
            {attributesAndWatchNow}
          </FeaturedCarouselWithDots>
        </div>
      </div>
      {backgroundContainer}
    </div>
  );
}

export default FeaturedBillboard;
