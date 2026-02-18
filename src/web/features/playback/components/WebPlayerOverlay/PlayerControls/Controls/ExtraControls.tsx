import type { AudioTrackInfo, controlActions } from '@adrise/player';
import {
  FullscreenExit,
  FullscreenEnter,
  Settings as QualityIcon,
  PictureInPictureClose24,
  PictureInPictureOpen24,
} from '@tubitv/icons';
import { IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import type { RefObject } from 'react';
import { useIntl, defineMessages } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import { captionsIndexSelector, captionsListSelector, isAdSelector } from 'common/selectors/playerStore';
import type { TubiThunkDispatcherFn } from 'common/types/reduxThunk';
import { getFullscreenElement } from 'common/utils/dom';
import type { AudioSubtitleControlsProps } from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import ClosedCaptionsControl from 'web/features/playback/components/PlayerShared/AudioSubtitleControls';
import QualityList from 'web/features/playback/components/WebPlayerOverlay/PlayerControls/QualityList/QualityList';
import styles from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay.scss';
import { qualityIndexSelector, qualityListSelector } from 'web/features/playback/selectors/player';

const messages = defineMessages({
  closeFullscreen: {
    description: 'close fullscreen icon label text',
    defaultMessage: 'Close Fullscreen',
  },
  goFullscreen: {
    description: 'go fullscreen icon label text',
    defaultMessage: 'Go Fullscreen',
  },
  pictureInPicture: {
    description: 'picture in picture text',
    defaultMessage: 'Picture In Picture',
  },
});

export const TOGGLE_DELAY = 200;
const QUALITY_CONTROL_ID = 'qualityArea';

interface ExtraControlsProps {
  basicCaptionSettings: { fontSize: { label: string; }; backgroundToggle: { label: string; }; };
  containerRef: RefObject<HTMLDivElement>;
  handleCaptionSettingsToggle: (visible: boolean) => void;
  captionsSettingsVisible: boolean;
  qualitySettingsVisible: boolean;
  setCaptions: TubiThunkDispatcherFn<typeof controlActions['setCaptions']>;
  getAudioTracks: () => AudioTrackInfo[] | undefined;
  getCurrentAudioTrack: () => AudioTrackInfo | undefined;
  setAudioTrack: (id: number) => Promise<AudioTrackInfo>;
  isFullscreen: boolean;
  showPIPButton: boolean;
  pipEnabled: boolean;
  togglePictureInPicture: (e: React.MouseEvent) => void;
  showMobileDesign: boolean;
  handleClickFullscreen: (e: React.MouseEvent) => void;
  setQuality: TubiThunkDispatcherFn<typeof controlActions['setQuality']>;
  qualityListRef: React.RefObject<HTMLDivElement>;
  showQualityList: () => void;
  hideQualityList: () => void;
  handleClickQualityIcon: (e: React.MouseEvent) => void;
  handleAdvancedSettingsClick: () => void;
}

export const ExtraControls: React.FC<ExtraControlsProps> = React.memo(({
  basicCaptionSettings,
  containerRef,
  handleCaptionSettingsToggle,
  captionsSettingsVisible,
  qualitySettingsVisible,
  setCaptions,
  getAudioTracks,
  getCurrentAudioTrack,
  setAudioTrack,
  isFullscreen,
  showPIPButton,
  pipEnabled,
  togglePictureInPicture,
  showMobileDesign,
  handleClickFullscreen,
  setQuality,
  qualityListRef,
  showQualityList,
  hideQualityList,
  handleClickQualityIcon,
  handleAdvancedSettingsClick,
}) => {
  const captionsList = useAppSelector(captionsListSelector);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const qualityList = useAppSelector(qualityListSelector);
  const qualityIndex = useAppSelector(qualityIndexSelector);
  const isAd = useAppSelector(isAdSelector);

  const intl = useIntl();
  const extraControls: React.ReactNode[] = [];

  const showQualityControl = !isAd && qualityList.length > 1;
  const showCaptionControl = !isAd && captionsList.length > 1;

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
      handleAdvancedSettingsClick,

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
        onMouseEnter={showQualityList}
        onMouseLeave={hideQualityList}
      >
        <IconButton
          data-test-id="qualityButton"
          // eslint-disable-next-line react/forbid-component-props
          icon={<QualityIcon className={styles.icon} />}
          onClick={handleClickQualityIcon}
        />
        {qualitySettingsVisible ? (
          <QualityList
            qualityList={qualityList}
            qualityIndex={qualityIndex}
            qualityListRef={qualityListRef}
            setQuality={setQuality}
          />
        ) : null}
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
          // eslint-disable-next-line react/forbid-component-props
          icon={pipEnabled ? <PictureInPictureClose24 className={styles.icon} /> : <PictureInPictureOpen24 className={styles.icon} />}
          tooltip={intl.formatMessage(messages.pictureInPicture)}
          onClick={togglePictureInPicture}
        />
      </span>
    );
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
        // eslint-disable-next-line react/forbid-component-props
        icon={isFullscreen ? <FullscreenExit className={styles.icon} /> : <FullscreenEnter className={styles.icon} />}
        tooltip={isFullscreen ? intl.formatMessage(messages.closeFullscreen) : intl.formatMessage(messages.goFullscreen)}
        tooltipPlacement="topLeft"
        onClick={handleClickFullscreen}
      />
    </span>
  ));

  return <>{extraControls}</>;
});
