import { ErrorType } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { ATag, Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, FormattedMessage } from 'react-intl';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { trackMobileWebDeeplink } from 'client/features/playback/track/client-log/trackMobileWebDeeplink';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import type { PlaybackComponentExperimentProps } from 'common/HOCs/withExperiment';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isFullscreenSelector, isKidsModeSelector } from 'common/selectors/ui';
import { contentHistoryByContentIdSelector } from 'common/selectors/video';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { Video, VideoResource } from 'common/types/video';
import { getDeepLinkForVideo, getUrl } from 'common/utils/urlConstruction';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';
import RegistrationPrompt from 'web/features/authentication/components/RegistrationPrompt/RegistrationPrompt';
import { castVideo as castVideoAction } from 'web/features/playback/actions/chromecast';
import ChromecastPlayButton from 'web/features/playback/components/ChromecastPlayButton/ChromecastPlayButton';
import { useCheckForAdBlocker } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/useCheckForAdBlocker';
import { useDeriveAboveParental } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/useDeriveAboveParental';
import { useIsCasting } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/useIsCasting';
import { usePlayerFade } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/usePlayerFade';
import WebPlayer from 'web/features/playback/components/WebPlayer/WebPlayer';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import { isDrmKeySystemReadySelector } from 'web/features/playback/selectors/drm';
import { getPoster } from 'web/features/playback/utils/getPoster';

import MobilePlayButton from './MobilePlayButton';
import styles from './PlayerArea.scss';
import {
  PlayerErrorWarning,
  AdBlockWarning,
  MatureContentWarning,
  MatureContentInKidsModeWarning,
  NetworkErrorWarning,
  DRMUnsupportedWarning,
} from '../WarningBlocks/WarningBlocks';

const messages = defineMessages({
  parentalRestrictedMessage: {
    description: 'message indicating that the video is disallowed due to parental controls',
    defaultMessage:
      'This video is rated above your allowed level. Please adjust your <parentallink>Parental Controls</parentallink> settings.',
  },
  loginGatedMessage: {
    description: 'message to show when user on web is blocked from playing mature content without logging in',
    defaultMessage: 'Mature rating. Sign in or register to continue watching.',
  },
});

export interface PlayerAreaProps extends PlaybackComponentExperimentProps {
  contentId: string;
  deviceId: string | undefined;
  isMobile: boolean;
  video: Video;
  removePlayer: () => void;
  isContentReady: boolean;
  showDRMUnsupportedWarning: boolean;
  isFromAutoplay: boolean;
  prerollUrl: string;
  showAutoPlay: boolean;
  playerReady: boolean;
  seriesTitle: string | undefined;
  autoStart: boolean;
  startPosition: number;
  playerError: ErrorEventData | undefined;
  // for "Experiment on Title Page New Design", url to title page.
  isContentLoginGated: boolean;
  // drm infos
  videoResource: VideoResource | undefined;
  lastResourceRetryCount: number;
  requestFullscreen: (fullscreen: boolean) => void;
  tryFallbackVideoResource: (error: ErrorEventData) => VideoResource | undefined;
  playerErrorHandle: (error: ErrorEventData) => void;
  setNoVideoResourceFound: () => void;
}

const PLAYER_AREA_FADE_ACTIVE_STYLE = { opacity: '0' };

/**
 * This functional component is the future PlayerArea. We'll gradually migrate
 * functionality from the class component to this functional component.
 */
const PlayerArea = (props: PlayerAreaProps) => {
  useTrackRerenders('PlayerArea');
  const {
    isMobile,
    video,
    prerollUrl,
    removePlayer,
    showAutoPlay,
    seriesTitle,
    isContentReady,
    autoStart,
    startPosition,
    playerError,
    youboraExperimentMap,
    isFromAutoplay,
    isContentLoginGated,
    lastResourceRetryCount,
    requestFullscreen,
    tryFallbackVideoResource,
    playerErrorHandle,
    showDRMUnsupportedWarning,
    contentId,
    playerReady,
    deviceId,
    setNoVideoResourceFound,
    videoResource,
  } = props;
  const userAgent = useAppSelector((state) => state.ui.userAgent);
  const isDrmKeySystemReady = useAppSelector(isDrmKeySystemReadySelector);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const aboveParental = useDeriveAboveParental(video);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);
  const viewHistory = useAppSelector((state) => contentHistoryByContentIdSelector(state, contentId));
  const { isCasting } = useIsCasting();

  const dispatch = useAppDispatch();

  const castVideo = useCallback(() => {
    dispatch(castVideoAction(contentId));
  }, [contentId, dispatch]);

  const { playerAreaRef, isPlayerFadeActive } = usePlayerFade();

  const { adBlockerFound } = useCheckForAdBlocker();

  const { id, title, type, duration } = video;

  const pathname = getUrl({ type, id, title });

  const poster = getPoster(video);

  useEffect(() => {
    // unavailable contents
  // we should not show the warning when the component render at first time
    if (isContentReady && !videoResource) {
      removePlayer();
      setNoVideoResourceFound();
    }
  });

  const onClick = useCallback(() => {
    trackMobileWebDeeplink({ deeplinkSource: 'PlayerArea' as const });
    /* istanbul ignore next */
    if (isMobile) {
      trackContentDetailNavComponentInteractionEvent({
        componentSectionIndex: ContentDetailPageNavOption.Play,
      });
    }
    // if we don't do this it blocks the redirect
    return true;
  }, [isMobile]);

  if (showDRMUnsupportedWarning) {
    removePlayer();
    return <DRMUnsupportedWarning />;
  }

  if (isCasting) {
    removePlayer();
    return (
      <div className={styles.castButton}>
        <div>
          <ChromecastPlayButton className={styles.chromecastPlayButton} contentId={id} castContent={castVideo} />
        </div>
      </div>
    );
  }

  if (isMobile) {
    VODPlaybackSession.getInstance().setDiscarded();
    const deeplinkUrl = getDeepLinkForVideo(video, deviceId, {
      stopTracking: !isThirdPartySDKTrackingEnabled,
    });
    return (
      <a href={deeplinkUrl} className={styles.mobilePlaybackArea} title="Mobile App Deep Link">
        <MobilePlayButton viewHistory={viewHistory} duration={duration} title={title} id={id} onClick={onClick} />
      </a>
    );
  }

  // AdBlocker detected
  if (adBlockerFound) {
    // safely remove player from DOM. AdBlock check can resolve after the player has already been added to the DOM, so remove it here
    removePlayer();

    return <AdBlockWarning />;
  }

  // if kids mode is enabled and user tries to view a video above kids mode rating
  if (aboveParental && !isLoggedIn && isKidsModeEnabled) {
    removePlayer();
    return <MatureContentInKidsModeWarning rating={video.ratings} />;
  }

  const isContentParentalRestricted = aboveParental && isLoggedIn;
  if (isContentParentalRestricted || isContentLoginGated) {
    // safely remove player from DOM. isLoggedIn check can resolve after the player has already been added to the DOM, so remove it here
    removePlayer();

    const message = isContentParentalRestricted ? (
      <FormattedMessage
        {...messages.parentalRestrictedMessage}
        values={{
          parentallink: ([content]: React.ReactNode[]) => (
            <ATag to={`${WEB_ROUTES.parentalControl}?ref=${pathname}`}>{content}</ATag>
          ),
        }}
      />
    ) : (
      <FormattedMessage {...messages.loginGatedMessage} />
    );

    return <MatureContentWarning message={message} showLogin={isContentLoginGated} pathname={pathname} />;
  }

  if (playerError) {
    removePlayer();
    if (playerError.type === ErrorType.SETUP_ERROR && playerError.fatal) {
      return <PlayerErrorWarning />;
    }

    if (playerError.type === ErrorType.NETWORK_ERROR) {
      return <NetworkErrorWarning />;
    }
  }

  const hidePlayer = !playerReady;

  const playerAreaCls = classNames(styles.playerArea, {
    [styles.hidePlayer]: hidePlayer,
    [styles.fullscreen]: isFullscreen,
  });

  const webPlayerClassNames = classNames(styles.playerWrapper, {
    [styles.moveCaptionsToTop]: showAutoPlay,
  });

  const player = (
    <WebPlayer
      contentId={contentId}
      className={webPlayerClassNames}
      video={video}
      prerollUrl={prerollUrl}
      isMobile={isMobile}
      autoStart={autoStart}
      requestFullscreen={requestFullscreen}
      showAutoPlay={showAutoPlay}
      seriesTitle={seriesTitle}
      title={title}
      ready={!hidePlayer}
      startPosition={startPosition}
      poster={poster}
      userAgent={userAgent}
      isFromAutoplay={isFromAutoplay}
      videoResource={videoResource}
      lastResourceRetryCount={lastResourceRetryCount}
      youboraExperimentMap={youboraExperimentMap}
      tryFallbackVideoResource={tryFallbackVideoResource}
      playerErrorHandle={playerErrorHandle}
    />
  );
  const shouldDisplayPlayer = isContentReady && isDrmKeySystemReady;
  const shouldShowPlaceholderPlayer = !isMobile && (!shouldDisplayPlayer || hidePlayer);

  const playerAreaStyle = isPlayerFadeActive ? PLAYER_AREA_FADE_ACTIVE_STYLE : undefined;

  // todo(Liam / Tim) revert structure to have `section` as topmost div, move mobile playback concerns out of PlayerArea
  return (
    <div className={styles.fullHeight} data-component="PlayerArea">
      {
        shouldShowPlaceholderPlayer && (
          <Helmet>
            <link rel="preload" as="image" href={poster} fetchPriority="high" />
          </Helmet>
        )
      }
      <section
        className={playerAreaCls}
        ref={playerAreaRef}
        style={playerAreaStyle}
        data-test-id="player-area-section"
      >
        {shouldDisplayPlayer ? player : null}
        {shouldShowPlaceholderPlayer ? (
          <div className={styles.placeholder}>
            <img src={poster} className={styles.placeholderImage} title="Placeholder Image" />
            <Spinner className={styles.spinner} />
          </div>
        ) : null}
      </section>
      <RegistrationPrompt />
    </div>
  );

};

export default PlayerArea;
