import { updateVolume, PLAYER_STORAGE_MUTE, PLAYER_STORAGE_VOLUME } from '@adrise/player';
import type { Captions } from '@adrise/player';
import { toCSSUrl } from '@adrise/utils/lib/url';
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { CloseStroke, Grid, Info, PictureInPictureClose24, PictureInPictureOpen24, ScaleUp } from '@tubitv/icons';
import { IconButton, Label, Spinner } from '@tubitv/web-ui';
import classnames from 'classnames';
import throttle from 'lodash/throttle';
import type { FC, RefObject } from 'react';
import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { connect, useSelector } from 'react-redux';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import * as localStorageTools from 'client/utils/localDataStorage';
import { setFullscreen as setFullscreenAction, toggleProgramDetailsModal } from 'common/actions/ui';
import {
  getLocalCaptions,
  loadWebCustomCaptions,
  setBasicCaptionSetting,
  toggleWebCaptions,
} from 'common/actions/webCaptionSettings';
import LinearProgramTimeRemaining from 'common/components/LinearProgramTimeRemaining/LinearTimeProgramRemaining';
import ChromecastIcon from 'common/components/uilib/ChromecastIcon/ChromecastIcon';
import PlayButtonEmpty from 'common/components/uilib/PlayButtonEmpty/PlayButtonEmpty';
import CloseX from 'common/components/uilib/SvgLibrary/CloseX';
import Fullscreen from 'common/components/uilib/SvgLibrary/FullscreenV2';
import LiveStreaming from 'common/components/uilib/SvgLibrary/LiveStreaming';
import {
  CC_OFF,
  FULLSCREEN_CHANGE_EVENTS,
  PLAYER_CONTROL_FIRST_SHOW_TIMEOUT,
  PLAYER_CURSOR_IDLE_TIMEOUT,
} from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import WebLinearPlayerPip from 'common/experiments/config/webLinearPlayerPip';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import useExposureLogger from 'common/hooks/useExposureLogger';
import * as epgSelectors from 'common/selectors/epg';
import { liveVideoSelector } from 'common/selectors/webLive';
import trackingManager from 'common/services/TrackingManager';
import type StoreState from 'common/types/storeState';
import { buildComponentInteractionEvent, buildFullscreenToggleEventObject } from 'common/utils/analytics';
import {
  addEventListener,
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  removeEventListener,
} from 'common/utils/dom';
import { generateProgramKey } from 'common/utils/epg';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { isPictureInPictureSupported } from 'common/utils/pictureInPicture';
import { trackEvent } from 'common/utils/track';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { WEB_FONT_SIZE_OPTIONS_ARRAY, WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY } from 'web/constants/captionSettings';
import type { AudioSubtitleControlsProps } from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import ClosedCaptionsControl from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import Volume from 'web/features/playback/components/Volume/Volume';
import WebLiveChannelGuide from 'web/features/playback/components/WebLiveChannelGuide/WebLiveChannelGuide';
import type { WebPlayerViewMode } from 'web/features/playback/components/WebLivePlayer/WebLivePlayer';
import livePlayerStyles from 'web/features/playback/containers/LivePlayer/LivePlayer.scss';
import type { ChromecastState } from 'web/features/playback/types/chromecast';
import { useEpgActiveChannelAndProgram } from 'web/hooks/useEPG';

import styles from './WebLivePlayerOverlay.scss';
import { usePip } from '../WebPlayer/hooks/usePip';

const messages = defineMessages({
  live: {
    description: 'Text on live news icon',
    defaultMessage: 'Live',
  },
  cc_off: {
    description: 'text for option to disable closed captions in the CC menu',
    defaultMessage: 'Off',
  },
  cc: {
    description: 'closed captioning icon label text',
    defaultMessage: 'Closed Captions',
  },
  closeFullscreen: {
    description: 'close fullscreen icon label text',
    defaultMessage: 'Close Fullscreen',
  },
  goFullscreen: {
    description: 'go fullscreen icon label text',
    defaultMessage: 'Go Fullscreen',
  },
  cast: {
    description: 'cast to device icon label text',
    defaultMessage: 'Play on TV',
  },
  fullpage: {
    description: 'maximize video size icon label text',
    defaultMessage: 'Maximize',
  },
  channelGuide: {
    description: 'channel guide header text',
    defaultMessage: 'Channel Guide',
  },
  timeLeft: {
    description: 'The remaining time of the program, for example "1h 3m left"',
    defaultMessage: '{time} left',
  },
  tvGuide: {
    description: 'button link to go back to the tv/epg guide',
    defaultMessage: 'TV Guide',
  },
  pictureInPicture: {
    description: 'picture in picture text',
    defaultMessage: 'Picture In Picture',
  },
  English: {
    description: 'Captions in English',
    defaultMessage: 'English',
  },
  Spanish: {
    description: 'Captions in Spanish',
    defaultMessage: 'Spanish',
  },
  Espanol: {
    description: 'Captions in Spanish',
    defaultMessage: 'Spanish',
  },
  UnknownLang: {
    description: 'Captions in Unknown language',
    defaultMessage: 'Unknown language',
  },
});

export interface WebLivePlayerOverlayProps {
  title: string;
  description: string;
  contentId: string;
  wrapper: LivePlayerWrapper | null;
  hasSubtitle: boolean;
  isMobile: boolean;
  containerRef: RefObject<HTMLDivElement>;
  castReceiverState: ChromecastState['castReceiverState'];
  castApiAvailable: boolean;
  playerView: WebPlayerViewMode;
  lang?: string;
}

// Live news subtitle currently only support english;
const DEFAULT_VOLUME = 30;
const TOGGLE_DELAY = 200;

export const getLanguageMessage = (lang: keyof typeof messages): MessageDescriptor => {
  let definedMessage = messages[lang];

  if (!definedMessage) {
    // avoid undefined language to break the formatMessage
    definedMessage = messages.UnknownLang;
  }
  return definedMessage;
};

export const getCaptionsHelper = (captions: Captions[], intl: IntlShape) => {
  const defaultOptions = [
    { label: intl.formatMessage(messages.cc_off), lang: CC_OFF, id: CC_OFF },
  ];
  if (captions.length) {
    return [...defaultOptions, ...captions];
  }
  return [];
};

const WebLivePlayerOverlay: FC<
  React.PropsWithChildren<WebLivePlayerOverlayProps> & ReturnType<typeof mapStateToProps>
> = ({
  title,
  description,
  contentId,
  wrapper,
  captions,
  hasSubtitle,
  loading,
  children,
  containerRef,
  volume: { isMuted, volume },
  isMobile,
  basicCaptionSettings,
  castApiAvailable,
  castReceiverState,
  playerView,
  canAutoplay,
  playerReady,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  const isEpgPlayerView = playerView !== 'default' && !fullscreen;
  const isWebEpgEnabled = useSelector(epgSelectors.isWebEpgEnabledSelector);

  const controlItemClass = classnames(styles.controlItem, isEpgPlayerView ? styles.epgControlItem : null);

  const [active, setActive] = useState(false);
  const defaultCaption = useSelector(
    (state: StoreState) => state.captionSettings.defaultCaptions
  );
  const [useMobileDesign, setUseMobileDesign] = useState(false);
  const [volumeExpand, setVolumeExpand] = useState(false);
  const [channelGuideIconActive, setChannelGuideIconActive] = useState(false);
  const [captionSettingsVisible, setCaptionSettingsVisible] = useState(false);

  const dispatch = useAppDispatch();
  const intl = useIntl();

  const hideActiveTimer = useRef<number>();

  const requestFullscreen = useCallback((fullscreen: boolean) => {
    if (!containerRef.current) {
      return;
    }
    const videoContainer = containerRef.current.querySelector(`.${styles.livePlayerArea}`) as HTMLElement | null;
    if (!videoContainer) {
      logger.warn(`Cannot find video container (.${styles.livePlayerArea}) to go fullscreen`);
      return;
    }
    if (fullscreen) {
      enterFullscreen(videoContainer);
    } else {
      exitFullscreen();
    }
    trackEvent(
      eventTypes.FULLSCREEN_TOGGLE,
      buildFullscreenToggleEventObject(
        contentId,
        fullscreen ? ToggleState.ON : ToggleState.OFF
      )
    );
  }, [contentId, containerRef]);

  const handleFullscreenChange = () => {
    const newFullscreen = !!getFullscreenElement();
    setFullscreen(newFullscreen);
    if (newFullscreen !== fullscreen) {
      setFullscreen(newFullscreen);
    }
  };

  const webLinearPlayerPip = useExperiment(WebLinearPlayerPip);
  const showPipButton = isPictureInPictureSupported() && webLinearPlayerPip.getValue();
  const { pipEnabled, togglePictureInPicture } = usePip({ contentId, player: wrapper });
  useExposureLogger(WebLinearPlayerPip, !isMobile && isPictureInPictureSupported());

  const onExitFullscreen = useCallback(() => {
    if (fullscreen) setFullscreen(false);
    exitFullscreen();
  }, [fullscreen]);

  useEffect(() => {
    dispatch(setFullscreenAction(fullscreen));
  }, [dispatch, fullscreen]);

  // restore local volume state
  useEffect(() => {
    try {
      const localVolume = JSON.parse(localStorageTools.getLocalData(PLAYER_STORAGE_VOLUME)) ?? DEFAULT_VOLUME;
      const localMuted = JSON.parse(localStorageTools.getLocalData(PLAYER_STORAGE_MUTE));
      if (typeof localVolume !== 'undefined' || typeof localMuted !== 'undefined') {
        dispatch(updateVolume({ isMuted: localMuted, volume: localVolume }));
      }
    } catch (e) {
      // do nothing
    }
  }, [dispatch]);

  useEffect(() => {
    if (wrapper) {
      wrapper.setVolume(volume);
      wrapper.setMute(isMuted);
    }
  }, [wrapper, isMuted, volume]);

  const withActiveClass = useCallback(
    (classname: string) =>
      classnames(classname, {
        [styles.active]: active,
      }),
    [active]
  );

  // We use a ref for hideOverlay to make sure the states are the latest when it is called in a timer
  const hideOverlayRef = useRef<VoidFunction>(() => {});
  useEffect(() => {
    hideOverlayRef.current = () => {
      if (active && !captionSettingsVisible) {
        if (channelGuideIconActive) return;
        setActive(false);
        setVolumeExpand(false);
      }
    };
  }, [active, captionSettingsVisible, channelGuideIconActive]);

  const resetIdleTimer = useCallback(() => {
    if (hideActiveTimer.current) {
      clearTimeout(hideActiveTimer.current);
    }
    if (!active) {
      setActive(true);
    }
    hideActiveTimer.current = window.setTimeout(() => {
      hideOverlayRef.current();
    }, PLAYER_CURSOR_IDLE_TIMEOUT);
  }, [active]);

  const onFullscreenPress = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    requestFullscreen(!fullscreen);
  }, [fullscreen, requestFullscreen]);

  const throttledHideOverlay = throttle(hideOverlayRef.current, 500, { leading: false });
  const throttledResetIdleTimer = throttle(resetIdleTimer, 50);

  const showVolumeBar = useCallback(() => {
    if (!isMuted) setVolumeExpand(true);
  }, [isMuted]);

  const hideVolumeBar = useCallback(() => {
    if (volumeExpand) setVolumeExpand(false);
  }, [volumeExpand]);

  useEffect(() => {
    if (!fullscreen && channelGuideIconActive) {
      setChannelGuideIconActive(false);
    }
  }, [fullscreen, channelGuideIconActive, setChannelGuideIconActive]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isMuted) {
      setVolumeExpand(true);
      if (!volumeExpand) return;
    }

    dispatch(updateVolume({ isMuted: !isMuted }));
    throttledResetIdleTimer();
    localStorageTools.setLocalData(PLAYER_STORAGE_MUTE, JSON.stringify(!isMuted));
    wrapper?.setMute(!isMuted);
  }, [wrapper, isMuted, volumeExpand, dispatch, throttledResetIdleTimer]);

  const setVolume = useCallback((volume: number) => {
    if (!volumeExpand) setVolumeExpand(true);
    dispatch(updateVolume({ volume }));
    localStorageTools.setLocalData(PLAYER_STORAGE_VOLUME, JSON.stringify(volume));
    wrapper?.setVolume(volume);
  }, [wrapper, dispatch, volumeExpand, setVolumeExpand]);

  const handleResize = () => {
    if (!isWebEpgEnabled) {
      const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (!useMobileDesign && viewportWidth <= 960) {
        setUseMobileDesign(true);
      }
      if (useMobileDesign && viewportWidth > 960) {
        setUseMobileDesign(false);
      }
    }
  };

  const throttledHandleResize = throttle(handleResize, 250);
  useEffect(() => {
    addEventListener(
      document,
      FULLSCREEN_CHANGE_EVENTS,
      handleFullscreenChange
    );
    return () => {
      removeEventListener(
        document,
        FULLSCREEN_CHANGE_EVENTS,
        handleFullscreenChange
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    throttledHandleResize();
    addEventListener(window, 'resize', throttledHandleResize);
    return () => {
      removeEventListener(window, 'resize', throttledHandleResize);
    };
  }, [useMobileDesign, throttledHandleResize]);

  const showChannelGuideOnFullscreen = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (!channelGuideIconActive) setChannelGuideIconActive(true);
  }, [channelGuideIconActive]);

  const hideChannelGuideOnFullscreen = useCallback(() => {
    if (channelGuideIconActive) setChannelGuideIconActive(false);
  }, [channelGuideIconActive]);

  useEffect(() => {
    const firstShowTimeOut = window.setTimeout(() => {
      setActive(false);
    }, PLAYER_CONTROL_FIRST_SHOW_TIMEOUT);

    const captionSettingsFromStorage = getLocalCaptions();
    if (captionSettingsFromStorage) {
      dispatch(loadWebCustomCaptions(captionSettingsFromStorage));
    }

    return () => {
      clearTimeout(hideActiveTimer.current);
      clearTimeout(firstShowTimeOut);
    };
  }, [dispatch]);

  const onPlayClick = () => {
    wrapper?.play();
  };

  const playerAreaRef = useRef(null);

  const controlAreaClassnames = classnames(styles.controlArea, {
    [styles.channelGuideControl]: !!fullscreen,
    [styles.channelGuideControlActive]: !!channelGuideIconActive,
    [styles.active]: active,
  });

  const channelGuide = <WebLiveChannelGuide
    currentId={contentId}
    isMobile={useMobileDesign}
    fullscreen={fullscreen}
    channelGuideControlActive={channelGuideIconActive}
  />;
  const channelGuideIcon = useMemo(() => (
    channelGuideIconActive
      ? <CloseX className={controlItemClass} onTouchStart={hideChannelGuideOnFullscreen} />
      : (
        <Fragment>
          <Grid
            className={controlItemClass}
            onTouchStart={showChannelGuideOnFullscreen}
          />
          <span>{intl.formatMessage(messages.channelGuide)}</span>
        </Fragment>
      )
  ), [channelGuideIconActive, showChannelGuideOnFullscreen, hideChannelGuideOnFullscreen, intl, controlItemClass]);
  const volumeClassnames = classnames(styles.volume, {
    [styles.expanded]: !!volumeExpand,
  });

  const captionsList: Captions[] = useMemo(() => getCaptionsHelper(captions, intl), [intl, captions]);

  const { fontSize } = basicCaptionSettings;
  useEffect(() => {
    let idx = WEB_FONT_SIZE_OPTIONS_ARRAY.findIndex(option => option.label === fontSize.label);
    idx = idx > 0 ? idx : 0;
    dispatch(setBasicCaptionSetting({
      setting: 'font',
      attributeKey: 'size',
      attributeValue: playerView !== 'default'
        ? WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY[idx]
        : WEB_FONT_SIZE_OPTIONS_ARRAY[idx],
    }));
  }, [dispatch, playerView, fontSize]);

  const getMenuContainer = useCallback((): HTMLDivElement | null => {
    return (getFullscreenElement() as HTMLDivElement) || playerAreaRef.current;
  }, []);

  const setCaptions = useCallback((index: number) => {
    const language = captionsList[index]?.lang;
    dispatch(toggleWebCaptions({
      ...(language && language.toLowerCase() !== CC_OFF ? { language } : {}),
      enabled: language !== '' && language !== CC_OFF,
    }));
    throttledResetIdleTimer();
  }, [dispatch, captionsList, throttledResetIdleTimer]);

  const handleAdvancedSettingsClick = () => {
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'BUTTON',
      buttonType: ButtonType.TEXT,
      buttonValue: 'advanced_subtitles',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
  };

  // we haven't support the multi-language captions yet
  const captionsIndex = Number(defaultCaption.enabled);
  const captionsProps: AudioSubtitleControlsProps = {
    captionsList,
    captionsIndex,
    forceFullHeightMenu: !!useMobileDesign || isEpgPlayerView,
    getMenuContainer,
    isAd: false,
    setCaptions,
    toggleDelay: TOGGLE_DELAY,
    iconClass: classnames(controlItemClass, styles.captionCcIcon),
    className: styles.captionIcon,
    visible: captionSettingsVisible,
    playerView,
    onToggle: setCaptionSettingsVisible,
    handleAdvancedSettingsClick,
  };

  const showLargePlayButton = playerReady && !canAutoplay;

  const showEPGLoadingSpin = !showLargePlayButton && loading;

  const fullscreenMemoizedIcon = useMemo(() => (
    <Fullscreen
      isFullscreen={fullscreen}
      onClick={onFullscreenPress}
      className={controlItemClass}
    />
  ), [fullscreen, onFullscreenPress, controlItemClass]);

  const video = useSelector((state: StoreState) => liveVideoSelector(state, contentId));
  const containerId = useAppSelector((state: StoreState) => state.live.containerId);
  const contentIndex = useAppSelector((state: StoreState) => state.live.contentIndex);
  const programIndex = useAppSelector((state: StoreState) => state.live.programIndex);
  const onScaleUpClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const titleUrl = getUrlByVideo({ video });

    trackingManager.createNavigateToPageComponent({
      startX: programIndex,
      startY: contentIndex,
      contentId,
      containerSlug: containerId,
      componentType: ANALYTICS_COMPONENTS.epgComponent,
    });
    tubiHistory.push(titleUrl);
  }, [video, programIndex, contentIndex, contentId, containerId]);

  const onOverlayClick = useCallback((e: React.MouseEvent) => {
    if (isEpgPlayerView && !showLargePlayButton) {
      onScaleUpClick(e);
    }
  }, [isEpgPlayerView, onScaleUpClick, showLargePlayButton]);

  const onTvGuideClick = useCallback(() => {
    onExitFullscreen();
    tubiHistory.push(WEB_ROUTES.live);
  }, [onExitFullscreen]);

  const { activeChannel, activeProgram } = useEpgActiveChannelAndProgram();

  const onInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeChannel?.id && activeProgram) {
      const programKey = generateProgramKey(activeChannel?.id, activeProgram);
      dispatch(toggleProgramDetailsModal({ isOpen: true, programKey }));
    }

  }, [activeChannel, activeProgram, dispatch]);

  const videoTitle = useMemo(() => {
    if (isWebEpgEnabled && isEpgPlayerView) {
      const logoUrl = activeChannel?.thumbnails?.[0] || '';
      return (
        <div className={withActiveClass(styles.epgTitleArea)}>
          { logoUrl
            ? <div className={styles.logo}>
              <div
                className={styles.logoImage}
                style={{
                  backgroundImage: logoUrl ? toCSSUrl(logoUrl) : undefined,
                }}
              />
            </div>
            : null
          }
          <div className={styles.epgTitleContainer}>
            <div className={styles.epgTitle}>{activeProgram?.title || title}</div>
            { activeProgram
              ? <LinearProgramTimeRemaining activeProgram={activeProgram}>
                {(duration) => (
                  <div className={styles.timeLeft}>
                    <FormattedMessage {...messages.timeLeft} values={{ time: duration }} />
                  </div>
                )
                }
              </LinearProgramTimeRemaining>
              : null
            }
          </div>
        </div>
      );
    }
    return (
      <div className={withActiveClass(styles.titleArea)}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.description}>{description}</div>
      </div>
    );
  }, [title, description, isEpgPlayerView, isWebEpgEnabled, activeProgram, activeChannel?.thumbnails, withActiveClass]);

  const castMemoizedIcon = useMemo(() => (
    <div className={styles.castButton}>
      <ChromecastIcon className={controlItemClass} />
    </div>
  ), [controlItemClass]);

  // The cast API available should be false on the server side
  // But we would better add a __server__ check for this
  // eslint-disable-next-line ssr-friendly/no-dom-globals-in-react-fc
  const castButtonAvailable = !__SERVER__ && castApiAvailable && castReceiverState !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE;

  return (
    <React.Fragment>
      {useMobileDesign ? (
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.description}>{description}</div>
        </div>
      ) : null}
      <div
        className={
          classnames(styles.livePlayerArea)}
        ref={playerAreaRef}
      >
        {children}
        <div
          className={withActiveClass(classnames(
            styles.livePlayerOverlay,
            !playerReady ? styles.invisibleWhileLoading : null,
            isEpgPlayerView ? styles.epgOverlay : null)
          )}
          onClick={onOverlayClick}
          onScroll={throttledResetIdleTimer}
          onMouseMove={throttledResetIdleTimer}
          onTouchStart={throttledResetIdleTimer}
          onMouseLeave={throttledHideOverlay}
        >
          {showLargePlayButton
            && <div onClick={onPlayClick} className={styles.centeredPlayButtonContainer}>
              <PlayButtonEmpty className={classnames(styles.playButton, {
                [styles.miniPlayer]: playerView === 'mini',
              })}
              />
            </div>
          }
          <div className={classnames(
            styles.backgroundOverlay, isEpgPlayerView
              ? styles.epgBackgroundOverlay : null)}
          />
          <div className={controlAreaClassnames}>
            { !useMobileDesign
              ? videoTitle
              : null
            }
            {(!useMobileDesign || fullscreen) && !isWebEpgEnabled ? channelGuide : null}
            <div className={styles.controlsLeft}>
              {useMobileDesign && fullscreen
                ? <CloseStroke className={classnames(styles.exitFullscreenIcon, controlItemClass)} onClick={onExitFullscreen} /> : null
              }
              { !isEpgPlayerView
                ? <div className={styles.live}>
                  <Label icon={<LiveStreaming />} color="red" size="large">
                    {intl.formatMessage(messages.live)}
                  </Label>
                </div>
                : null
              }
            </div>
            <div className={isEpgPlayerView ? styles.epgPlayerControlsWrapper : styles.controlsWrapper}>
              { castButtonAvailable && (!useMobileDesign ? <IconButton
                data-test-id="castButton"
                tooltip={intl.formatMessage(messages.cast)}
                tooltipPlacement={isEpgPlayerView ? 'bottom' : 'top'}
                icon={castMemoizedIcon}
              /> : castMemoizedIcon) }
              <Volume
                id="volumeButton"
                customClass={volumeClassnames}
                iconClass={controlItemClass}
                onMouseEnter={isMobile ? undefined : showVolumeBar}
                onMouseLeave={isMobile ? undefined : hideVolumeBar}
                isMuted={isMuted}
                onClick={isMobile ? undefined : toggleMute}
                min={0}
                max={100}
                value={volume}
                onChanged={setVolume}
                onChanging={setVolume}
                show={!isMobile && !isMuted && !!volumeExpand}
                isLive
                isEPG={isEpgPlayerView}
              />
              {hasSubtitle ? (
                <ClosedCaptionsControl {...captionsProps} />
              ) : null}
              {showPipButton ? (
                <IconButton
                  data-test-id="pictureInPictureButton"
                  icon={pipEnabled ? <PictureInPictureOpen24 className={controlItemClass} /> : <PictureInPictureClose24 className={controlItemClass} />}
                  tooltip={intl.formatMessage(messages.pictureInPicture)}
                  tooltipPlacement={isEpgPlayerView ? 'bottom' : 'top'}
                  onClick={togglePictureInPicture}
                />
              ) : null}
              { !useMobileDesign
                ? <IconButton
                  data-test-id="fullscreenButton"
                  tooltip={intl.formatMessage(fullscreen ? messages.closeFullscreen : messages.goFullscreen)}
                  tooltipPlacement={isEpgPlayerView ? 'bottom' : 'top'}
                  icon={fullscreenMemoizedIcon}
                /> : fullscreenMemoizedIcon
              }
              {
                // REMOVE THIS WHEN ADDING MOBILE SUPPORT
                isEpgPlayerView
                  ? <IconButton
                    data-test-id="fullPageButton"
                    tooltip={intl.formatMessage(messages.fullpage)}
                    tooltipPlacement="bottomLeft"
                    icon={<ScaleUp className={styles.scaleUpIcon} />}
                    onClick={onScaleUpClick}
                    className={controlItemClass}
                  />
                  : null
              }
            </div>
            { useMobileDesign && fullscreen && !isWebEpgEnabled ? (
              <div className={styles.controlsBottomLeft}>
                {channelGuideIcon}
              </div>
            ) : null }
            { !isEpgPlayerView && isWebEpgEnabled ? (
              <div className={styles.gridIconContainer} onClick={onTvGuideClick}>
                <Grid className={styles.gridIcon} />
                <div className={styles.tvGuideText}>
                  <FormattedMessage {...messages.tvGuide} />
                </div>
              </div>
            ) : null }
            {
              isEpgPlayerView
                ? <div className={styles.infoIconContainer} onClick={onInfoClick}>
                  <Info className={styles.infoIcon} />
                </div>
                : null
            }
          </div>
        </div>
        {showEPGLoadingSpin && isEpgPlayerView && !fullscreen ? (
          <div className={classnames(styles.loadingBackground, styles.epgLoadingBackground)}>
            <Spinner className={classnames(livePlayerStyles.loadingSpinner, styles.loadingSpinner)} />
          </div>
        ) : null}
      </div>
      {useMobileDesign && !loading && !fullscreen && !isWebEpgEnabled ? channelGuide : null}
      {loading && fullscreen ? (
        <div className={styles.loadingBackground}>
          <Spinner className={livePlayerStyles.loadingSpinner} />
        </div>
      ) : null}
    </React.Fragment>
  );
};

const mapStateToProps = (state: StoreState) => {
  const {
    player,
    captionSettings: {
      background: { toggle: backgroundToggle },
      font: { size: fontSize },
    },
    live,
  } = state;

  const castReceiverState = state.chromecast?.castReceiverState ?? '';
  const castApiAvailable = state.chromecast?.castApiAvailable ?? false;

  return {
    loading: live.loading,
    playerReady: live.playerReady,
    captions: player.captions.captionsList,
    canAutoplay: player.canAutoplay,
    volume: player.volume,
    basicCaptionSettings: { fontSize, backgroundToggle },
    castReceiverState,
    castApiAvailable,
  };
};

export default memo(connect(mapStateToProps)(WebLivePlayerOverlay));
