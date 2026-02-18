/* eslint-disable ssr-friendly/no-dom-globals-in-react-cc-render */
/**
 * Web App.tsx lazy load the chromecast sender to ensure this file would not be run under server-side
 */
import type { AudioTrackInfo, Captions } from '@adrise/player';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { Mute, VolumeUp } from '@tubitv/icons';
import { Container, IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { RefObject } from 'react';
import React, { Component, PureComponent, createRef } from 'react';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import ChromecastIcon from 'common/components/uilib/ChromecastIcon/ChromecastIcon';
import { Pause, Play } from 'common/components/uilib/SvgLibrary/ControlIcons';
import { FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import type { OTTCaptionSettingsState, WebCaptionSettingsState } from 'common/types/captionSettings';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import InputRange from 'web/components/InputRange/InputRange';
import type { AudioSubtitleControlsProps } from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import ClosedCaptionsControl from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import ProgressBar from 'web/features/playback/components/ProgressBar/ProgressBar';
import { TOGGLE_DELAY } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/Controls/ExtraControls';
import type { WebSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';

import styles from './ChromecastController.scss';

const messages = defineMessages({
  castOn: {
    description: 'ready to cast message, device name not available',
    defaultMessage: 'Ready to cast',
  },
  castOnDevice: {
    description: 'ready to cast on device message',
    defaultMessage: 'Ready to cast on {deviceName}',
  },
  playBegin: {
    description: 'play any title to begin casting',
    defaultMessage: 'Play any title to begin casting',
  },
  errorCasting: {
    description: 'Error trying to cast to device',
    defaultMessage: 'We experienced an error. Please try that again.',
  },
  castLoading: {
    description: 'casting to device is loading the video',
    defaultMessage: 'Preparing your video',
  },
  castAd: {
    description: 'casting ad break message',
    defaultMessage: 'Your title will resume shortly',
  },
});

export interface ChromecastControllerProps {
  deviceName: string;
  castPlayerState: `${chrome.cast.media.PlayerState}`;
  seriesTitle: string;
  videoTitle: string;
  position: number;
  duration: number;
  isAd: boolean;
  volumeLevel: number;
  isMuted: boolean;
  captionsIndex: number;
  captionsList: Captions[];
  seek: WebSeekFn;
  updateVolume: (volume: number) => void;
  toggleVolumeMute: () => void;
  togglePlayPause: () => void;
  setCaptions: (index: number) => void;
  castVideoLoadError?: string;
  castVideoLoading: boolean;
  captionsAvailable: boolean;
  isLive: boolean;
  captionSettings: WebCaptionSettingsState & OTTCaptionSettingsState;
  getAudioTracks: () => AudioTrackInfo[];
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
}

/**
 * While connected to an active receiver, display play/pause, progress bar, and other control buttons
 */
export default class ChromecastController extends Component<ChromecastControllerProps> {
  private containerRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();

  render() {
    const {
      deviceName,
      castPlayerState,
      seriesTitle,
      videoTitle,
      isAd,
      position,
      duration,
      seek,
      isMuted,
      volumeLevel,
      updateVolume,
      toggleVolumeMute,
      setCaptions,
      captionsIndex,
      captionsList,
      togglePlayPause,
      castVideoLoadError,
      castVideoLoading,
      captionsAvailable,
      captionSettings,
      isLive,
      getAudioTracks,
      setAudioTrack,
      getCurrentAudioTrack,
    } = this.props;
    const { IDLE: PLAYER_IDLE, PLAYING: PLAYER_PLAYING, BUFFERING: PLAYER_BUFFERING } = window.chrome.cast.media.PlayerState;
    if (castPlayerState === PLAYER_IDLE) {
      return (<IdleMessage
        deviceName={deviceName}
        error={!!castVideoLoadError}
        loading={!!castVideoLoading}
      />);
    }
    const isPlaying = castPlayerState === PLAYER_PLAYING;
    const isBuffering = castPlayerState === PLAYER_BUFFERING;
    const chromecastControllerClass = classNames(styles.chromecastController, {
      [styles.isLive]: !!isLive,
    });
    const {
      background: { toggle: backgroundToggle },
      font: { size: fontSize },
    } = captionSettings;

    const basicCaptionSettings = { fontSize, backgroundToggle };

    return (
      <div key="ccStatusBar" className={styles.chromecastWrapper} ref={this.containerRef}>
        <Container className={styles.container}>
          <div className={chromecastControllerClass}>
            <div className={styles.titleWrapper}>
              {
                isAd ? <ChromecastAdMessage /> : <ChromecastTitle seriesTitle={seriesTitle} videoTitle={videoTitle} />
              }
            </div>
            <div className={styles.transportControls}>
              { !isLive ? (<div className={styles.left}>
                <div key="playPause" className={styles.playPause}>
                  {
                    (isPlaying || isBuffering) ? (
                      <Pause onClick={togglePlayPause} className={styles.icon} />
                    ) : (
                      <Play onClick={togglePlayPause} className={styles.icon} />
                    )
                  }
                </div>
              </div>) : null }
              <div className={styles.center}>
                { (duration && position) ? (<ProgressBar
                  seek={seek}
                  thumbnailSprites={FREEZED_EMPTY_OBJECT}
                  isCasting
                />) : null }
              </div>
              <div className={classNames(styles.right, { [styles.rightInLive]: !!isLive })}>
                <ChromecastButtons
                  isMuted={isMuted}
                  volumeLevel={volumeLevel}
                  updateVolume={updateVolume}
                  toggleVolumeMute={toggleVolumeMute}
                  setCaptions={setCaptions}
                  captionsIndex={captionsIndex}
                  captionsList={captionsList}
                  captionsAvailable={captionsAvailable}
                  basicCaptionSettings={basicCaptionSettings}
                  containerRef={this.containerRef}
                  getAudioTracks={getAudioTracks}
                  setAudioTrack={setAudioTrack}
                  getCurrentAudioTrack={getCurrentAudioTrack}
                  isLive={isLive}
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }
}

type IdleMessageParams = {
  deviceName: string;
  error: boolean;
  loading: boolean
};

// display ready message and device name
const IdleMessage = ({ deviceName, error, loading }: IdleMessageParams) => {
  const intl = useIntl();
  const readyText = deviceName
    ? intl.formatMessage(messages.castOnDevice, { deviceName })
    : intl.formatMessage(messages.castOn);

  let messageEl = (<div className={styles.idleMessageWrapper}>
    <div className={styles.title}>{readyText}</div>
    <div className={styles.subtitle}>{intl.formatMessage(messages.playBegin)}</div>
  </div>);
  if (error || loading) {
    messageEl = (
      <div className={styles.idleMessageWrapper}>
        <div className={styles.title}>{intl.formatMessage(error ? messages.errorCasting : messages.castLoading)}</div>
      </div>);
  }
  return (
    <div className={styles.chromecastWrapper}>
      <Container className={styles.container}>
        { messageEl }
        <div className={styles.buttonWrapper}>
          <button
            className={styles.button}
            is="google-cast-button"
          />
        </div>
      </Container>
    </div>
  );
};

const ChromecastTitle = ({ seriesTitle = '', videoTitle }: { seriesTitle: string, videoTitle: string }) => (
  <div className={styles.ccTitle}>
    <div className={styles.title}>{seriesTitle || videoTitle}</div>
    { seriesTitle ? <div className={styles.subtitle}>{videoTitle}</div> : null }
  </div>
);

const ChromecastAdMessage = () => (
  <div className={styles.adMessage}>
    <div><FormattedMessage {...messages.castAd} /></div>
  </div>
);

interface ChromecastButtonsProps {
  // volume level must be from 0 to 1 for chromecast. we transform it 100x in our display
  volumeLevel: number;
  isMuted: boolean;
  updateVolume: (volume: number) => void;
  toggleVolumeMute: () => void;
  setCaptions: (index: number) => void;
  captionsList: Captions[];
  captionsIndex: number;
  captionsAvailable?: boolean;
  basicCaptionSettings: { fontSize: { label: string; }; backgroundToggle: { label: string; }; };
  containerRef: RefObject<HTMLDivElement>;
  getAudioTracks: () => AudioTrackInfo[];
  setAudioTrack: (idx: number) => Promise<AudioTrackInfo>;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  isLive: boolean;
}

interface ChromecastButtonsState {
  showVolumeRange: boolean
  captionSettingsVisible: boolean;
}

/**
 * Buttons on the right edge of chromecast controller, holds internal state for showing popup menu
 */
class ChromecastButtons extends PureComponent<ChromecastButtonsProps, ChromecastButtonsState> {
  constructor(props: ChromecastButtonsProps) {
    super(props);
    this.state = {
      showVolumeRange: false,
      captionSettingsVisible: false,
    };
  }

  hideVolumeRangeTimer: any = null;

  showVolumeRangeTimer: any = null;

  private volumeRangeNodeRef = createRef<HTMLDivElement>();

  showVolumeRange = () => {
    clearTimeout(this.hideVolumeRangeTimer);
    this.showVolumeRangeTimer = setTimeout(() => {
      if (!this.state.showVolumeRange) {
        this.setState({
          showVolumeRange: true,
        });
      }
    }, 200);
  };

  hideVolumeRange = () => {
    clearTimeout(this.showVolumeRangeTimer);
    this.hideVolumeRangeTimer = setTimeout(() => {
      if (this.state.showVolumeRange) {
        this.setState({
          showVolumeRange: false,
        });
      }
    }, 200);
  };

  handleCaptionSettingsToggle = (visible: boolean) => {
    this.setState({ captionSettingsVisible: visible });
    if (visible) {
      const dialogEvent = buildDialogEvent(getCurrentPathname(), DialogType.SUBTITLE_AUDIO, '', DialogAction.SHOW);
      trackEvent(eventTypes.DIALOG, dialogEvent);
    }
  };

  renderCaptionsControl = () => {
    const { basicCaptionSettings, captionsList, captionsIndex, containerRef, setCaptions, captionsAvailable } = this.props;
    if (!captionsAvailable) return;
    const captionsProps: AudioSubtitleControlsProps = {
      basicCaptionSettings,
      captionsList,
      captionsIndex,
      className: styles.extraControl,
      getMenuContainer(): HTMLDivElement | null {
        return containerRef.current;
      },
      iconClass: styles.icon,
      isAd: false,
      isFullscreen: false,
      setCaptions,
      toggleDelay: TOGGLE_DELAY,
      forceFullHeightMenu: false,
      onToggle: this.handleCaptionSettingsToggle,
      visible: this.state.captionSettingsVisible,
      getAudioTracks: this.props.getAudioTracks,
      getCurrentAudioTrack: this.props.getCurrentAudioTrack,
      setAudioTrack: this.props.setAudioTrack,
      hideAdvancedSettings: true,
      isCasting: true,
    };

    return (<ClosedCaptionsControl key="captions" {...captionsProps} />);
  };

  render() {
    const { isMuted, volumeLevel, updateVolume, toggleVolumeMute } = this.props;
    const { showVolumeRange } = this.state;
    const fadeInTransition = {
      enter: styles.fadeEnter,
      enterActive: styles.fadeEnterActive,
      exit: styles.fadeLeave,
      exitActive: styles.fadeLeaveActive,
    };

    return (
      <div className={styles.ccButtons}>
        <div>
          <div className={styles.castButton}>
            <ChromecastIcon />
          </div>
        </div>
        <span
          key="volume"
          id="volumeArea"
          className={styles.volumeArea}
          onMouseEnter={this.showVolumeRange}
          onMouseLeave={this.hideVolumeRange}
        >
          <IconButton
            data-test-id="volumeButton"
            icon={isMuted ? <Mute className={styles.icon} /> : <VolumeUp className={styles.icon} />}
            onClick={toggleVolumeMute}
          />
          {!isMuted && showVolumeRange ? (
            <CSSTransition key="volumeRange" classNames={fadeInTransition} timeout={300} nodeRef={this.volumeRangeNodeRef}>
              <div className={styles.volumeRange} ref={this.volumeRangeNodeRef}>
                <InputRange min={1} max={100} value={volumeLevel * 100} onChanging={updateVolume} useRefresh />
              </div>
            </CSSTransition>
          ) : null}
        </span>
        {
          this.renderCaptionsControl()
        }
      </div>
    );
  }
}
