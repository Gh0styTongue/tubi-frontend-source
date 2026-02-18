/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { Subtitles } from '@tubitv/icons';
import { Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { memo, Suspense, useCallback, useRef } from 'react';

import { VIEWPORT_TYPE } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { LiveEventBadges } from 'common/features/liveEvent/components/Badges/Badges';
import { useActionButton } from 'common/features/liveEvent/hooks/useActionButton';
import { useLiveEvent } from 'common/features/liveEvent/hooks/useLiveEvent';
import { useLiveEventStatus } from 'common/features/liveEvent/hooks/useLiveEventStatus';
import { LiveEventContentStatus } from 'common/features/liveEvent/types';
import useAppSelector from 'common/hooks/useAppSelector';
import { videoByContentIdSelector } from 'common/selectors/video';
import { hashImageDomain } from 'common/utils/urlConstruction';
import { isWebLiveEventDetailsUrl } from 'common/utils/urlPredicates';
import ActionButton from 'web/features/liveEvent/components/LiveEventTopDetails/ActionButton';
import { useDetectAutoplayCapability } from 'web/features/playback/components/VideoDetail/hooks/useDetectAutoplayCapability';
import { useContainerRowPreviewPlayer } from 'web/hooks/useVideoPreview';

import styles from './LiveEventTopDetails.scss';

const LazyPreviewPlayer = React.lazy(() => import(/* webpackChunkName: "preview-player" */ 'common/features/playback/components/PreviewPlayer/PreviewPlayer'));

export const LiveEventTopDetails: FC<{
  id: string; type: 'spotlight' | 'fullscreen',
  loading?: boolean,
  hasPlayer?: boolean,
  containerSlug?: string
}> = memo(
  ({ id, type = 'row', loading, hasPlayer = false, containerSlug }) => {
    const { pathname } = useLocation();
    const currentEvent = useLiveEvent(id);
    const video = useAppSelector((state) => videoByContentIdSelector(state, id));
    const actionButton = useActionButton(id);
    const viewportType = useAppSelector((state) => state.ui.viewportType);
    const isDesktop = viewportType === VIEWPORT_TYPE.desktop;
    const shouldHideButton = isWebLiveEventDetailsUrl(pathname) && hasPlayer;
    const isSpotlight = type === 'spotlight';
    const isFullscreen = type === 'fullscreen';

    const previewPlayerWrapperRef = useRef<HTMLDivElement>(null);
    // Guard against undefined video during fast scrolling - video may not be loaded yet
    const isVideoPreviewEnabled = isDesktop && !hasPlayer && !!(video?.video_previews?.[0]?.url || video?.video_preview_url);
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

    useLiveEventStatus(id);

    useDetectAutoplayCapability();

    const actionButtonClickRef = useRef<(() => void) | null>(null);
    const handleClick = useCallback(() => {
      if (isSpotlight) {
        actionButtonClickRef.current?.();
      }
    }, [isSpotlight]);

    if (loading) {
      return <div className={classNames(styles.details)}>
        <Spinner className={styles.spinner} />
      </div>;
    }

    if (!currentEvent) {
      return null;
    }

    const { description, tags, showCC, title, titleArt, backgroundImage, images, status } = currentEvent;
    const bg = hashImageDomain(
      viewportType === VIEWPORT_TYPE.mobile
        ? images?.hero_feature_small_mobile?.[0] ?? images?.hero_feature?.[0] ?? backgroundImage
        : backgroundImage
    );

    return (
      <div
        className={classNames(styles.details, {
          [styles.spotlight]: isSpotlight,
          [styles.fullscreen]: isFullscreen,
          [styles.withPlayer]: hasPlayer,
        })}
        onClick={handleClick}
      >
        <div className={styles.backgroundBg} style={{ backgroundImage: `url(${bg})` }} />
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.title}>
              {titleArt ? <img className={styles.artTitle} alt={title} src={titleArt} {...(__SERVER__ ? {} : { fetchpriority: 'high' })} /> : title}
              {
                currentEvent.channelLogo ?
                  <img className={styles.channelLogo} alt="channel logo" src={currentEvent.channelLogo} />
                  : null
              }
            </div>
            <div className={styles.genres}>
              { status !== LiveEventContentStatus.Ended ?
                <span className={styles.badges}><LiveEventBadges id={id} /></span>
                : null
              }
              {tags?.length ? <span className={styles.tags}>{tags?.join(', ')}</span> : null}
              {showCC ? <Subtitles /> : null}
            </div>
            { isDesktop && !isSpotlight ? <div className={styles.description}>{description}</div> : null }
            { !shouldHideButton ? (
              <ActionButton
                {...actionButton}
                game={currentEvent}
                containerSlug={containerSlug}
                onClickRef={actionButtonClickRef}
              />
            ) : null }
            { !isDesktop && !isSpotlight ? <div className={styles.description}>{description}</div> : null }
          </div>
        </div>
        <Suspense fallback={null}>
          {
            isVideoPreviewEnabled ?
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
