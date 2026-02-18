import type { Ad } from '@adrise/player';
import { PLAYER_EVENTS, CampaignAdPlayer } from '@adrise/player';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { HDC_AD_PLAY_FINISHED, HDC_AD_PLAYING, HDC_AD_STOPPED } from 'common/constants/action-types';
import type { HdcAdVideoCreative } from 'common/features/hdcAd/type';
import useAppSelector from 'common/hooks/useAppSelector';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { FidelityLevel, isFidelityLevelMatch } from 'ott/utils/uiFidelity';

import styles from './HdcAdPlayer.scss';
import { IMP_DELAY } from '../hooks';

interface HdcAdPlayerProps {
  containerId: string;
  className?: string;
  style?: React.CSSProperties;
  startInMilliSeconds?: number;
}

const convertToAd = (creative: HdcAdVideoCreative): Ad => ({
  id: creative.ad_id,
  duration: creative.media.duration,
  trackingevents: creative.media.trackingevents,
  imptracking: creative.impTracking,
  video: creative.media.streamurl,
});

const HdcAdPlayer: React.FC<HdcAdPlayerProps> = ({ containerId, className, style, startInMilliSeconds = 0 }) => {
  const dispatch = useDispatch();
  const creative = useAppSelector((state) => state.hdcAd.videoCreativeMap?.[containerId]);
  const isAdPlaying = useAppSelector((state) => state.hdcAd.isAdPlaying);
  const isHdcFirstContentActive = useAppSelector((state) => !state.ui.containerIndexMap[containerId]);
  const isLeftNavOpen = useAppSelector((state) => state.ottUI.leftNav.isExpanded);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<CampaignAdPlayer>();
  const uiFidelity = useAppSelector((state) => state.ui.uiFidelity);
  const isFidelityLevelMatchMedium = isFidelityLevelMatch(uiFidelity, FidelityLevel.Medium);

  const onComplete = useCallback(() => {
    dispatch({ type: HDC_AD_PLAY_FINISHED, payload: { isAdPlayFinished: true } });
  }, [dispatch]);

  const onPlay = useCallback(() => {
    dispatch({ type: HDC_AD_PLAYING });
  }, [dispatch]);

  useEffect(() => {
    if (!creative || !playerContainerRef.current) return;

    const player = new CampaignAdPlayer({
      container: playerContainerRef.current,
      debug: !FeatureSwitchManager.isDefault(['Logging', 'Player']),
    });

    player.on(PLAYER_EVENTS.play, onPlay);

    player.on(PLAYER_EVENTS.complete, onComplete);

    player.load(convertToAd(creative), { impDelaySec: Math.floor(IMP_DELAY / 1000), autoStart: !startInMilliSeconds });
    playerRef.current = player;

    return () => {
      playerRef.current?.off(PLAYER_EVENTS.complete, onComplete);
      playerRef.current?.off(PLAYER_EVENTS.play, onPlay);
      playerRef.current?.remove();
    };
  }, [creative, dispatch, onComplete, onPlay, startInMilliSeconds]);

  useEffect(() => {
    if (startInMilliSeconds && isHdcFirstContentActive) {
      const timeout = setTimeout(() => {
        playerRef.current?.play();
      }, startInMilliSeconds);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isHdcFirstContentActive, startInMilliSeconds]);

  useEffect(() => {
    if (isLeftNavOpen || !isHdcFirstContentActive) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
  }, [isLeftNavOpen, isHdcFirstContentActive]);

  useEffect(() => {
    return () => {
      dispatch({ type: HDC_AD_STOPPED });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!creative) return null;

  return (
    <div
      ref={playerContainerRef}
      className={classNames(
        styles.hdcAdPlayer,
        { [styles.enableTransition]: isFidelityLevelMatchMedium },
        className
      )}
      style={{
        ...style,
        opacity: isAdPlaying && isHdcFirstContentActive ? 1 : 0,
      }}
      data-test-id="hdc-ad-player"
    />
  );
};

export default HdcAdPlayer;
