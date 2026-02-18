import type { Interceptor, Player, AdProgress } from '@adrise/player';
import { ActionLevel, PLAYER_EVENTS, interceptorManager, AdapterTypes, PlayerName } from '@adrise/player';
import { updateVideoPreviewMuted } from '@adrise/player/lib/action';
import { PLAYER_STORAGE_PREVIEW_MUTE } from '@adrise/player/lib/constants/constants';
import Analytics from '@tubitv/analytics';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { Mute, VolumeUp } from '@tubitv/icons';
import type { StyleProps } from '@tubitv/ott-ui';
import { IconButton, Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FunctionComponent, MutableRefObject } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { idle, resetPreviewVideoSession } from 'client/features/playback/session/PreviewVideoSession';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { FREEZED_EMPTY_FUNCTION, FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import { usePreviewPlayerContext } from 'common/features/playback/components/PreviewPlayer/PreviewPlayerContext';
import VideoPlayer from 'common/features/playback/components/VideoPlayer/VideoPlayer';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { usePrevious } from 'common/hooks/usePrevious';
import { usePreviousDistinct } from 'common/hooks/usePreviousDistinct';
import { isDeepLinkedSelector } from 'common/selectors/deepLink';
import { previewPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Video } from 'common/types/video';
import { secondsToHMS } from 'common/utils/timeFormatting';
import { isSamsung2018Or2019 } from 'common/utils/tizenTools';
import { BACKGROUND_INTERVAL } from 'ott/components/OTTBackground/OTTBackground';
import { PreRequestFrom, usePreRequestRainmakerUrl } from 'ott/features/playback/components/OTTPlaybackController/hooks/usePreRequestRainmakerUrl';
import { useVideoPlaybackProps } from 'ott/features/playback/selectors/vod';
import { FidelityLevel, isFidelityLevelMatch } from 'ott/utils/uiFidelity';

import useAutostartOnPreviewComplete from './hooks/useAutostartOnPreviewComplete';
import usePreviewPlayerAnalytics from './hooks/usePreviewPlayerAnalytics';
import { useStallDetection } from './hooks/useStallDetection';
import styles from './PreviewPlayer.scss';

const messages = defineMessages({
  clickToPlay: {
    description: 'preview player tooltip',
    defaultMessage: 'click to play',
  },
});

const interceptor: Interceptor = {
  name: 'PreviewPlayerReadyState',
  play: /* istanbul ignore next */ () => ActionLevel.UI,
};

function choosePreviewTitle() {
  idle();
}

const PREVIEW_PLAYER_ENABLE_PRE_REQUEST_THRESHOLD = 10;

export interface OwnProps extends StyleProps {
  onPlay?: VoidFunction;
  onTime?: VoidFunction;
  onPause?: VoidFunction;
  onStart?: VoidFunction;
  onComplete?: VoidFunction;
  onRemove?: VoidFunction;
  onError?: VoidFunction;
  onStartUpStall?: VoidFunction
  isVisible: boolean;
  shouldAutoStartContent?: boolean;
  isPaused?: boolean;
  enableBackground?: boolean;
  video?: Video;
  previewUrl?: string;
  backgroundClassname?: string;
  backgroundInterval?: number;
  enableMuteButton?: boolean;
  muteButtonClassname?: string;
  muteButtonContainerClassname?: string;
  videoPlayerState?: PlayerDisplayMode;
  enableLoadingSpinner?: boolean;
  enableProgress?: boolean;
  loop?: boolean;
  fit?: 'cover';
  isVideoTileActive?: boolean;
}

const makeEventHandlerRefProxy = <EVENT_HANDLER extends (...args: any[]) => void>(
  ref: MutableRefObject<EVENT_HANDLER>
) => (...args: Parameters<EVENT_HANDLER>) => ref.current(...args);

export const PreviewPlayer: FunctionComponent<OwnProps> = (props: OwnProps) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const {
    defaultCaptions,
    page,
    hybridAppVersion,
    ...videoPlaybackProps
  } = useVideoPlaybackProps();

  const performanceCollectorEnabled = useAppSelector(previewPerformanceMetricEnabledSelector);

  const {
    isVisible,
    onPlay = FREEZED_EMPTY_FUNCTION,
    onTime = FREEZED_EMPTY_FUNCTION,
    onPause = FREEZED_EMPTY_FUNCTION,
    onStart = FREEZED_EMPTY_FUNCTION,
    onComplete = FREEZED_EMPTY_FUNCTION,
    onRemove = FREEZED_EMPTY_FUNCTION,
    onError = FREEZED_EMPTY_FUNCTION,
    onStartUpStall = FREEZED_EMPTY_FUNCTION,
    shouldAutoStartContent,
    className: classNameProp,
    isPaused,
    enableBackground,
    video = videoPlaybackProps.video,
    previewUrl = videoPlaybackProps.previewUrl,
    backgroundClassname = styles.previewPlayerBackground,
    backgroundInterval = BACKGROUND_INTERVAL,
    enableMuteButton,
    muteButtonClassname,
    muteButtonContainerClassname,
    enableLoadingSpinner,
    enableProgress,
    loop,
    isVideoTileActive,
  } = props;

  const videoPlayerState = isVideoTileActive
    ? PlayerDisplayMode.VIDEO_IN_GRID
    : props.videoPlayerState ?? PlayerDisplayMode.BANNER;

  const intl = useIntl();
  const { position: videoTilePosition, isPlaying } = usePreviewPlayerContext();

  const uiFidelity = useAppSelector(({ ui: { uiFidelity } }) => uiFidelity);
  const isFidelityLevelLow = !isFidelityLevelMatch(uiFidelity, FidelityLevel.Medium);
  const isFidelityLevelHigher = isFidelityLevelMatch(uiFidelity, FidelityLevel.Higher);

  // TODO: eliminating or transforming to a ref will reduce re-renders
  const [isPlayable, setIsPlayable] = useState(false);

  const prevPosition = useRef(getPlayerInstance()?.getPosition());
  const prevRemaining = useRef(getPlayerInstance()?.getDuration());

  // TODO: eliminating or transforming to a ref will reduce re-renders
  const [progressPercent, setProgressPercent] = useState(0);
  const [shouldEnablePreRequest, setShouldEnablePreRequest] = useState(false);

  const contentId = useRef(video.id);
  const dispatch = useDispatch<TubiThunkDispatch>();

  const previousPreviewUrl = usePrevious(previewUrl);
  const wasVideoTileActive = usePreviousDistinct(isVideoTileActive);

  useEffect(() => {
    setShouldEnablePreRequest(false);
    return () => {
      interceptorManager.removeInterceptor(interceptor);
    };
  }, [video.id]);

  // We need videoPreviewMuted in redux state to share between the featured preview and the tile preview
  const isMuted = useAppSelector(state => state.player.videoPreviewMuted);

  useEffect(() => {
    if (__WEBPLATFORM__) {
      const isInitialMuted = getLocalData(PLAYER_STORAGE_PREVIEW_MUTE) !== 'false';
      dispatch(updateVideoPreviewMuted(isInitialMuted));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isPlayable) {
      getPlayerInstance()?.setMute(isMuted);
    }
  }, [isPlayable, isMuted, getPlayerInstance]);

  const togglePreviewMute = useCallback(() => {
    dispatch(updateVideoPreviewMuted(!isMuted));
    setLocalData(PLAYER_STORAGE_PREVIEW_MUTE, (!isMuted)?.toString());
  }, [dispatch, isMuted]);

  useEffect(() => {
    if (isPaused) {
      getPlayerInstance()?.pause();
      interceptorManager.addInterceptor(interceptor);
    } else if (isPlayable && previewUrl) {
      interceptorManager.removeInterceptor(interceptor);
      getPlayerInstance()?.play();
    }
  }, [isPaused, isPlayable, previousPreviewUrl, previewUrl, getPlayerInstance]);

  useEffect(() => {
    contentId.current = video.id;
    return () => {
      resetPreviewVideoSession();
    };
  }, [video.id]);

  useEffect(() => {
    if (previewUrl) choosePreviewTitle();
  }, [previewUrl]);

  const onVideoStart = useCallback(() => {
    onStart();
  }, [onStart]);

  const onVideoTime = useCallback(({ position, duration }: AdProgress) => {
    onTime();
    const nowPosition = Math.floor(position);

    if (nowPosition !== prevPosition.current) {
      prevPosition.current = nowPosition;
      if (enableProgress) {
        prevRemaining.current = Math.floor(duration - position);
        setProgressPercent(Math.floor(position / duration * 100));
      }

      // Check if we're within 10 seconds of the end
      const remainingTime = duration - position;
      if (remainingTime <= PREVIEW_PLAYER_ENABLE_PRE_REQUEST_THRESHOLD && !shouldEnablePreRequest) {
        setShouldEnablePreRequest(true);
      }
    }
  }, [onTime, enableProgress, shouldEnablePreRequest]);

  const onVideoError = useCallback(() => {
    onError();
  }, [onError]);

  const autostartOnPreviewComplete = useAutostartOnPreviewComplete(video);

  // Use the pre-request hook
  usePreRequestRainmakerUrl({
    preRequestFrom: PreRequestFrom.Preview,
    enablePreRequest: shouldEnablePreRequest,
    player: getPlayerInstance(),
    userId: useAppSelector(userIdSelector) || 0,
    isDeeplink: useAppSelector(isDeepLinkedSelector),
    video,
    requestTimeout: 10_000,
  });

  const onVideoComplete = useCallback(() => {
    if (loop) {
      getPlayerInstance()?.seek(0);
      getPlayerInstance()?.play();
      return;
    }

    if (shouldAutoStartContent) {
      autostartOnPreviewComplete();
    }
    onComplete();
  }, [shouldAutoStartContent, onComplete, autostartOnPreviewComplete, loop, getPlayerInstance]);

  const [loading, setLoading] = useState(true);

  const onPreviewPlayerPlay = useCallback(() => {
    onPlay();
    setLoading(false);
  }, [onPlay]);

  const onPreviewPlayerPause = useCallback(() => {
    onPause();
    if (prevRemaining.current && prevRemaining.current > 0) {
      setLoading(true);
    }
  }, [onPause]);

  const onBufferChange = useCallback(({ bufferPercent, duration }: { bufferPercent: number, duration: number}) => {
    if (isPlayable) return;
    const position = getPlayerInstance()?.getPosition() || 0;
    const bufferedLength = duration * bufferPercent / 100 - position;
    if (bufferedLength > Math.min(backgroundInterval / 1000, duration - position)) {
      setIsPlayable(true);
    }
  }, [backgroundInterval, isPlayable, getPlayerInstance]);

  const onPlaybackReady = useCallback(() => {
    if (__OTTPLATFORM__ === 'ANDROIDTV' || __OTTPLATFORM__ === 'PS5' || __OTTPLATFORM__ === 'COMCAST' || __WEBPLATFORM__ || isSamsung2018Or2019()) {
      setIsPlayable(true);
    }
  }, []);

  const onPlayerRemove = useCallback(() => {
    onRemove();
    setIsPlayable(false);
  }, [onRemove]);

  const onBufferChangeRef = useLatest(onBufferChange);
  const onVideoStartRef = useLatest(onVideoStart);
  const onPreviewPlayerPlayRef = useLatest(onPreviewPlayerPlay);
  const onVideoTimeRef = useLatest(onVideoTime);
  const onPreviewPlayerPauseRef = useLatest(onPreviewPlayerPause);
  const onVideoCompleteRef = useLatest(onVideoComplete);
  const onVideoErrorRef = useLatest(onVideoError);
  const onPlayerRemoveRef = useLatest(onPlayerRemove);
  const onPlaybackReadyRef = useLatest(onPlaybackReady);

  useOnPlayerCreate(useCallback((player: Player) => {
    setIsPlayable(false);

    const onBufferChange = makeEventHandlerRefProxy(onBufferChangeRef);
    const onVideoStart = makeEventHandlerRefProxy(onVideoStartRef);
    const onPreviewPlayerPlay = makeEventHandlerRefProxy(onPreviewPlayerPlayRef);
    const onVideoTime = makeEventHandlerRefProxy(onVideoTimeRef);
    const onPreviewPlayerPause = makeEventHandlerRefProxy(onPreviewPlayerPauseRef);
    const onVideoComplete = makeEventHandlerRefProxy(onVideoCompleteRef);
    const onVideoError = makeEventHandlerRefProxy(onVideoErrorRef);
    const onPlayerRemove = makeEventHandlerRefProxy(onPlayerRemoveRef);
    const onPlaybackReady = makeEventHandlerRefProxy(onPlaybackReadyRef);

    player.on(PLAYER_EVENTS.bufferChange, onBufferChange);
    player.on(PLAYER_EVENTS.firstFrame, onVideoStart);
    player.on(PLAYER_EVENTS.play, onPreviewPlayerPlay);
    player.on(PLAYER_EVENTS.time, onVideoTime);
    player.on(PLAYER_EVENTS.pause, onPreviewPlayerPause);
    player.on(PLAYER_EVENTS.error, onVideoError);
    player.on(PLAYER_EVENTS.complete, onVideoComplete);
    player.on(PLAYER_EVENTS.remove, onPlayerRemove);
    player.on(PLAYER_EVENTS.ready, onPlaybackReady);
    return () => {
      player.off(PLAYER_EVENTS.bufferChange, onBufferChange);
      player.off(PLAYER_EVENTS.firstFrame, onVideoStart);
      player.off(PLAYER_EVENTS.play, onPreviewPlayerPlay);
      player.off(PLAYER_EVENTS.time, onVideoTime);
      player.off(PLAYER_EVENTS.pause, onPreviewPlayerPause);
      player.off(PLAYER_EVENTS.error, onVideoError);
      player.off(PLAYER_EVENTS.complete, onVideoComplete);
      player.off(PLAYER_EVENTS.remove, onPlayerRemove);
      player.off(PLAYER_EVENTS.ready, onPlaybackReady);
    };
  }, [
    onBufferChangeRef,
    onVideoStartRef,
    onVideoTimeRef,
    onVideoCompleteRef,
    onVideoErrorRef,
    onPlayerRemoveRef,
    onPreviewPlayerPlayRef,
    onPreviewPlayerPauseRef,
    onPlaybackReadyRef,
  ]));

  useStallDetection({
    isVisible,
    onStartUpStall,
    onStall: useCallback(() => setIsPlayable(false), []),
  });

  usePreviewPlayerAnalytics({
    videoPlayerState,
    loop,
  });

  const previewPlayerBackground = classNames(backgroundClassname, {
    [styles.visible]: !isVisible && !isFidelityLevelLow,
  });

  return previewUrl
    ? (
      <>
        <div
          className={classNames(classNameProp, {
            [styles.previewPlayerCover]: isVideoTileActive,
            [styles.videoTileTransition]: isVideoTileActive || wasVideoTileActive,
            [styles.noTransition]: (isVideoTileActive || wasVideoTileActive) && !isFidelityLevelHigher,
          })}
          style={isVideoTileActive ? {
            left: videoTilePosition?.left,
            top: videoTilePosition?.top,
            width: videoTilePosition?.width,
            height: videoTilePosition?.height,
            opacity: isPlaying && videoTilePosition ? 1 : 0,
          } : {
            display: !isVisible && isFidelityLevelLow ? 'none' : undefined,
          }}
          title={intl.formatMessage(messages.clickToPlay)}
        >
          <VideoPlayer
            key={video.id}
            videoPreviewUrl={previewUrl}
            data={video}
            autoStart={false}
            analyticsConfig={Analytics.getAnalyticsConfig()}
            performanceCollectorEnabled={performanceCollectorEnabled}
            playerName={PlayerName.Preview}
            preload={__OTTPLATFORM__ === 'PS4' ? undefined : 'force-auto'}
            customAdapter={AdapterTypes.HTML5}
            enableVideoSessionCollect
            forceHlsJS={false}
            // We don't enable preview player youbora, so we pass empty here
            youboraExperimentMap={FREEZED_EMPTY_OBJECT}
          />
          {enableBackground ? <div className={previewPlayerBackground} /> : null}
          {enableLoadingSpinner && loading ? <Spinner className={styles.spinner} /> : null}
          {enableProgress && prevRemaining.current ? (
          // eslint-disable-next-line react/jsx-no-literals -- no i18n needed for hyphen
            <div className={styles.timer}>-{secondsToHMS(prevRemaining.current)}</div>
          ) : null}
          {enableProgress ? (
            <div className={styles.progress}>
              <div className={styles.progressElapsed} style={{ width: `${progressPercent}%` }} />
            </div>
          ) : null}
        </div>
        {enableMuteButton ? (
          <IconButton
            data-test-id="volumeButton"
            className={muteButtonClassname}
            containerClassName={muteButtonContainerClassname}
            icon={isMuted ? <Mute /> : <VolumeUp />}
            onClick={togglePreviewMute}
          />
        ) : null}
      </>
    )
    : null;
};

export default PreviewPlayer;
