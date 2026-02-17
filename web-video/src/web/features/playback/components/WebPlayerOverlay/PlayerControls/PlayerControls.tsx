import type { AudioTrackInfo, QualityLevel, controlActions, Captions } from '@adrise/player';
import { State as PLAYER_STATES, ActionLevel } from '@adrise/player';
import {
  Back30,
  Forward30,
  FullscreenExit,
  FullscreenEnter,
  Pause,
  Play,
  Settings as QualityIcon,
  ScaleUp,
  ScaleDown,
  PictureInPictureClose24,
  PictureInPictureOpen24,
} from '@tubitv/icons';
import { Col, Row, OptionList, IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import memoizeOne from 'memoize-one';
import type { RefObject } from 'react';
import React, { useRef, PureComponent } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import shallowEqual from 'shallowequal';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { playerStateSelector, positionSelector, captionsIndexSelector, captionsListSelector } from 'common/selectors/playerStore';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import type { TubiThunkDispatcherFn, TubiThunkDispatch } from 'common/types/reduxThunk';
import {
  getFullscreenElement,
} from 'common/utils/dom';
import type { AudioSubtitleControlsProps } from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import ClosedCaptionsControl from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import { useVolumeRange } from 'web/features/playback/components/WebPlayerOverlay/hooks/useVolumeRange';
import { useHandleKeys } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useHandleKeys';
import { useQualitySettingsList } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useQualitySettingsList';
import { useResizeHandler } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useResizeHandler';
import type { WebStepSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import { castApiAvailableSelector } from 'web/features/playback/selectors/chromecast';
import { adSequenceSelector, isAdSelector, isHDSelector, isMutedSelector, qualityIndexSelector, qualityListSelector, volumeSelector } from 'web/features/playback/selectors/player';

import { useHandleAdvancedSettingsClick } from './hooks/useHandleAdvancedSettingsClick';
import Volume from '../../Volume/Volume';
import styles from '../WebPlayerOverlay.scss';

const messages = defineMessages({
  play: {
    description: 'play icon label text',
    defaultMessage: 'Play',
  },
  pause: {
    description: 'pause icon label text',
    defaultMessage: 'Pause',
  },
  stepRewind: {
    description: 'stepRewind icon label text',
    defaultMessage: 'Rewind 30s',
  },
  stepForward: {
    description: 'stepForward icon label text',
    defaultMessage: 'Forward 30s',
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
  videoQuality: {
    description: 'video quality menu label text',
    defaultMessage: 'Video Quality',
  },
  pictureInPicture: {
    description: 'picture in picture text',
    defaultMessage: 'Picture In Picture',
  },
  closeTheater: {
    description: 'close theater mode icon label text',
    defaultMessage: 'Exit Theater Mode',
  },
  goTheater: {
    description: 'go theater mode icon label text',
    defaultMessage: 'Enter Theater Mode',
  },
});

export const TOGGLE_DELAY = 200;

const QUALITY_CONTROL_ID = 'qualityArea';
const QUALITY_MENU_ID = 'qualityList';

interface ButtonConfig {
  id: string;
  key: string;
  icon?: JSX.Element;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  volumeConfig?: {
    show: boolean;
    min: number;
    max: number;
    value: number;
    isMuted: boolean;
    onChanging: (value: number) => void;
    onChanged: (value: number) => void;
    onMouseEnter: React.HTMLAttributes<HTMLSpanElement>['onMouseEnter'];
    onMouseLeave: React.HTMLAttributes<HTMLSpanElement>['onMouseLeave'];
  },
  tooltip?: string;
}

export interface PlayerControlsProps {
  setCaptions: TubiThunkDispatcherFn<typeof controlActions['setCaptions']>;
  toggleVolumeMute: () => void;
  updateVolume: (value: number) => void;
  requestFullscreen: (value: boolean) => void;
  setQuality: TubiThunkDispatcherFn<typeof controlActions['setQuality']>;
  play: TubiThunkDispatcherFn<typeof controlActions['play']>;
  pause: TubiThunkDispatcherFn<typeof controlActions['pause']>;
  stepRewind: WebStepSeekFn;
  stepForward: WebStepSeekFn;
  basicCaptionSettings: { fontSize: { label: string; }; backgroundToggle: { label: string; }; };
  intl: IntlShape;
  shouldInitShowCastTip?: boolean;
  containerRef: RefObject<HTMLDivElement>;
  handleCaptionSettingsToggle: (visible: boolean) => void;
  handleQualitySettingsToggle: (visible: boolean) => void;
  captionsSettingsVisible?: boolean;
  qualitySettingsVisible?: boolean;
  getAudioTracks: () => AudioTrackInfo[] | undefined
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  isFullscreen: boolean
  // Show fewer controls in this mode
  compactUiMode: boolean;
  showPIPButton: boolean;
  showTheaterButton: boolean;
  isTheater: boolean;
  handleClickFullscreen: (e: React.MouseEvent) => void;
  handleClickTheater: (e: React.MouseEvent) => void;
  pipEnabled: boolean;
  togglePictureInPicture: (e: React.MouseEvent) => void;
}

interface PlayerControlsPropsFromFnComponent {
  isAd: boolean;
  playerState: string;
  adSequence: number;
  isMuted: boolean;
  volume: number;
  isMobile?: boolean;
  castApiAvailable: boolean;
  isLoggedIn?: boolean;
  position?: number;
  captionsList: Captions[];
  captionsIndex: number;
  qualityList: QualityLevel[];
  qualityIndex: number;
  isHD: boolean;
  showVolumeRange: boolean;
  setShowVolumeRange: (value: boolean) => void;
  showMobileDesign: boolean;
  volumeChangedByUserRef: React.MutableRefObject<boolean>;
  volumeMuteChangedByUserRef: React.MutableRefObject<boolean>;
  isMutedBeforeAdRef: React.MutableRefObject<boolean>;
  volumeBeforeAdRef: React.MutableRefObject<number>;
  qualityListRef: React.RefObject<HTMLDivElement>;
  volumeRangeRef: React.RefObject<HTMLDivElement>;
  showQualityList: () => void;
  hideQualityList: () => void;
  handleClickQualityIcon: (e: React.MouseEvent) => void;
  makeVolumeRangeVisible: () => void;
  makeVolumeRangeInvisible: () => void;
  dispatch: TubiThunkDispatch;
  handleAdvancedSettingsClick: () => void;
}

type PlayerControlsClassComponentProps = PlayerControlsProps & PlayerControlsPropsFromFnComponent;

const propsAndStateAreEqualExceptForPosition = (
  aArgs: (PlayerControlsClassComponentProps)[],
  bArgs: (PlayerControlsClassComponentProps)[],
): boolean => {
  // Shallow compare all properties except position, since that changes all the time and does not affect the display of any of the player controls.
  // Returning `undefined` causes the default shallowEqual logic to be used, which works correctly for objects.
  const excludePosition = (a: unknown, b: unknown, key: string | number | undefined) => key === 'position' ? true : undefined;
  return shallowEqual(aArgs[0], bArgs[0], excludePosition) && shallowEqual(aArgs[1], bArgs[1], excludePosition);
};

/**
 * Row of icons with click handlers attached to each
 * Important to stopPropagation in each click handler, so the parent div click handler is not called
 */
class PlayerControlsClassComponent extends PureComponent<PlayerControlsClassComponentProps> {

  componentDidUpdate(prevProps: PlayerControlsClassComponentProps) {
    const { isAd, adSequence, isMuted, volume, toggleVolumeMute, updateVolume } = prevProps;
    const enteringAd = this.props.isAd && !isAd;
    const leavingAd = (!this.props.isAd && isAd) || (this.props.adSequence !== adSequence);

    // record mute/volume state when entering ad
    if (enteringAd) {
      this.props.volumeChangedByUserRef.current = false;
      this.props.volumeMuteChangedByUserRef.current = false;
      this.props.isMutedBeforeAdRef.current = isMuted;
      this.props.volumeBeforeAdRef.current = volume;
    }
    // restore mute/volume state when leaving ad
    if (leavingAd) {

      if (!this.props.volumeMuteChangedByUserRef.current && this.props.isMutedBeforeAdRef.current !== isMuted) {
        toggleVolumeMute();
      }
      if (!this.props.volumeChangedByUserRef.current && this.props.volumeBeforeAdRef.current !== volume) {
        updateVolume(this.props.volumeBeforeAdRef.current);
      }
    }
  }

  handleClickVolume = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.toggleVolumeMute();
  };

  handleClickStepRewind = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.props.stepRewind('ON_SCREEN_BUTTON' as const);
  };

  handleClickStepForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.props.stepForward('ON_SCREEN_BUTTON' as const);
  };

  setVolume = (value: number) => {
    const { isMuted, updateVolume } = this.props;
    this.props.volumeChangedByUserRef.current = true;
    if (isMuted) {
      this.props.volumeMuteChangedByUserRef.current = true;
    }
    updateVolume(value);
  };

  toggleVolumeMute = () => {
    this.props.volumeMuteChangedByUserRef.current = true;
    this.props.toggleVolumeMute();
  };

  stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  renderQualityList() {
    const { qualityList, qualityIndex } = this.props;
    if (qualityList.length <= 1) return null;

    return (
      <div id={QUALITY_MENU_ID} onClick={this.stopPropagation} className={classNames(styles.qualityList)} ref={this.props.qualityListRef} data-test-id="quality-menu">
        <section>
          <h3><FormattedMessage {...messages.videoQuality} /></h3>
          <OptionList
            options={qualityList}
            activeLabel={qualityList[qualityIndex].label}
            onOptionSelect={this.props.setQuality}
          />
        </section>
      </div>
    );
  }

  renderExtraControls = memoizeOne((props: PlayerControlsClassComponentProps) => {
    const {
      basicCaptionSettings,
      captionsList,
      captionsIndex,
      containerRef,
      handleCaptionSettingsToggle,
      captionsSettingsVisible,
      qualitySettingsVisible,
      intl,
      isAd,
      qualityList,
      qualityIndex,
      setCaptions,
      getAudioTracks,
      getCurrentAudioTrack,
      setAudioTrack,
      isFullscreen,
      showPIPButton,
      showTheaterButton,
      pipEnabled,
      togglePictureInPicture,
      showMobileDesign,
      isTheater,
      handleClickFullscreen,
      handleClickTheater,
    } = props;
    const extraControls = [];

    const showQualityControl = !isAd && qualityList.length > 1 && !this.props.compactUiMode;
    const showCaptionControl = !isAd && captionsList.length > 1 && !this.props.compactUiMode;

    // captions
    if (showCaptionControl) {
      const captionsProps: AudioSubtitleControlsProps = {
        basicCaptionSettings,
        captionsList,
        captionsIndex,
        className: styles.extraControl,
        getMenuContainer(): HTMLDivElement | null {
          return (getFullscreenElement() as HTMLDivElement) || containerRef.current;
        },
        handleAdvancedSettingsClick: this.props.handleAdvancedSettingsClick,
        iconClass: styles.icon,
        isAd,
        setCaptions,
        toggleDelay: TOGGLE_DELAY,
        forceFullHeightMenu: showMobileDesign && !isFullscreen,
        onToggle: handleCaptionSettingsToggle,
        visible: captionsSettingsVisible,
        getAudioTracks,
        getCurrentAudioTrack,
        setAudioTrack,
      };

      extraControls.push(<ClosedCaptionsControl key="captions" {...captionsProps} />);
    }

    // quality
    if (showQualityControl) {
      extraControls.push((
        <span
          key="quality"
          id={QUALITY_CONTROL_ID}
          className={classNames(styles.extraControl,
            {
              [styles.extraControlActive]: qualityIndex > 0,
            })}
          onMouseEnter={this.props.showQualityList}
          onMouseLeave={this.props.hideQualityList}
        >
          <IconButton
            data-test-id="qualityButton"
            icon={<QualityIcon className={styles.icon} />}
            onClick={this.props.handleClickQualityIcon}
          />
          {qualitySettingsVisible ? this.renderQualityList() : null}
        </span>
      ));
    }

    // picture-in-picture
    if (showPIPButton) {
      extraControls.push(
        <span
          key="picture-in-picture"
          className={styles.extraControl}
        >
          <IconButton
            data-test-id="pictureInPictureButton"
            icon={pipEnabled ? <PictureInPictureOpen24 className={styles.icon} /> : <PictureInPictureClose24 className={styles.icon} />}
            tooltip={intl.formatMessage(messages.pictureInPicture)}
            onClick={togglePictureInPicture}
          />
        </span>
      );
    }

    // theater mode
    if (showTheaterButton) {
      extraControls.push((
        <span
          key="theater"
          id="theater"
          className={styles.extraControl}
        >
          <IconButton
            data-test-id="theaterButton"
            icon={isTheater ? <ScaleDown className={styles.icon} /> : <ScaleUp className={styles.icon} />}
            tooltip={isTheater ? intl.formatMessage(messages.closeTheater) : intl.formatMessage(messages.goTheater)}
            onClick={handleClickTheater}
          />
        </span>
      ));
    }

    // fullscreen
    extraControls.push((
      <span
        key="fullscreen"
        id="fullscreenArea"
        className={styles.extraControl}
      >
        <IconButton
          data-test-id="fullscreenButton"
          icon={isFullscreen ? <FullscreenExit className={styles.icon} /> : <FullscreenEnter className={styles.icon} />}
          tooltip={isFullscreen ? intl.formatMessage(messages.closeFullscreen) : intl.formatMessage(messages.goFullscreen)}
          tooltipPlacement="topLeft"
          onClick={handleClickFullscreen}
        />
      </span>
    ));

    return extraControls;
  }, propsAndStateAreEqualExceptForPosition);

  handleClickPlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { playerState, pause, play } = this.props;
    const isPlaying = playerState === PLAYER_STATES.playing;
    if (isPlaying) {
      pause();
    } else {
      play(ActionLevel.UI);
    }
  };

  renderPlaybackButton = (config: ButtonConfig) => {
    const {
      id,
      key,
      icon,
      onClick,
      className,
      volumeConfig,
      tooltip,
    } = config;

    if (volumeConfig) {
      return (
        <Volume
          key={key}
          id={id}
          onClick={onClick}
          customClass={className}
          iconClass={styles.icon}
          {...volumeConfig}
        />
      );
    }

    return (
      <span key={key} className={className}>
        <IconButton
          data-test-id={id}
          icon={icon}
          tooltip={tooltip}
          onClick={onClick}
        />
      </span>
    );
  };

  renderPlaybackButtons = memoizeOne((props: PlayerControlsClassComponentProps) => {
    const { playerState, isAd, isMobile, isMuted, volume, intl, showVolumeRange } = props;
    const isPlaying = playerState === PLAYER_STATES.playing;
    const negligibleXSButtonClasses = classNames(styles.playbackButton, styles.negligibleUnderXS);

    const buttonConfigs: ButtonConfig[] = [];

    buttonConfigs.push({
      id: 'playPauseButton',
      key: 'playPause',
      icon: isPlaying ? <Pause className={styles.icon} /> : <Play className={styles.icon} />,
      onClick: this.handleClickPlayPause,
      className: styles.playbackButton,
      tooltip: (isPlaying ? intl.formatMessage(messages.pause) : intl.formatMessage(messages.play)),
    });
    if (!isAd && !this.props.compactUiMode) {
      buttonConfigs.push({
        id: 'rewindButton',
        key: 'stepRewind',
        icon: <Back30 className={styles.icon} />,
        onClick: this.handleClickStepRewind,
        className: negligibleXSButtonClasses,
        tooltip: intl.formatMessage(messages.stepRewind),
      });
      buttonConfigs.push({
        id: 'forwardButton',
        key: 'stepForward',
        icon: <Forward30 className={styles.icon} />,
        onClick: this.handleClickStepForward,
        className: negligibleXSButtonClasses,
        tooltip: intl.formatMessage(messages.stepForward),
      });
    }
    if (!this.props.compactUiMode) {
      buttonConfigs.push({
        id: 'volumeButton',
        key: 'volume',
        onClick: this.handleClickVolume,
        className: styles.playbackButton,
        volumeConfig: {
          show: !isMuted && showVolumeRange,
          isMuted,
          min: 1,
          max: 100,
          value: volume,
          onChanging: this.setVolume,
          onChanged: this.setVolume,
          onMouseEnter: isMobile ? undefined : this.props.makeVolumeRangeVisible,
          onMouseLeave: isMobile ? undefined : this.props.makeVolumeRangeInvisible,
        },
      });
    }
    return buttonConfigs.map(config => this.renderPlaybackButton(config));
  }, propsAndStateAreEqualExceptForPosition);

  renderContents = memoizeOne((props: PlayerControlsClassComponentProps) => {
    return (
      <>
        <Col xs="4" className={styles.playbackButtons}>
          {this.renderPlaybackButtons(props)}
        </Col>
        <Col xs="4" className={styles.infoSection} />
        <Col xs="4" className={styles.extraControls}>
          {this.renderExtraControls(props)}
        </Col>
      </>
    );
  }, propsAndStateAreEqualExceptForPosition);

  render() {
    return (
      <Row className={styles.playerControls}>
        {this.renderContents(this.props)}
      </Row>
    );
  }
}

const PlayerControls = (props: PlayerControlsProps) => {
  const { handleQualitySettingsToggle, qualitySettingsVisible } = props;

  const playerState = useAppSelector(playerStateSelector);
  const isAd = useAppSelector(isAdSelector);
  const adSequence = useAppSelector(adSequenceSelector);
  const isMuted = useAppSelector(isMutedSelector);
  const volume = useAppSelector(volumeSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const castApiAvailable = useAppSelector(castApiAvailableSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const position = useAppSelector(positionSelector);
  const captionsList = useAppSelector(captionsListSelector);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const qualityList = useAppSelector(qualityListSelector);
  const qualityIndex = useAppSelector(qualityIndexSelector);
  const isHD = useAppSelector(isHDSelector);

  const dispatch = useAppDispatch();

  // refs

  const volumeChangedByUserRef = useRef(false);
  const volumeMuteChangedByUserRef = useRef(false);
  const isMutedBeforeAdRef = useRef(isMuted);
  const volumeBeforeAdRef = useRef(volume);
  const qualityListRef = useRef<HTMLDivElement>(null);
  const volumeRangeRef = useRef<HTMLDivElement>(null);

  // track window resize events to decide whether to use mobile design
  const { showMobileDesign } = useResizeHandler();

  // allow esc & tab to close quality menu
  // TODO: does it need to close captions menu as well?
  useHandleKeys({
    qualitySettingsVisible,
    qualityListRef,
    handleQualitySettingsToggle,
  });

  // handlers
  const {
    showQualityList,
    hideQualityList,
    handleClickQualityIcon,
  } = useQualitySettingsList({
    qualitySettingsVisible,
    handleQualitySettingsToggle,
  });

  const { handleAdvancedSettingsClick } = useHandleAdvancedSettingsClick(props.pause);

  const {
    showVolumeRange,
    setShowVolumeRange,
    makeVolumeRangeVisible,
    makeVolumeRangeInvisible,
  } = useVolumeRange();

  return (
    <PlayerControlsClassComponent
      {...props}
      playerState={playerState}
      isAd={isAd}
      adSequence={adSequence}
      isMuted={isMuted}
      volume={volume}
      isMobile={isMobile}
      castApiAvailable={castApiAvailable}
      isLoggedIn={isLoggedIn}
      position={position}
      captionsList={captionsList}
      captionsIndex={captionsIndex}
      qualityList={qualityList}
      qualityIndex={qualityIndex}
      isHD={isHD}
      showVolumeRange={showVolumeRange}
      setShowVolumeRange={setShowVolumeRange}
      showMobileDesign={showMobileDesign}
      volumeChangedByUserRef={volumeChangedByUserRef}
      volumeMuteChangedByUserRef={volumeMuteChangedByUserRef}
      isMutedBeforeAdRef={isMutedBeforeAdRef}
      volumeBeforeAdRef={volumeBeforeAdRef}
      qualityListRef={qualityListRef}
      volumeRangeRef={volumeRangeRef}
      showQualityList={showQualityList}
      hideQualityList={hideQualityList}
      handleClickQualityIcon={handleClickQualityIcon}
      makeVolumeRangeVisible={makeVolumeRangeVisible}
      makeVolumeRangeInvisible={makeVolumeRangeInvisible}
      dispatch={dispatch}
      handleAdvancedSettingsClick={handleAdvancedSettingsClick}
    />
  );
};

export default injectIntl(PlayerControls);
