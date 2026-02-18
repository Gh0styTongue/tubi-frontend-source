import type { AudioTrackInfo } from '@adrise/player';
import { State as PLAYER_STATES } from '@adrise/player';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import PlayButtonEmpty from 'common/components/uilib/PlayButtonEmpty/PlayButtonEmpty';
import RatingOverlay from 'common/components/uilib/RatingOverlay/RatingOverlay';
import TitleDisplay from 'common/components/uilib/TitleDisplay/TitleDisplay';
import { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import { isGDPREnabledSelector, isInGDPRCountryWithKidsSelector } from 'common/features/gdpr/selectors/gdpr';
import AdMessageWrapper from 'common/features/playback/components/AdMessageWrapper/AdMessageWrapper';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { useThumbnailSprites } from 'common/hooks/useThumbnailSprites/useThumbnailSprites';
import { playerStateSelector, positionSelector } from 'common/selectors/playerStore';
import { isFullscreenSelector, isKidsModeSelector } from 'common/selectors/ui';
import { adBreaksByContentIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';
import { isPictureInPictureSupported } from 'common/utils/pictureInPicture';
import { shouldOpenSubtitlePanel } from 'web/features/deepLinkActions/utils';
import AutoPlay from 'web/features/playback/components/AutoPlay/AutoPlay';
import ProgressBar from 'web/features/playback/components/ProgressBar/ProgressBar';
import { useCaptionsHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useCaptionsHandlers';
import { useDetectPlaybackStart } from 'web/features/playback/components/WebPlayerOverlay/hooks/useDetectPlaybackStart';
import { useHotkeys } from 'web/features/playback/components/WebPlayerOverlay/hooks/useHotkeys';
import { useMouseMoveHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useMouseMoveHandlers';
import { useOverlayClickHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useOverlayClickHandlers';
import { OVERLAY_TRANSITION_DURATION_MILLISECONDS, useOverlayTimer } from 'web/features/playback/components/WebPlayerOverlay/hooks/useOverlayTimer';
import { usePlayAndPauseHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/usePlayAndPauseHandlers';
import { useQualityHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useQualityHandlers';
import useRatingOverlay from 'web/features/playback/components/WebPlayerOverlay/hooks/useRatingOverlay';
import { useTouchHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useTouchHandlers';
import { useVolumeHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/useVolumeHandlers';
import PauseQrCode from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/PauseQrCode';
import { useFullscreenHandler } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useFullscreenHandler';
import { useSeekHandlers } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import { castApiAvailableSelector } from 'web/features/playback/selectors/chromecast';
import { durationSelector, isAdSelector, isBufferingSelector } from 'web/features/playback/selectors/player';
import { renderControlsSelector } from 'web/features/playback/selectors/ui';

import ChromecastButton from './PlayerControls/ChromecastButton/ChromecastButton';
import { useHandleAdvancedSettingsClick } from './PlayerControls/hooks/useHandleAdvancedSettingsClick';
import type { PlayerControlsProps } from './PlayerControls/PlayerControls';
import PlayerControls from './PlayerControls/PlayerControls';
import styles from './WebPlayerOverlay.scss';
import { usePlayerPortal } from '../../contexts/playerPortalContext/playerPortalContext';
import FloatingPlayerOverlay from '../FloatingPlayerOverlay/FloatingPlayerOverlay';
import { useVolumeRange } from './hooks/useVolumeRange';
import { useVolumeClickHandlers } from './PlayerControls/hooks/useVolumeClickHandlers';

const fadeInOut = {
  enter: styles.fadeEnter,
  enterActive: styles.fadeEnterActive,
  exit: styles.fadeLeave,
  exitActive: styles.fadeLeaveActive,
};

export interface WebPlayerOverlayProps {
  video: Video;
  requestFullscreen: (value: boolean) => void;
  showAutoPlay: boolean;
  isMobile: boolean;
  title: string;
  seriesTitle: string | undefined;
  isFromAutoplay: boolean;
  basicCaptionSettings: PlayerControlsProps['basicCaptionSettings'];
  getAudioTracks: () => AudioTrackInfo[] | undefined;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  pipEnabled: boolean;
  togglePictureInPicture: (e: React.MouseEvent) => void;
}

const WebPlayerOverlay = (props: WebPlayerOverlayProps) => {
  useTrackRerenders('WebPlayerOverlay');

  const {
    video = { id: '' } as Video,
    requestFullscreen,
    showAutoPlay,
    isMobile,
    title,
    seriesTitle,
    isFromAutoplay,
    basicCaptionSettings,
    getAudioTracks,
    getCurrentAudioTrack,
    setAudioTrack,
    pipEnabled,
    togglePictureInPicture,
  } = props;

  const dispatch = useAppDispatch();
  const castApiAvailable = useAppSelector(castApiAvailableSelector);
  const { data: thumbnailSprites } = useThumbnailSprites({ contentId: video.id });
  const renderControls = useAppSelector(renderControlsSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);
  const isAd = useAppSelector(isAdSelector);
  const playerState = useAppSelector(playerStateSelector);
  const position = useAppSelector(positionSelector);
  const duration = useAppSelector(durationSelector);
  const isBuffering = useAppSelector(isBufferingSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);
  const adBreaks = useAppSelector((state) => maybeOverrideCuePoints(adBreaksByContentIdSelector(state, video.id)));
  const isAutoPlayCounterEnabled = !useAppSelector(isInGDPRCountryWithKidsSelector);
  const shouldEnablePauseQrCode = !isGDPREnabled && !isKidsModeEnabled;

  // STATE
  const [captionSettingsVisible, setCaptionSettingsVisible] = useState(false);
  const [qualitySettingsVisible, setQualitySettingsVisible] = useState(false);
  const [, _setIsPortraitMode] = useState(false);

  // REFS
  const playerOverlayRef = useRef<HTMLDivElement>(null);
  const titleRowRef = useRef<HTMLDivElement>(null);
  const bottomMessageRef = useRef<HTMLDivElement>(null);
  const controlAreaRef = useRef<HTMLDivElement>(null);

  // CUSTOM HOOKS
  const { hasPlaybackStarted } = useDetectPlaybackStart();
  const {
    active,
    setInactive,
    refreshActiveTimer,
    isShowingOverlayOnStartPlayback,
    cancelOverlayTimer,
  } = useOverlayTimer({ captionSettingsVisible, qualitySettingsVisible });

  const { ratingActive } = useRatingOverlay();

  // CONTROL HANDLERS
  const { play, explicitPlay, pause, explicitPause } = usePlayAndPauseHandlers({
    refreshActiveTimer,
    contentId: video.id,
  });
  const { seek, stepForward, stepRewind } = useSeekHandlers({
    contentId: video.id,
    positionBeforeSeek: position,
    refreshActiveTimer,
  });

  const { setVolume, toggleVolumeMute, isMuted, volume } = useVolumeHandlers({ refreshActiveTimer });

  const {
    showVolumeRange,
    makeVolumeRangeVisible,
    makeVolumeRangeInvisible,
  } = useVolumeRange();

  const volumeChangedByUserRef = useRef(false);
  const volumeMuteChangedByUserRef = useRef(false);
  const {
    handleClickVolume,
    updateVolume,
  } = useVolumeClickHandlers({
    volumeChangedByUserRef,
    volumeMuteChangedByUserRef,
    isMuted,
    setVolume,
    toggleVolumeMute,
  });

  const { handleAdvancedSettingsClick } = useHandleAdvancedSettingsClick(explicitPause);

  const { setCaptions, handleCaptionSettingsToggle } = useCaptionsHandlers({
    contentId: video.id,
    refreshActiveTimer,
    setCaptionSettingsVisible,
  });

  const { setQuality, handleQualitySettingsToggle } = useQualityHandlers({
    refreshActiveTimer,
    contentId: video.id,
    setQualitySettingsVisible,
  });

  const toggleFullscreen = () => {
    requestFullscreen(!isFullscreen);
  };

  const { handleClickFullscreen } = useFullscreenHandler({
    toggleFullscreen,
    isFullscreen,
  });

  const { onClick, onDoubleClick } = useOverlayClickHandlers({
    explicitPause,
    explicitPlay,
    dispatch,
    captionSettingsVisible,
    setCaptionSettingsVisible,
    qualitySettingsVisible,
    setQualitySettingsVisible,
    playerOverlayRef,
    requestFullscreen,
  });

  // Handle deep link subtitle panel opening
  useEffect(() => {
    if (shouldOpenSubtitlePanel()) {
      setCaptionSettingsVisible(true);
    }
  }, []);

  useHotkeys({
    requestFullscreen,
    isMuted,
    play,
    pause,
    stepRewind,
    stepForward,
    setVolume,
    setCaptions,
    refreshActiveTimer,
  });

  const { onMouseMove, onMouseLeave } = useMouseMoveHandlers({
    refreshActiveTimer,
    setInactive,
    cancelOverlayTimer,
    isShowingOverlayOnStartPlayback,
    captionSettingsVisible,
    qualitySettingsVisible,
  });

  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  } = useTouchHandlers({
    active,
    refreshActiveTimer,
    setInactive,
  });

  const { isFloating } = usePlayerPortal();
  useEffect(() => {
    VODPlaybackSession.getInstance().setPlayerDisplayMode(isFloating ? PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE : PlayerDisplayMode.DEFAULT);
  }, [isFloating]);

  const showSpinner = !isAd && isBuffering;
  const autoplayVisible = !isAd && showAutoPlay;

  // pause AutoPlay if the video state is paused and it doesn't reach the end,
  // there is always a pause event before end event.
  const shouldPauseAutoPlay = playerState === PLAYER_STATES.paused && Math.abs(position - duration) > 1;

  // define classNames
  const playerOverlayClass = classNames(
    styles.webPlayerOverlay,
    {
      [styles.hideCursor]: !active,
      [styles.isAd]: isAd,
    },
  );

  const bottomSectionClasses = classNames(styles.lowerArea, {
    [styles.active]: active,
    [styles.isAd]: isAd,
    [styles.autoplayVisible]: autoplayVisible,
  });

  const titleAreaClasses = classNames(styles.titleArea, {
    [styles.topActive]: active || ratingActive,
  });

  const ratingOverlay = (
    <RatingOverlay
      active={ratingActive}
      ratings={video.ratings}
    />
  );

  const titleDisplay = (
    <TitleDisplay
      className={styles.titleWrapper}
      subtitle={seriesTitle ? title : ''}
      subtitleClassName={styles.subtitle}
      title={seriesTitle || title}
      titleClassName={styles.title}
      ratingOverlay={ratingOverlay}
      showTitle={active}
    />
  );

  const showPIPButton = !isAd && isPictureInPictureSupported();

  if (isFloating) {
    return (
      <FloatingPlayerOverlay
        active={active}
        video={video}
        isMuted={isMuted}
        handleClickFullscreen={handleClickFullscreen}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        volume={volume}
        play={explicitPlay}
        pause={explicitPause}
        handleClickVolume={handleClickVolume}
        updateVolume={updateVolume}
        showVolumeRange={showVolumeRange}
      />
    );
  }

  return (
    <div
      className={playerOverlayClass}
      onClick={isMobile ? undefined : onClick}
      onDoubleClick={isMobile ? undefined : onDoubleClick}
      onMouseMove={isMobile ? undefined : onMouseMove}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
      onTouchCancel={isMobile ? onTouchCancel : undefined}
      ref={playerOverlayRef}
      data-test-id="web-player-overlay"
    >
      {!hasPlaybackStarted
        && <div className={styles.centeredPlayButtonContainer}>
          <PlayButtonEmpty className={styles.playButton} onClick={isMobile ? onClick as () => void : undefined} />
        </div>
      }
      <TransitionGroup
        component="div"
        className={titleAreaClasses}
      >
        <CSSTransition
          key="title"
          timeout={OVERLAY_TRANSITION_DURATION_MILLISECONDS}
          classNames={fadeInOut}
          nodeRef={titleRowRef}
        >
          <div ref={titleRowRef} className={styles.titleRow}>
            {titleDisplay}
            {castApiAvailable ? <ChromecastButton placement="bottom" /> : null}
          </div>
        </CSSTransition>
      </TransitionGroup>

      {showSpinner ? (
        <Spinner className={styles.spinner} />
      ) : null}

      {shouldEnablePauseQrCode && <PauseQrCode autoplayVisible={!!autoplayVisible} video={video} />}

      {/* lowerArea wraps the ad message, autoplay, and controls */}
      <TransitionGroup
        component="div"
        className={bottomSectionClasses}
        data-test-id="web-player-overlay-bottom-section"
      >
        <CSSTransition
          key="message"
          classNames={fadeInOut}
          timeout={OVERLAY_TRANSITION_DURATION_MILLISECONDS}
          nodeRef={bottomMessageRef}
        >
          <div ref={bottomMessageRef} className={styles.bottomMessage}>
            {isAd ? (
              <div key="adMessage" className={styles.adGradient}>
                <AdMessageWrapper containerClassName={styles.adMessage} refreshVariant={AdPlayerUIRefreshVariant.Default} />
              </div>
            ) : null}
            {autoplayVisible ? (
              <AutoPlay
                key="autoplay"
                id={video.id}
                isEpisode={!!video.series_id}
                videoPaused={shouldPauseAutoPlay}
                isFromAutoplay={isFromAutoplay}
                isCounterEnabled={isAutoPlayCounterEnabled}
              />
            ) : null}
          </div>
        </CSSTransition>
        {renderControls ? (
          <CSSTransition
            key="control"
            classNames={fadeInOut}
            timeout={OVERLAY_TRANSITION_DURATION_MILLISECONDS}
            nodeRef={controlAreaRef}
          >
            <div ref={controlAreaRef} className={styles.controlArea}>
              <ProgressBar
                seek={seek}
                thumbnailSprites={thumbnailSprites}
                adBreaks={adBreaks}
              />
              <PlayerControls
                volume={volume}
                isMuted={isMuted}
                setCaptions={setCaptions}
                toggleVolumeMute={toggleVolumeMute}
                setVolume={setVolume}
                setQuality={setQuality}
                requestFullscreen={requestFullscreen}
                play={explicitPlay}
                pause={explicitPause}
                stepRewind={stepRewind}
                stepForward={stepForward}
                basicCaptionSettings={basicCaptionSettings}
                containerRef={playerOverlayRef}
                handleCaptionSettingsToggle={handleCaptionSettingsToggle}
                handleQualitySettingsToggle={handleQualitySettingsToggle}
                captionsSettingsVisible={captionSettingsVisible}
                qualitySettingsVisible={qualitySettingsVisible}
                getAudioTracks={getAudioTracks}
                setAudioTrack={setAudioTrack}
                getCurrentAudioTrack={getCurrentAudioTrack}
                showPIPButton={showPIPButton}
                pipEnabled={pipEnabled}
                togglePictureInPicture={togglePictureInPicture}
                handleClickFullscreen={handleClickFullscreen}
                handleClickVolume={handleClickVolume}
                updateVolume={updateVolume}
                makeVolumeRangeVisible={makeVolumeRangeVisible}
                makeVolumeRangeInvisible={makeVolumeRangeInvisible}
                showVolumeRange={showVolumeRange}
                handleAdvancedSettingsClick={handleAdvancedSettingsClick}
              />
            </div>
          </CSSTransition>
        ) : null}
      </TransitionGroup>
    </div>
  );
};

export default WebPlayerOverlay;
