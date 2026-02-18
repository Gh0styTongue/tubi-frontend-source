import { State as PLAYER_STATES } from '@adrise/player';
import {
  Back30,
  Forward30,
  Pause,
  Play,
} from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import { useIntl, defineMessages } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import { isAdSelector, playerStateSelector } from 'common/selectors/playerStore';
import styles from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay.scss';

import { PlaybackButton } from './PlaybackButton';

// Message definitions moved from PlayerControls.tsx
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
});

interface PlaybackButtonsProps {
  isMobile: boolean;
  isMuted: boolean;
  volume: number;
  showVolumeRange: boolean;
  handleClickPlayPause: (e: React.MouseEvent) => void;
  handleClickStepRewind: (e: React.MouseEvent) => void;
  handleClickStepForward: (e: React.MouseEvent) => void;
  handleClickVolume: (e: React.MouseEvent) => void;
  updateVolume: (value: number) => void;
  makeVolumeRangeVisible: () => void;
  makeVolumeRangeInvisible: () => void;
}

export const PlaybackButtons: React.FC<PlaybackButtonsProps> = React.memo(({
  isMobile,
  isMuted,
  volume,
  showVolumeRange,
  handleClickPlayPause,
  handleClickStepRewind,
  handleClickStepForward,
  handleClickVolume,
  updateVolume,
  makeVolumeRangeVisible,
  makeVolumeRangeInvisible,
}) => {
  const intl = useIntl();
  const playerState = useAppSelector(playerStateSelector);
  const isPlaying = playerState === PLAYER_STATES.playing;
  const isAd = useAppSelector(isAdSelector);
  const negligibleXSButtonClasses = classNames(styles.playbackButton, styles.negligibleUnderXS);

  const buttonConfigs = [];

  buttonConfigs.push({
    id: 'playPauseButton',
    key: 'playPause',
    // eslint-disable-next-line react/forbid-component-props
    icon: isPlaying ? <Pause className={styles.icon} /> : <Play className={styles.icon} />,
    onClick: handleClickPlayPause,
    className: styles.playbackButton,
    tooltip: (isPlaying ? intl.formatMessage(messages.pause) : intl.formatMessage(messages.play)),
  });

  if (!isAd) {
    buttonConfigs.push({
      id: 'rewindButton',
      key: 'stepRewind',
      // eslint-disable-next-line react/forbid-component-props
      icon: <Back30 className={styles.icon} />,
      onClick: handleClickStepRewind,
      className: negligibleXSButtonClasses,
      tooltip: intl.formatMessage(messages.stepRewind),
    });

    buttonConfigs.push({
      id: 'forwardButton',
      key: 'stepForward',
      // eslint-disable-next-line react/forbid-component-props
      icon: <Forward30 className={styles.icon} />,
      onClick: handleClickStepForward,
      className: negligibleXSButtonClasses,
      tooltip: intl.formatMessage(messages.stepForward),
    });
  }

  buttonConfigs.push({
    id: 'volumeButton',
    key: 'volume',
    onClick: handleClickVolume,
    className: styles.playbackButton,
    volumeConfig: {
      show: !isMuted && showVolumeRange,
      isMuted,
      min: 1,
      max: 100,
      value: volume,
      onChanging: updateVolume,
      onChanged: updateVolume,
      onMouseEnter: isMobile ? undefined : makeVolumeRangeVisible,
      onMouseLeave: isMobile ? undefined : makeVolumeRangeInvisible,
    },
  });

  return (
    <>
      {buttonConfigs.map(config => {
        const { key, ...rest } = config;
        return <PlaybackButton key={key} {...rest} />;
      })}
    </>
  );
});

