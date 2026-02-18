import type { controlActions } from '@adrise/player';
import { ActionLevel } from '@adrise/player';
import { CloseStroke, Pause, Play, ScaleUp } from '@tubitv/icons';
import { IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import AdMessageWrapper from 'common/features/playback/components/AdMessageWrapper/AdMessageWrapper';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { isAdSelector, isPlayingSelector } from 'common/selectors/playerStore';
import type { TubiThunkDispatcherFn } from 'common/types/reduxThunk';
import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import Volume from 'web/features/playback/components/Volume/Volume';

import TitleArea from './components/TitleArea';
import styles from './FloatingPlayerOverlay.scss';
import { usePlayerPortal } from '../../contexts/playerPortalContext/playerPortalContext';

interface FloatingPlayerOverlayProps {
  active: boolean;
  video: Video;
  isMuted: boolean;
  handleClickFullscreen: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  volume: number;
  play: TubiThunkDispatcherFn<typeof controlActions['play']>;
  pause: TubiThunkDispatcherFn<typeof controlActions['pause']>;
  handleClickVolume: (e: React.MouseEvent) => void;
  updateVolume: (value: number) => void;
  showVolumeRange: boolean;
}

const messages = defineMessages({
  closeFullscreen: {
    description: 'close fullscreen icon label text',
    defaultMessage: 'Close Fullscreen',
  },
  goFullscreen: {
    description: 'go fullscreen icon label text',
    defaultMessage: 'Go Fullscreen',
  },
  fullpage: {
    description: 'maximize video size icon label text',
    defaultMessage: 'Maximize',
  },
  close: {
    description: 'close icon label text',
    defaultMessage: 'Close',
  },
  mute: {
    description: 'mute icon label text',
    defaultMessage: 'Mute',
  },
  unmute: {
    description: 'unmute icon label text',
    defaultMessage: 'Unmute',
  },
});

function FloatingPlayerOverlay({
  active,
  video,
  isMuted,
  onMouseMove,
  onMouseLeave,
  volume,
  play,
  pause,
  handleClickVolume,
  updateVolume,
  showVolumeRange,
}: FloatingPlayerOverlayProps) {
  const playerAreaRef = useRef<HTMLDivElement>(null);

  const { destroyPlayers, setIsFloating } = usePlayerPortal();
  const setIsFloatingRef = useLatest(setIsFloating);

  const isPlaying = useAppSelector(isPlayingSelector);
  const isAd = useAppSelector(isAdSelector);

  const intl = useIntl();

  const onClose = useCallback(() => {
    destroyPlayers(video.id);
  }, [destroyPlayers, video.id]);

  const onExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const titleUrl = getUrlByVideo({ video });

    tubiHistory.push(titleUrl);
    setIsFloatingRef.current(false);
  }, [setIsFloatingRef, video]);

  const onTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play(ActionLevel.UI);
    }
  }, [isPlaying, pause, play]);

  const floatingPlayerAreaClassNames = classNames(styles.floatingPlayerArea, {
    [styles.active]: active,
  });

  const volumeClassnames = classNames(styles.volume, {
    [styles.expanded]: showVolumeRange,
  });

  return (
    <div
      ref={playerAreaRef}
      className={floatingPlayerAreaClassNames}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.backgroundOverlay} />
      <div className={styles.overlayContent}>
        <IconButton
          containerClassName={styles.playButton}
          icon={isPlaying ? <Pause /> : <Play />}
          onClick={onTogglePlay}
        />

        {isAd ? (
          <AdMessageWrapper containerClassName={styles.adMessage} refreshVariant={AdPlayerUIRefreshVariant.Default} />
        ) : (
          <TitleArea
            logoImg={video.images?.hero_422?.[0]}
            title={video.title}
            duration={video.duration}
          />
        )}

        <div className={styles.controlArea}>
          <div className={styles.controlsLeft}>
            <IconButton
              icon={<CloseStroke />}
              onClick={onClose}
              tooltip={intl.formatMessage(messages.close)}
              tooltipPlacement="bottom"
            />
          </div>
          <div className={styles.controlsRight}>
            <Volume
              id="volumeButton"
              customClass={volumeClassnames}
              isMuted={isMuted}
              onClick={handleClickVolume}
              min={1}
              max={100}
              value={volume}
              onChanged={updateVolume}
              onChanging={updateVolume}
              show={!isMuted && showVolumeRange}
              isMiniPlayer
              tooltip={isMuted ? intl.formatMessage(messages.unmute) : intl.formatMessage(messages.mute)}
              tooltipPlacement="bottom"
            />
            <IconButton
              data-test-id="fullPageButton"
              tooltip={intl.formatMessage(messages.fullpage)}
              tooltipPlacement="bottomLeft"
              icon={<ScaleUp />}
              onClick={onExpand}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FloatingPlayerOverlay;
