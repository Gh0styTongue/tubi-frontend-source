/* eslint-disable react/forbid-component-props */
import { ChevronCircleRight, Subtitles } from '@tubitv/icons';
import { Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import type { CSSProperties, FC } from 'react';
import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { preloadPurplescripts } from 'client/utils/preloadPurpleCarpetScripts';
import { PurpleCarpetBadges } from 'common/features/purpleCarpet/components/Badges/Badges';
import { useActionButton } from 'common/features/purpleCarpet/hooks/useActionButton';
import { usePurpleCarpet } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import { usePurpleCarpetStatus } from 'common/features/purpleCarpet/hooks/usePurpleCarpetStatus';
import { isWebPurpleCarpetPreviewEnabledSelector } from 'common/features/purpleCarpet/selector';
import useAppSelector from 'common/hooks/useAppSelector';
import { videoByContentIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';
import { hashImageDomain } from 'common/utils/urlConstruction';
import { useDetectAutoplayCapability } from 'web/features/playback/components/VideoDetail/hooks/useDetectAutoplayCapability';
import ActionButton from 'web/features/purpleCarpet/components/PurpleCarpetDetails/ActionButton';
import { useContainerRowPreviewPlayer } from 'web/hooks/useVideoPreview';

import styles from './PurpleCarpetDetails.scss';
import { PurpleCarpetPreview } from './PurpleCarpetPreview';

const ANIMATION_DURATION = 300;
const MARGIN_RIGHT = 10;
const PREVIEW_CONTENT_WIDTH = 387;

const LazyPreviewPlayer = React.lazy(() => import(/* webpackChunkName: "preview-player" */ 'common/features/playback/components/PreviewPlayer/PreviewPlayer'));

export const PurpleCarpetDetails: FC<{ id: string; type: 'row' | 'fullscreen', loading?: boolean }> = memo(
  ({ id, type = 'row', loading }) => {
    const { current: currentEvent, relatedEvents } = usePurpleCarpet(id);
    const actionButton = useActionButton(id);
    const isMobile = useAppSelector((state) => state.ui.isMobile);
    const viewportType = useAppSelector((state) => state.ui.viewportType);
    const isDesktop = viewportType === 'desktop';
    const isFullscreen = type === 'fullscreen';

    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [previewContents, setPreviewContents] = useState<Video[]>(relatedEvents);
    const previewPlayerWrapperRef = useRef<HTMLDivElement>(null);
    const video = useAppSelector((state) => videoByContentIdSelector(state, id));
    const isVideoPreviewEnabled = useAppSelector(isWebPurpleCarpetPreviewEnabledSelector);

    const {
      isPreviewVisible,
      isPreviewPaused,
      onPreviewStart,
      onPreviewComplete,
      onPreviewError,
    } = useContainerRowPreviewPlayer({
      activeIndex: 0,
      playerWrapperRef: previewPlayerWrapperRef,
      isVideoPreviewEnabled,
    });

    const handleNext = useCallback(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % previewContents.length);
      }
    }, [isTransitioning, previewContents]);

    const showNext = isDesktop && relatedEvents.length > 1;

    usePurpleCarpetStatus(id);

    useDetectAutoplayCapability();

    useEffect(() => {
      if (currentIndex === relatedEvents.length) {
        timeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(0);
        }, ANIMATION_DURATION - 100);
      } else {
        timeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, ANIMATION_DURATION);
      }

      return () => clearTimeout(timeoutRef.current);
    }, [currentIndex, relatedEvents.length]);

    useEffect(() => {
      preloadPurplescripts();
    }, []);

    useEffect(() => {
      // copy the first one to make the carousel transition smoothly
      const newRelatedEvents = showNext ? [...relatedEvents, ...relatedEvents.slice(0, 1)] : relatedEvents;
      if (!isEqual(newRelatedEvents, previewContents)) {
        setPreviewContents(newRelatedEvents);
        setCurrentIndex(0);
      }
    }, [previewContents, relatedEvents, showNext]);

    const translateStyle = useMemo<CSSProperties>(() => {
      return {
        transform: showNext ? `translateX(calc(-${currentIndex} * ${(PREVIEW_CONTENT_WIDTH + MARGIN_RIGHT)}px))` : 'none',
        transition: isTransitioning ? `transform ${ANIMATION_DURATION}ms ease-in-out` : 'none',
      };
    }, [currentIndex, isTransitioning, showNext]);

    const withEmbed = !!relatedEvents.length;
    const preview = useMemo(() => {
      if (!withEmbed) return;

      return previewContents.map((event, index) => (
        <PurpleCarpetPreview
          key={index}
          content={event}
          marked={showNext && currentIndex !== index && index !== 0}
        />
      ));
    }, [currentIndex, previewContents, showNext, withEmbed]);

    if (loading && isFullscreen) {
      return <div className={classNames(styles.details, styles.fullscreen)}>
        <Spinner className={styles.spinner} />
      </div>;
    }

    if (!currentEvent) {
      return null;
    }

    const { description, tags, showCC, title, titleArt, backgroundImage, images } = currentEvent;
    const bg = hashImageDomain(isMobile && images?.hero_feature?.[0] ? images.hero_feature[0] : backgroundImage);

    return (
      <div
        className={classNames(styles.details, {
          [styles.fullscreen]: isFullscreen,
          [styles.withEmbed]: withEmbed,
        })}
      >
        <div className={styles.backgroundBg} style={{ backgroundImage: `url(${bg})` }} />
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <PurpleCarpetBadges id={id} />
            <div className={styles.title}>{titleArt ? <img alt={title} src={titleArt} /> : title}</div>
            { tags?.length ?
              <div className={styles.genres}>
                {tags.join(', ')} {showCC ? <Subtitles /> : null}
              </div> : null
            }
            { !isMobile ? <div className={styles.description}>{description}</div> : null }
            <ActionButton {...actionButton} game={currentEvent} />
            { isMobile && isFullscreen ? <div className={styles.description}>{description}</div> : null }
          </div>
          {
            withEmbed ? (
              <div className={styles.preview}>
                <div
                  className={classNames(styles.previewWrapper, {
                    [styles.center]: relatedEvents.length === 1,
                  })}
                  style={translateStyle}
                >{ preview } </div>
                { showNext ? <ChevronCircleRight className={styles.arrowRight} onClick={handleNext} /> : null }
              </div>
            ) : null
          }
        </div>
        <Suspense fallback={null}>
          {
            isVideoPreviewEnabled && video.video_preview_url ?
              <div className={classNames(styles.backgroundContainer, { [styles.visible]: isPreviewVisible })} ref={previewPlayerWrapperRef}>
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
              : null
          }
        </Suspense>
      </div>
    );
  }
);
