import type { AudioTrackInfo, Captions, Player, QualityLevel } from '@adrise/player';
import { State as PLAYER_STATES, PLAYER_EVENTS, controlActions } from '@adrise/player';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { ActionStatus, ToggleState, VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import { Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import throttle from 'lodash/throttle';
import type { MutableRefObject, RefObject } from 'react';
import React, { useEffect, useRef, useState, Component } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { toggleTransportControl, setTheaterMode } from 'common/actions/ui';
import PlayButtonEmpty from 'common/components/uilib/PlayButtonEmpty/PlayButtonEmpty';
import RatingOverlay from 'common/components/uilib/RatingOverlay/RatingOverlay';
import TitleDisplay from 'common/components/uilib/TitleDisplay/TitleDisplay';
import * as eventTypes from 'common/constants/event-types';
import { webKeys } from 'common/constants/key-map';
import PlayerWebTheaterMode, { PLAYER_WEB_THEATER_MODE_VALUE } from 'common/experiments/config/playerWebTheaterMode';
import WebQrReferralsPausescreen from 'common/experiments/config/webQrReferralsPausescreen';
import WebVODPlayerPip from 'common/experiments/config/webVODPlayerPip';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import AdMessageWrapper from 'common/features/playback/components/AdMessageWrapper/AdMessageWrapper';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { captionsIndexSelector, captionsListSelector, playerStateSelector, positionSelector } from 'common/selectors/playerStore';
import { isFullscreenSelector, isInTheaterModeSelector, isKidsModeSelector } from 'common/selectors/ui';
import { thumbnailSpritesByContentIdSelector } from 'common/selectors/video';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { ThumbnailSprites, Video } from 'common/types/video';
import { buildDialogEvent,
  buildQualityToggleEventObject,
  buildSubtitlesToggleEventObject,
} from 'common/utils/analytics';
import { getLanguageCode } from 'common/utils/captionTools';
import {
  addEventListener,
  removeEventListener,
} from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { isDownSwipe } from 'common/utils/mobile';
import { isPictureInPictureSupported } from 'common/utils/pictureInPicture';
import { getVideoResolutionType } from 'common/utils/qualityLevels';
import { trackEvent } from 'common/utils/track';
import AutoPlay from 'web/features/playback/components/AutoPlay/AutoPlay';
import ProgressBar from 'web/features/playback/components/ProgressBar/ProgressBar';
import { useDetectPlaybackStart } from 'web/features/playback/components/WebPlayerOverlay/hooks/useDetectPlaybackStart';
import { OVERLAY_TRANSITION_DURATION_MILLISECONDS, useOverlayTimer } from 'web/features/playback/components/WebPlayerOverlay/hooks/useOverlayTimer';
import { usePlayAndPauseHandlers } from 'web/features/playback/components/WebPlayerOverlay/hooks/usePlayAndPauseHandlers';
import PauseQrCode from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/PauseQrCode';
import { useFullscreenHandler } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useFullscreenHandler';
import type { WebSeekFn, WebStepSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { useSeekHandlers } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { useTheaterModeHandler } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useTheaterModeHandler';
import { castApiAvailableSelector, castReceiverStateSelector } from 'web/features/playback/selectors/chromecast';
import { durationSelector, isAdSelector, isBufferingSelector, isMutedSelector, qualityListSelector } from 'web/features/playback/selectors/player';
import { isWebkitIPadSelector, isWebkitIPhoneSelector, renderControlsSelector } from 'web/features/playback/selectors/ui';
import type { ChromecastState } from 'web/features/playback/types/chromecast';

import ChromecastButton from './PlayerControls/ChromecastButton/ChromecastButton';
import type { PlayerControlsProps } from './PlayerControls/PlayerControls';
import PlayerControls from './PlayerControls/PlayerControls';
import styles from './WebPlayerOverlay.scss';

const RATING_SHOWN_DURATION_MILLISECONDS = 15000;
const SHOWN_RATING_IN_PLAY_DURATION_MILLISECONDS = 3600000;
const fadeInOut = {
  enter: styles.fadeEnter,
  enterActive: styles.fadeEnterActive,
  exit: styles.fadeLeave,
  exitActive: styles.fadeLeaveActive,
};

export interface WebPlayerOverlayProps {
  video: Video;
  className?: string;
  requestFullscreen: (value: boolean) => void;
  showAutoPlay?: boolean;
  isMobile: boolean;
  title: string;
  seriesTitle?: string;
  isFromAutoplay: boolean;
  basicCaptionSettings: PlayerControlsProps['basicCaptionSettings'];
  backUrl?: string;
  adBreaks?: number[];
  getAudioTracks: () => AudioTrackInfo[] | undefined;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  isFullscreen: boolean;
  player: InstanceType<typeof Player> | null;
  pipEnabled: boolean;
  togglePictureInPicture: (e: React.MouseEvent) => void;
}

interface TouchInfo {
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  vertical?: boolean;
  isSwipeDown?: boolean;
}

interface WebPlayerOverlayPropsFromFnComponent {
  castReceiverState: ChromecastState['castReceiverState'];
  castApiAvailable: boolean;
  thumbnailSprites: Partial<ThumbnailSprites>;
  renderControls: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  playerWebPip: ReturnType<typeof WebVODPlayerPip>;
  playerWebTheaterMode: ReturnType<typeof PlayerWebTheaterMode>;
  dispatch: TubiThunkDispatch;
  isAd: boolean;
  playerState: PLAYER_STATES;
  position: number;
  duration: number;
  isBuffering: boolean;
  isMuted: boolean;
  captionsList: Captions[];
  captionsIndex: number;
  qualityList: QualityLevel[];
  isTheater: boolean;
  shouldEnablePauseQrCode: boolean;

  // STATE
  active: boolean;
  ratingActive: boolean;
  setRatingActive: (value: boolean) => void;
  hasPlaybackStarted: boolean;
  isShowingOverlayOnStartPlayback: boolean;
  allowRatingDisplayStart: boolean;
  setAllowRatingDisplayStart: (value: boolean) => void;
  captionSettingsVisible: boolean;
  setCaptionSettingsVisible: (value: boolean) => void;
  qualitySettingsVisible: boolean;
  setQualitySettingsVisible: (value: boolean) => void;
  isPortraitMode: boolean;
  setIsPortraitMode: (value: boolean) => void;

  // REFS
  hideRatingActiveTimerRef: MutableRefObject<number | undefined>;
  showRatingDuringPlaybackTimerRef: MutableRefObject<number | undefined>;
  setInactiveTimerRef: MutableRefObject<number | undefined>;
  touchInfoRef: MutableRefObject<TouchInfo | undefined>;
  playerOverlayRef: RefObject<HTMLDivElement>;
  pipPromiseRef: MutableRefObject<Promise<PictureInPictureWindow | void> | undefined>;
  titleRowRef: RefObject<HTMLDivElement>;
  bottomMessageRef: RefObject<HTMLDivElement>;
  controlAreaRef: RefObject<HTMLDivElement>;
  mediaQueryRef: MutableRefObject<MediaQueryList | undefined>;
  // latch to ensure we only invoke afterPlayerCreate once
  haveCalledAfterPlayerCreateRef: MutableRefObject<boolean>;

  // FUNCTIONS
  refreshActiveTimer: () => void;
  setInactive: () => void;
  showOverlayOnStartPlayback: () => void;
  cancelOverlayTimer: () => void;
  play: (explicit: boolean) => Promise<void>;
  explicitPlay: () => Promise<void>;
  pause: (explicit: boolean) => Promise<void>;
  explicitPause: () => Promise<void>;
  seek: WebSeekFn;
  stepForward: WebStepSeekFn;
  stepRewind: WebStepSeekFn;
  handleClickFullscreen: (e?: React.MouseEvent) => void;
  handleClickTheater: (e: React.MouseEvent) => void;
}

export type WebPlayerOverlayClassComponentProps = WebPlayerOverlayProps & WebPlayerOverlayPropsFromFnComponent;

/**
 * todo(Liam / Tim) remove `isMobile` checks and create a MobilePlayerOverlay component
 */
class WebPlayerOverlayClassComponent extends Component<
  WebPlayerOverlayClassComponentProps
> {

  constructor(props: WebPlayerOverlayClassComponentProps) {
    super(props);

    // Dom handlers
    this.onMouseMove = throttle(this.onMouseMove, 50);
    this._hotKeyHandler = this._hotKeyHandler.bind(this);
    this._hotKeyHandler = throttle(this._hotKeyHandler, 50);
    this.onClick = this.onClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);

    // in order to test these methods, they must be class properties, not instance properties. so we must bind `this` in constructor
    this.setVolume = this.setVolume.bind(this);
    this.setCaptions = this.setCaptions.bind(this);
    this.setQuality = this.setQuality.bind(this);
  }

  componentDidMount() {
    const { isIPhone, isIPad, player, isMobile, playerWebPip, setIsPortraitMode } = this.props;
    addEventListener(window, 'keydown', this._hotKeyHandler);
    if (isIPhone || isIPad) {
      this.props.mediaQueryRef.current = window.matchMedia('(orientation: portrait)');
      addEventListener(this.props.mediaQueryRef.current, 'change', this.handleOrientationChange);
      setIsPortraitMode(this.props.mediaQueryRef.current.matches);
    }

    // Sometimes the player already is set on first render
    // in which case we can invoke this immediately. Other times, it must be
    // invoked when this component updates
    if (player) this.afterPlayerCreate(player);

    if (!isMobile && isPictureInPictureSupported()) {
      playerWebPip.logExposure();
    }
  }

  componentDidUpdate(prevProps: WebPlayerOverlayClassComponentProps) {
    // when player goes from null to not-null
    if (this.props.player && !prevProps.player) this.afterPlayerCreate(this.props.player);

    // when player goes from not-null to null (should not happen as of this commit)
    if (!this.props.player && prevProps.player) {
      this.props.haveCalledAfterPlayerCreateRef.current = false;
    }
  }

  componentWillUnmount() {
    clearTimeout(this.props.setInactiveTimerRef.current);
    clearTimeout(this.props.hideRatingActiveTimerRef.current);
    clearInterval(this.props.showRatingDuringPlaybackTimerRef.current);
    removeEventListener(window, 'keydown', this._hotKeyHandler);
    removeEventListener(this.props.mediaQueryRef.current, 'change', this.handleOrientationChange);

    const player = this.props.player;
    if (player) {
      player.off(PLAYER_EVENTS.play, this.showRatingOverlay);
      player.off(PLAYER_EVENTS.adStart, this.onAdStart);
      player.off(PLAYER_EVENTS.adComplete, this.allowRatingDisplay);
    }
  }

  afterPlayerCreate(player: Player) {
    if (this.props.haveCalledAfterPlayerCreateRef.current) return;
    this.props.haveCalledAfterPlayerCreateRef.current = true;
    // set up listeners
    player.on(PLAYER_EVENTS.play, this.showRatingOverlay);
    player.on(PLAYER_EVENTS.adStart, this.onAdStart);
    player.on(PLAYER_EVENTS.adComplete, this.allowRatingDisplay);
  }

  handleOrientationChange = (event: MediaQueryListEvent) => {
    if (event.matches !== undefined) {
      this.props.setIsPortraitMode(event.matches);
    }
  };

  setRatingShowInPlayTimer() {
    if (this.props.showRatingDuringPlaybackTimerRef.current) {
      clearTimeout(this.props.showRatingDuringPlaybackTimerRef.current);
    }

    this.props.showRatingDuringPlaybackTimerRef.current = window.setTimeout(() => {
      this.allowRatingDisplay();
      this.showRatingOverlay();
    }, SHOWN_RATING_IN_PLAY_DURATION_MILLISECONDS);
  }

  onAdStart = () => {
    this.props.setRatingActive(false);
  };

  allowRatingDisplay = () => {
    this.props.setAllowRatingDisplayStart(true);
  };

  /**
   * The RatingOverlay will show at some cases:
   * 1. When Video is first play (skip pre-roll Ad)
   * 2. After an Ad is finished
   * 3. An hour later since the last RatingOverlay show (skip pause state and Ad)
   *
   * allowRatingDisplay will filter out invocations on invalid play events
   */
  showRatingOverlay = () => {
    if (!this.props.allowRatingDisplayStart) return;

    if (this.props.isAd) return;

    if (![PLAYER_STATES.playing, PLAYER_STATES.inited].includes(this.props.playerState)) return;

    this.props.setRatingActive(true);
    this.props.setAllowRatingDisplayStart(false);

    if (this.props.hideRatingActiveTimerRef.current) {
      clearTimeout(this.props.hideRatingActiveTimerRef.current);
    }

    this.props.hideRatingActiveTimerRef.current = window.setTimeout(() => {
      this.props.setRatingActive(false);
      this.setRatingShowInPlayTimer();
    }, RATING_SHOWN_DURATION_MILLISECONDS);
  };

  setVolume(data: { volume?: number, isMuted?: boolean }) {
    this.props.refreshActiveTimer();
    return this.props.dispatch(controlActions.setVolume(data));
  }

  setCaptions(index: number) {
    const { dispatch, video = { id: '' } } = this.props;
    return dispatch(controlActions.setCaptions(index))
      .then(() => {
        this.props.refreshActiveTimer();
        // may have changed, do not declare these variables in upper scope
        const { captionsList = [], captionsIndex } = this.props;
        const activeCaption = captionsList[captionsIndex];
        const status = activeCaption.label.toLowerCase() === 'off' ? ToggleState.OFF : ToggleState.ON;
        const languageCode = getLanguageCode(activeCaption?.lang || '');
        const subtitlesToggleEventPayload = buildSubtitlesToggleEventObject(video.id, status, languageCode);
        trackEvent(eventTypes.SUBTITLES_TOGGLE, subtitlesToggleEventPayload);
      });
  }

  setQuality(qualityIndex: number) {
    const { dispatch, video, qualityList, player } = this.props;
    return dispatch(controlActions.setQuality(qualityIndex))
      .then(() => {
        const level = qualityList[qualityIndex];
        if (!level) return;
        this.props.refreshActiveTimer();

        const videoResolutionType = getVideoResolutionType(level);
        /**
         * If the user is on auto, we should track the current bitrate level if available
         */
        let bitrate: number | undefined = level.bitrate;
        if (videoResolutionType === VideoResolutionType.VIDEO_RESOLUTION_AUTO || videoResolutionType === VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN) {
          bitrate = player?.getQualityLevel()?.bitrate;
        }
        const qualityToggleEventObject = buildQualityToggleEventObject(
          video.id,
          bitrate,
          getVideoResolutionType(level),
          ActionStatus.SUCCESS,
        );
        trackEvent(eventTypes.QUALITY_TOGGLE, qualityToggleEventObject);
      });
  }

  /**
   * space & 'k': play/pause
   * left & 'j': jump back 30s
   * right & 'l': jump forward 30s
   * 'm': toggle mute
   * 'f': toggle fullscreen
   * escape : exit full screen
   * 'c': cycle subtitles
   */
  _hotKeyHandler(e: KeyboardEvent) {
    const { keyCode, altKey, ctrlKey, metaKey, shiftKey } = e;
    // if some combination of special key, dont perform hotkey functions
    /* istanbul ignore next */
    if (
      altKey
      || ctrlKey
      || metaKey
      || shiftKey
      /**
       * activeElement could be `null`
       * https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
       */
      || (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input')
    ) {
      return;
    }

    const {
      requestFullscreen,
      isMuted,
      captionsList,
      captionsIndex,
      isAd,
      playerState,
    } = this.props;

    const { space, k, arrowLeft, j, arrowRight, l, m, f, c, escape, tab } = webKeys;

    // note the fallthroughs are intentional
    switch (keyCode) {
      case space:
        e.preventDefault();
      // falls through
      case k:
        if (playerState === PLAYER_STATES.paused) {
          this.props.play(true);
        } else {
          this.props.pause(true);
        }
        break;
      case arrowLeft:
        if (isAd) break;
        this.props.stepRewind('KEYBOARD_ARROW' as const);
        break;
      case j:
        if (isAd) break;
        this.props.stepRewind('KEYBOARD_LETTER' as const);
        break;
      case arrowRight:
        if (isAd) break;
        this.props.stepForward('KEYBOARD_ARROW' as const);
        break;
      case l:
        if (isAd) break;
        this.props.stepForward('KEYBOARD_LETTER' as const);
        break;
      case m:
        const mutePlayer = !isMuted;
        this.setVolume({ isMuted: mutePlayer });
        break;
      case f:
        // toggle fullscreen
        requestFullscreen(!this.props.isFullscreen);
        break;
      case escape:
        if (this.props.isFullscreen) requestFullscreen(false);
        break;
      case c:
        if (isAd) break;
        const newIndex = captionsIndex + 1 >= captionsList.length ? 0 : captionsIndex + 1;
        this.setCaptions(newIndex);
        break;
      case tab:
        this.props.refreshActiveTimer();
        break;
      default:
        break;
    }
  }

  updateVolume = (value: number) => {
    this.setVolume({ volume: value });
  };

  toggleVolumeMute = () => {
    const { dispatch, isMuted } = this.props;
    dispatch(
      controlActions.setVolume({ isMuted: !isMuted }),
    );
  };

  togglePlay = () => {
    const {
      playerState,
    } = this.props;
    if (playerState === PLAYER_STATES.playing) {
      this.props.explicitPause();
    } else {
      this.props.explicitPlay();
    }
  };

  /**
   * do not interfere with ads
   * note- there are other click handler in TransportControls that will stop propagation earlier than this handler
   * @param e
   */
  onClick(e: React.MouseEvent) {
    const { dispatch } = this.props;
    dispatch(toggleTransportControl(true));
    if (this.props.isAd) return;
    if (this.props.captionSettingsVisible) {
      this.props.setCaptionSettingsVisible(false);
      return;
    }
    if (this.props.qualitySettingsVisible) {
      this.props.setQualitySettingsVisible(false);
      return;
    }
    // note- we disable pointer-events with css for now. we can improve this by properly bubbling this event to the ad div
    e.stopPropagation();
    this.togglePlay();
  }

  onDoubleClick(e: React.MouseEvent) {
    const isClickingOnChildComponent = e.target !== this.props.playerOverlayRef.current;
    if (isClickingOnChildComponent) return;
    this.props.requestFullscreen(!this.props.isFullscreen);
  }

  /**
   * refresh active timer
   * refresh cursor timer
   */
  onMouseMove = () => {
    this.props.refreshActiveTimer();
  };

  /**
   * clear remaining interval and hide UI after a short timeout
   */
  onMouseLeave = () => {
    if (this.props.playerState !== PLAYER_STATES.playing || this.props.isShowingOverlayOnStartPlayback
      || this.props.captionSettingsVisible || this.props.qualitySettingsVisible) return;

    this.props.cancelOverlayTimer();
    this.props.setInactiveTimerRef.current = window.setTimeout(this.props.setInactive, 500);
  };

  // todo- extract touch events into new MobilePlayerOverlay component
  onTouchStart = (event: React.TouchEvent) => {
    // type guard
    /* istanbul ignore next */
    if (!event.touches) return;

    const touch = event.touches[0];

    this.props.touchInfoRef.current = {
      startX: touch.pageX,
      startY: touch.pageY,
    };
  };

  onTouchMove = (event: React.TouchEvent) => {
    // type guard
    /* istanbul ignore next */
    if (!this.props.touchInfoRef.current) return;
    const { startX = -1, startY = -1 } = this.props.touchInfoRef.current;
    if (startX < 0 || startY < 0) return;
    const { pageX: endX, pageY: endY } = event.touches[0];

    const isSwipeDown = isDownSwipe({ startX, endX, startY, endY });
    this.props.touchInfoRef.current = {
      ...this.props.touchInfoRef.current,
      endX,
      endY,
      isSwipeDown,
    };
    // downward motion could indicate an in-progress swipe to close
    // the player controls, so we don't want to refresh the active timer
    if (!isSwipeDown) this.props.refreshActiveTimer();
  };

  onTouchEnd = () => this.handleSwipe();

  onTouchCancel = () => this.handleSwipe();

  handleCaptionSettingsToggle = (visible: boolean) => {
    this.props.setCaptionSettingsVisible(visible);
    if (visible) {
      const dialogEvent = buildDialogEvent(getCurrentPathname(), DialogType.SUBTITLE_AUDIO, '', DialogAction.SHOW);
      trackEvent(eventTypes.DIALOG, dialogEvent);
    }
    this.props.refreshActiveTimer();
  };

  handleQualitySettingsToggle = (visible: boolean) => {
    this.props.setQualitySettingsVisible(visible);
    this.props.refreshActiveTimer();
    if (visible) {
      trackEvent(
        eventTypes.DIALOG,
        buildDialogEvent(
          getCurrentPathname(),
          DialogType.VIDEO_QUALITY,
          undefined,
          DialogAction.SHOW,
        ),
      );
    }
  };

  handleSwipe = () => {
    const { isSwipeDown } = this.props.touchInfoRef.current ?? {};

    // When the overlay is open, down swipes close it. When the overlay is not
    // open, swipes in any direction open it.
    if (!isSwipeDown || !this.props.active) {
      // swiping any direction but down
      this.props.refreshActiveTimer();
    } else {
      // swiping down
      this.props.setInactive();
    }

    // reset
    this.props.touchInfoRef.current = {};
  };

  render() {
    const {
      video,
      requestFullscreen,
      showAutoPlay,
      className,
      isMobile,
      castApiAvailable,
      title,
      seriesTitle,
      thumbnailSprites,
      position,
      duration,
      isBuffering,
      playerState,
      isFromAutoplay,
      basicCaptionSettings,
      castReceiverState,
      adBreaks,
      playerWebPip,
      playerWebTheaterMode,
      active,
      ratingActive,
      hasPlaybackStarted,
      isShowingOverlayOnStartPlayback,
      captionSettingsVisible,
      qualitySettingsVisible,
      isAd,
      isTheater,
      handleClickFullscreen,
      handleClickTheater,
      shouldEnablePauseQrCode,
    } = this.props;

    // This mode exists because on iPhones in vertical the player UI elements
    // too large to fit on screen, so some elements get hidden.
    const compactUiMode = this.props.isIPhone && this.props.isPortraitMode && !this.props.isFullscreen;

    // on iPhones in portrait, we don't show controls until user has started playback
    // as they will overlap the big play button
    const renderControls = this.props.renderControls && (compactUiMode ? this.props.hasPlaybackStarted : true);

    // the desktop autoplay UI is too big to fit on iPhones in any orientation, and also doesn't fit
    // on iPads in portrait
    const compactAutoplayUiMode = (this.props.isIPhone || (this.props.isIPad && this.props.isPortraitMode));

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
      className,
    );

    const bottomSectionClasses = classNames(styles.lowerArea, {
      [styles.active]: active,
      [styles.isAd]: isAd,
      [styles.autoplayVisible]: autoplayVisible,
      [styles.compactUiMode]: compactUiMode,
    });

    const titleAreaClasses = classNames(styles.titleArea, {
      [styles.topActive]: active || ratingActive,
    });

    const showRating = !compactUiMode;
    const ratingOverlay = showRating ? (
      <RatingOverlay
        active={ratingActive}
        ratings={video.ratings}
      />
    ) : undefined;

    const titleDisplay = !compactUiMode ? (
      <TitleDisplay
        className={styles.titleWrapper}
        subtitle={seriesTitle ? title : ''}
        subtitleClassName={styles.subtitle}
        title={seriesTitle || title}
        titleClassName={styles.title}
        ratingOverlay={ratingOverlay}
        showTitle={active && !compactUiMode}
      />
    ) : undefined;

    // The cast API available should be false on the server side
    // But we would better add a __server__ check for this
    // eslint-disable-next-line ssr-friendly/no-dom-globals-in-react-cc-render
    const castButtonAvailable = !__SERVER__ && castApiAvailable && castReceiverState !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE;
    const shouldInitShowCastTip = isShowingOverlayOnStartPlayback && castButtonAvailable;

    const showPIPButton = !isAd && isPictureInPictureSupported() && playerWebPip.getValue();
    const showTheaterButton = [PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_CLICK].includes(playerWebTheaterMode.getValue()) && !isMobile;

    return (
      <div
        className={playerOverlayClass}
        onClick={isMobile ? undefined : this.onClick}
        onDoubleClick={isMobile ? undefined : this.onDoubleClick}
        onMouseMove={isMobile ? undefined : this.onMouseMove}
        onMouseLeave={isMobile ? undefined : this.onMouseLeave}
        onTouchStart={isMobile ? this.onTouchStart : undefined}
        onTouchMove={isMobile ? this.onTouchMove : undefined}
        onTouchEnd={isMobile ? this.onTouchEnd : undefined}
        onTouchCancel={isMobile ? this.onTouchCancel : undefined}
        ref={this.props.playerOverlayRef}
        data-test-id="web-player-overlay"
      >
        {!hasPlaybackStarted
          && <div className={styles.centeredPlayButtonContainer}>
            <PlayButtonEmpty className={styles.playButton} onClick={isMobile ? this.onClick as () => void : undefined} />
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
            nodeRef={this.props.titleRowRef}
          >
            <div ref={this.props.titleRowRef} className={styles.titleRow}>
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
            nodeRef={this.props.bottomMessageRef}
          >
            <div ref={this.props.bottomMessageRef} className={styles.bottomMessage}>
              {isAd ? (
                <div key="adMessage" className={styles.adGradient}>
                  <AdMessageWrapper className={styles.adMessage} />
                </div>
              ) : null}
              {autoplayVisible ? (
                <AutoPlay
                  key="autoplay"
                  id={video.id}
                  isEpisode={!!video.series_id}
                  videoPaused={shouldPauseAutoPlay}
                  isFromAutoplay={isFromAutoplay}
                  compactAutoplayUiMode={compactAutoplayUiMode}
                />
              ) : null}
            </div>
          </CSSTransition>
          {renderControls ? (
            <CSSTransition
              key="control"
              classNames={fadeInOut}
              timeout={OVERLAY_TRANSITION_DURATION_MILLISECONDS}
              nodeRef={this.props.controlAreaRef}
            >
              <div ref={this.props.controlAreaRef} className={styles.controlArea}>
                <ProgressBar
                  seek={this.props.seek}
                  thumbnailSprites={thumbnailSprites}
                  adBreaks={adBreaks}
                  compactUiMode={compactUiMode}
                />
                <PlayerControls
                  setCaptions={this.setCaptions}
                  toggleVolumeMute={this.toggleVolumeMute}
                  updateVolume={this.updateVolume}
                  setQuality={this.setQuality}
                  requestFullscreen={requestFullscreen}
                  play={this.props.explicitPlay}
                  pause={this.props.explicitPause}
                  stepRewind={this.props.stepRewind}
                  stepForward={this.props.stepForward}
                  basicCaptionSettings={basicCaptionSettings}
                  shouldInitShowCastTip={shouldInitShowCastTip}
                  containerRef={this.props.playerOverlayRef}
                  handleCaptionSettingsToggle={this.handleCaptionSettingsToggle}
                  handleQualitySettingsToggle={this.handleQualitySettingsToggle}
                  captionsSettingsVisible={captionSettingsVisible}
                  qualitySettingsVisible={qualitySettingsVisible}
                  getAudioTracks={this.props.getAudioTracks}
                  setAudioTrack={this.props.setAudioTrack}
                  getCurrentAudioTrack={this.props.getCurrentAudioTrack}
                  isFullscreen={this.props.isFullscreen}
                  compactUiMode={compactUiMode}
                  showPIPButton={showPIPButton}
                  pipEnabled={this.props.pipEnabled}
                  togglePictureInPicture={this.props.togglePictureInPicture}
                  showTheaterButton={showTheaterButton}
                  isTheater={isTheater}
                  handleClickFullscreen={handleClickFullscreen}
                  handleClickTheater={handleClickTheater}
                />
              </div>
            </CSSTransition>
          ) : null}
        </TransitionGroup>
      </div>
    );
  }
}

const WebPlayerOverlay = (props: WebPlayerOverlayProps) => {
  const { video = { id: '' }, requestFullscreen } = props;

  const dispatch = useAppDispatch();
  const castReceiverState = useAppSelector(castReceiverStateSelector);
  const castApiAvailable = useAppSelector(castApiAvailableSelector);
  const thumbnailSprites = useAppSelector(state => thumbnailSpritesByContentIdSelector(state, props.video.id));
  const renderControls = useAppSelector(renderControlsSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);
  const isIPhone = useAppSelector(isWebkitIPhoneSelector);
  const isIPad = useAppSelector(isWebkitIPadSelector);
  const isAd = useAppSelector(isAdSelector);
  const playerState = useAppSelector(playerStateSelector);
  const position = useAppSelector(positionSelector);
  const duration = useAppSelector(durationSelector);
  const isBuffering = useAppSelector(isBufferingSelector);
  const isMuted = useAppSelector(isMutedSelector);
  const captionsList = useAppSelector(captionsListSelector);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const qualityList = useAppSelector(qualityListSelector);
  const isTheater = useAppSelector(isInTheaterModeSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isGDPREnabled = useAppSelector(isGDPREnabledSelector);

  // EXPERIMENTS
  const playerWebPip = useExperiment(WebVODPlayerPip);
  const playerWebTheaterMode = useExperiment(PlayerWebTheaterMode);
  const webQrReferralsPausescreen = useExperiment(WebQrReferralsPausescreen);
  const shouldEnablePauseQrCode = !isGDPREnabled && !isKidsModeEnabled && webQrReferralsPausescreen.getValue();
  useEffect(() => {
    if (playerState === 'paused' && !isAd) webQrReferralsPausescreen.logExposure();
  }, [playerState, isAd, webQrReferralsPausescreen]);

  // STATE
  const [ratingActive, setRatingActive] = useState(false);
  const [allowRatingDisplayStart, setAllowRatingDisplayStart] = useState(true);
  const [captionSettingsVisible, setCaptionSettingsVisible] = useState(false);
  const [qualitySettingsVisible, setQualitySettingsVisible] = useState(false);
  const [isPortraitMode, setIsPortraitMode] = useState(false);

  // REFS
  const hideRatingActiveTimerRef = useRef<number>();
  const showRatingDuringPlaybackTimerRef = useRef<number>();
  const setInactiveTimerRef = useRef<number>();
  const touchInfoRef = useRef<TouchInfo>();
  const playerOverlayRef = useRef<HTMLDivElement>(null);
  const pipPromiseRef = useRef<Promise<PictureInPictureWindow | void>>();
  const titleRowRef = useRef<HTMLDivElement>(null);
  const bottomMessageRef = useRef<HTMLDivElement>(null);
  const controlAreaRef = useRef<HTMLDivElement>(null);
  const mediaQueryRef = useRef<MediaQueryList>();
  const haveCalledAfterPlayerCreateRef = useRef(false);

  // CUSTOM HOOKS
  const { hasPlaybackStarted } = useDetectPlaybackStart();
  const {
    active,
    setInactive,
    refreshActiveTimer,
    isShowingOverlayOnStartPlayback,
    showOverlayOnStartPlayback,
    cancelOverlayTimer,
  } = useOverlayTimer({ captionSettingsVisible, qualitySettingsVisible });

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

  const toggleFullscreen = () => {
    requestFullscreen(!isFullscreen);
  };

  const toggleTheaterMode = () => {
    dispatch(setTheaterMode(!isTheater));
  };

  const { handleClickTheater } = useTheaterModeHandler({
    toggleFullscreen,
    toggleTheaterMode,
    isFullscreen,
    isTheater,
  });

  const { handleClickFullscreen } = useFullscreenHandler({
    toggleFullscreen,
    toggleTheaterMode,
    isFullscreen,
    isTheater,
  });

  return <WebPlayerOverlayClassComponent
    {...props}
    dispatch={dispatch}
    castReceiverState={castReceiverState}
    castApiAvailable={castApiAvailable}
    thumbnailSprites={thumbnailSprites}
    renderControls={renderControls}
    isFullscreen={isFullscreen}
    isIPhone={isIPhone}
    isIPad={isIPad}
    playerWebPip={playerWebPip}
    playerWebTheaterMode={playerWebTheaterMode}
    active={active}
    ratingActive={ratingActive}
    setRatingActive={setRatingActive}
    hasPlaybackStarted={hasPlaybackStarted}
    isShowingOverlayOnStartPlayback={isShowingOverlayOnStartPlayback}
    allowRatingDisplayStart={allowRatingDisplayStart}
    setAllowRatingDisplayStart={setAllowRatingDisplayStart}
    captionSettingsVisible={captionSettingsVisible}
    setCaptionSettingsVisible={setCaptionSettingsVisible}
    qualitySettingsVisible={qualitySettingsVisible}
    setQualitySettingsVisible={setQualitySettingsVisible}
    isPortraitMode={isPortraitMode}
    setIsPortraitMode={setIsPortraitMode}
    cancelOverlayTimer={cancelOverlayTimer}
    hideRatingActiveTimerRef={hideRatingActiveTimerRef}
    showRatingDuringPlaybackTimerRef={showRatingDuringPlaybackTimerRef}
    setInactiveTimerRef={setInactiveTimerRef}
    touchInfoRef={touchInfoRef}
    playerOverlayRef={playerOverlayRef}
    pipPromiseRef={pipPromiseRef}
    titleRowRef={titleRowRef}
    bottomMessageRef={bottomMessageRef}
    controlAreaRef={controlAreaRef}
    mediaQueryRef={mediaQueryRef}
    haveCalledAfterPlayerCreateRef={haveCalledAfterPlayerCreateRef}
    isAd={isAd}
    playerState={playerState}
    position={position}
    duration={duration}
    isBuffering={isBuffering}
    isMuted={isMuted}
    captionsList={captionsList}
    captionsIndex={captionsIndex}
    refreshActiveTimer={refreshActiveTimer}
    setInactive={setInactive}
    showOverlayOnStartPlayback={showOverlayOnStartPlayback}
    qualityList={qualityList}
    play={play}
    explicitPlay={explicitPlay}
    pause={pause}
    explicitPause={explicitPause}
    seek={seek}
    stepForward={stepForward}
    stepRewind={stepRewind}
    isTheater={isTheater}
    handleClickTheater={handleClickTheater}
    handleClickFullscreen={handleClickFullscreen}
    shouldEnablePauseQrCode={shouldEnablePauseQrCode}
  />;
};

export default WebPlayerOverlay;
