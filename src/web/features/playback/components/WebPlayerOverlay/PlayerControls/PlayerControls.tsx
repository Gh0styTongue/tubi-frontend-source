import type { AudioTrackInfo, controlActions } from '@adrise/player';
import { Col, Row } from '@tubitv/web-ui';
import type { RefObject } from 'react';
import React, { useRef } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import { isFullscreenSelector, isMobileDeviceSelector } from 'common/selectors/ui';
import type { TubiThunkDispatcherFn } from 'common/types/reduxThunk';
import type { SetVolumeFn } from 'web/features/playback/components/WebPlayerOverlay/hooks/useVolumeHandlers';
import { ExtraControls } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/Controls/ExtraControls';
import { PlaybackButtons } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/Controls/PlaybackButtons';
import { useHandleKeys } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useHandleKeys';
import { usePlaybackActionHandlers } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/usePlaybackActionHandlers';
import { useQualitySettingsList } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useQualitySettingsList';
import { useResizeHandler } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useResizeHandler';
import type { WebStepSeekFn } from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/hooks/useSeekHandlers';
import styles from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay.scss';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';

export interface PlayerControlsProps {
  volume: number;
  isMuted: boolean;
  setCaptions: TubiThunkDispatcherFn<typeof controlActions['setCaptions']>;
  toggleVolumeMute: () => void;
  setVolume: SetVolumeFn;
  requestFullscreen: (value: boolean) => void;
  setQuality: TubiThunkDispatcherFn<typeof controlActions['setQuality']>;
  play: TubiThunkDispatcherFn<typeof controlActions['play']>;
  pause: TubiThunkDispatcherFn<typeof controlActions['pause']>;
  stepRewind: WebStepSeekFn;
  stepForward: WebStepSeekFn;
  basicCaptionSettings: { fontSize: { label: string; }; backgroundToggle: { label: string; }; };
  containerRef: RefObject<HTMLDivElement>;
  handleAdvancedSettingsClick: () => void;
  handleCaptionSettingsToggle: (visible: boolean) => void;
  handleQualitySettingsToggle: (visible: boolean) => void;
  captionsSettingsVisible: boolean;
  qualitySettingsVisible: boolean;
  getAudioTracks: () => AudioTrackInfo[] | undefined
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  showPIPButton: boolean;
  handleClickFullscreen: (e: React.MouseEvent) => void;
  pipEnabled: boolean;
  togglePictureInPicture: (e: React.MouseEvent) => void;
  handleClickVolume: (e: React.MouseEvent) => void;
  updateVolume: (value: number) => void;
  makeVolumeRangeVisible: () => void;
  makeVolumeRangeInvisible: () => void;
  showVolumeRange: boolean;
}

/**
 * Row of icons with click handlers attached to each
 * Important to stopPropagation in each click handler, so the parent div click handler is not called
 */
const PlayerControls = (props: PlayerControlsProps) => {
  useTrackRerenders('PlayerControls');

  const {
    handleQualitySettingsToggle,
    qualitySettingsVisible,
    isMuted,
    volume,
    pause,
    stepRewind,
    stepForward,
    play,
    basicCaptionSettings,
    containerRef,
    handleCaptionSettingsToggle,
    captionsSettingsVisible,
    setCaptions,
    getAudioTracks,
    getCurrentAudioTrack,
    setAudioTrack,
    showPIPButton,
    pipEnabled,
    togglePictureInPicture,
    handleClickFullscreen,
    setQuality,
    handleClickVolume,
    updateVolume,
    makeVolumeRangeVisible,
    makeVolumeRangeInvisible,
    showVolumeRange,
    handleAdvancedSettingsClick,
  } = props;

  const isMobile = useAppSelector(isMobileDeviceSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);

  // refs
  const qualityListRef = useRef<HTMLDivElement>(null);

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

  const {
    handleClickStepRewind,
    handleClickStepForward,
    handleClickPlayPause,
  } = usePlaybackActionHandlers({
    stepRewind,
    stepForward,
    pause,
    play,
  });

  return (
    <Row className={styles.playerControls}>
      <Col xs="4" className={styles.playbackButtons}>
        <PlaybackButtons
          isMobile={isMobile}
          isMuted={isMuted}
          volume={volume}
          showVolumeRange={showVolumeRange}
          handleClickPlayPause={handleClickPlayPause}
          handleClickStepRewind={handleClickStepRewind}
          handleClickStepForward={handleClickStepForward}
          handleClickVolume={handleClickVolume}
          updateVolume={updateVolume}
          makeVolumeRangeVisible={makeVolumeRangeVisible}
          makeVolumeRangeInvisible={makeVolumeRangeInvisible}
        />
      </Col>
      <Col xs="4" className={styles.infoSection} />
      <Col xs="4" className={styles.extraControls}>
        <ExtraControls
          basicCaptionSettings={basicCaptionSettings}
          containerRef={containerRef}
          handleCaptionSettingsToggle={handleCaptionSettingsToggle}
          captionsSettingsVisible={captionsSettingsVisible}
          qualitySettingsVisible={qualitySettingsVisible}
          setCaptions={setCaptions}
          getAudioTracks={getAudioTracks}
          getCurrentAudioTrack={getCurrentAudioTrack}
          setAudioTrack={setAudioTrack}
          isFullscreen={isFullscreen}
          showPIPButton={showPIPButton}
          pipEnabled={pipEnabled}
          togglePictureInPicture={togglePictureInPicture}
          showMobileDesign={showMobileDesign}
          handleClickFullscreen={handleClickFullscreen}
          setQuality={setQuality}
          qualityListRef={qualityListRef}
          showQualityList={showQualityList}
          hideQualityList={hideQualityList}
          handleClickQualityIcon={handleClickQualityIcon}
          handleAdvancedSettingsClick={handleAdvancedSettingsClick}
        />
      </Col>
    </Row>
  );
};

export default React.memo(PlayerControls);
