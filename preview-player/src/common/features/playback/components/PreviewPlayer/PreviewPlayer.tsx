import type { Interceptor, Player, AdProgress, ErrorEventData, StartupPerformanceEventData } from '@adrise/player';
import { ActionLevel, PLAYER_EVENTS, State, interceptorManager, AdapterTypes, PlayerName } from '@adrise/player';
import { updateVideoPreviewMuted } from '@adrise/player/lib/action';
import { PLAYER_STORAGE_PREVIEW_MUTE } from '@adrise/player/lib/constants/constants';
import { now } from '@adrise/utils/lib/time';
import Analytics from '@tubitv/analytics';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { Mute, VolumeUp } from '@tubitv/icons';
import type { StyleProps } from '@tubitv/ott-ui';
import { IconButton, Spinner } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { Location } from 'history';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import type { Params } from 'react-router/lib/Router';

import { idle, resetPreviewVideoSession } from 'client/features/playback/session/PreviewVideoSession';
import { trackPreviewError } from 'client/features/playback/track/client-log/trackPreviewError';
import { updatePlayerSnapshot } from 'client/snapshot';
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { FREEZED_EMPTY_FUNCTION, FREEZED_EMPTY_OBJECT } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { FINISH_PREVIEW, PREVIEW_PLAY_PROGRESS, START_PREVIEW } from 'common/constants/event-types';
import VideoPlayer from 'common/features/playback/components/VideoPlayer/VideoPlayer';
import { useViewTimeManager } from 'common/features/playback/hooks/useViewTimeManager';
import useAppSelector from 'common/hooks/useAppSelector';
import { usePrevious } from 'common/hooks/usePrevious';
import useUnmount from 'common/hooks/useUnmount';
import { playerHlsNormalizationUpgradeSelector } from 'common/selectors/experiments/playerHlsNormalizationUpgrade';
import { previewPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import trackingManager from 'common/services/TrackingManager';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Video } from 'common/types/video';
import { getPageObjectFromURL } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { secondsToHMS } from 'common/utils/timeFormatting';
import { isSamsung2018Or2019 } from 'common/utils/tizenTools';
import { trackLogging } from 'common/utils/track';
import { BACKGROUND_INTERVAL } from 'ott/components/OTTBackground/OTTBackground';
import { useVideoPlaybackProps } from 'ott/features/playback/selectors/vod';
import { FidelityLevel, isFidelityLevelMatch } from 'ott/utils/uiFidelity';

import useAutostartOnPreviewComplete from './hooks/useAutostartOnPreviewComplete';
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
  updatePlayerSnapshot();
}

export interface OwnProps extends StyleProps {
  params?: Params;
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
  userId?: number;
  enableLoadingSpinner?: boolean;
  enableProgress?: boolean;
  isReusable?: boolean;
  onReusablePlayerReset?: VoidFunction;
  loop?: boolean;
  location?: Location;
}

export const PreviewPlayer: FunctionComponent<OwnProps> = (props: OwnProps) => {
  const {
    captionSettings,
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
    className,
    isPaused,
    enableBackground,
    video = videoPlaybackProps.video,
    previewUrl = videoPlaybackProps.previewUrl,
    backgroundClassname = styles.previewPlayerBackground,
    backgroundInterval = BACKGROUND_INTERVAL,
    enableMuteButton,
    muteButtonClassname,
    muteButtonContainerClassname,
    videoPlayerState = PlayerDisplayMode.BANNER,
    userId,
    enableLoadingSpinner,
    enableProgress,
    isReusable,
    onReusablePlayerReset,
    loop,
  } = props;

  const intl = useIntl();

  const useHlsNext = useAppSelector(playerHlsNormalizationUpgradeSelector);
  const isFidelityLevelLow = useAppSelector(({ ui: { uiFidelity } }) => !isFidelityLevelMatch(uiFidelity, FidelityLevel.Medium));

  const [isPlayable, setIsPlayable] = useState(false);
  const [isPlayerCreated, setIsPlayerCreated] = useState(false);

  const previewPlayerRef = useRef<Player | undefined>();
  const prevPosition = useRef(previewPlayerRef.current?.getPosition());
  const prevRemaining = useRef(previewPlayerRef.current?.getDuration());
  const [progressPercent, setProgressPercent] = useState(0);
  const contentId = useRef(video.id);
  const lastReportedAnalyticEvent = useRef(FINISH_PREVIEW);
  const dispatch = useDispatch<TubiThunkDispatch>();
  const [hasLooped, setHasLooped] = useState(false);

  const previousPreviewUrl = usePrevious(previewUrl);
  // Used to track time from new url to first frame
  const loadStartTime = useRef(0);
  const totalTimeToFirstFrame = useRef(0);

  useEffect(() => {
    if (previewUrl) {
      loadStartTime.current = Date.now();
    }
  }, [previewUrl]);

  useEffect(() => {
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
      previewPlayerRef.current?.setMute(isMuted);
    }
  }, [isPlayable, isMuted]);
  const togglePreviewMute = useCallback(() => {
    dispatch(updateVideoPreviewMuted(!isMuted));
    setLocalData(PLAYER_STORAGE_PREVIEW_MUTE, (!isMuted)?.toString());
  }, [dispatch, isMuted]);

  const getCategorySlug = useCallback((page: VideoPlayerPageType) => {
    const pageObj = getPageObjectFromURL(getCurrentPathname());
    if (__ISOTT__ && page === VideoPlayerPageType.CATEGORY_PAGE && pageObj && 'category_page' in pageObj) {
      return pageObj.category_page.category_slug;
    }
    return '';
  }, []);

  const reportPreviewFinishEvent = useCallback((hasCompleted: boolean = hasLooped) => {
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW) return;
    trackingManager.trackFinishPreviewEvent({
      contentId: contentId.current,
      position: prevPosition.current || 0,
      page,
      videoPlayer: videoPlayerState,
      hasCompleted: !!hasCompleted,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = FINISH_PREVIEW;
    setHasLooped(false);
  }, [videoPlayerState, getCategorySlug, page, hasLooped]);

  const resetReusablePlayer = useCallback(() => {
    setIsPlayable(false);
    setProgressPercent(0);
    previewPlayerRef.current?.pause();
    if (previousPreviewUrl) {
      reportPreviewFinishEvent();
    }
  }, [previousPreviewUrl, reportPreviewFinishEvent]);

  useEffect(() => {
    if (isReusable && previewUrl !== previousPreviewUrl) {
      onReusablePlayerReset?.();
    }
  }, [isReusable, previewUrl, previousPreviewUrl, onReusablePlayerReset]);

  useEffect(() => {
    if (isReusable && previousPreviewUrl !== previewUrl) {
      resetReusablePlayer();
    } else if (isPaused) {
      previewPlayerRef.current?.pause();
      interceptorManager.addInterceptor(interceptor);
    } else if (isPlayable && previewUrl) {
      interceptorManager.removeInterceptor(interceptor);
      previewPlayerRef.current?.play();
    }
  }, [isReusable, isPaused, isPlayable, previousPreviewUrl, previewUrl, resetReusablePlayer]);

  const reportPreviewStartEvent = useCallback(() => {
    if (lastReportedAnalyticEvent.current !== FINISH_PREVIEW) return;
    trackingManager.trackStartPreviewEvent({
      contentId: video.id,
      videoPlayer: videoPlayerState,
      page,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = START_PREVIEW;
  }, [video.id, videoPlayerState, page, getCategorySlug]);

  const reportPreviewPlayProgressEvent = useCallback((position: number, viewTime: number) => {
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW) return;
    trackingManager.trackPreviewPlayProgressEvent({
      contentId: video.id,
      position,
      viewTime,
      videoPlayer: videoPlayerState,
      page,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = PREVIEW_PLAY_PROGRESS;
  }, [video.id, videoPlayerState, page, getCategorySlug]);

  useViewTimeManager({
    player: previewPlayerRef.current,
    track: reportPreviewPlayProgressEvent,
  });

  useEffect(() => {
    contentId.current = video.id;
    return () => {
      resetPreviewVideoSession();
    };
  }, [video.id]);

  useEffect(() => {
    if (previewUrl) choosePreviewTitle();
  }, [previewUrl]);

  // To report when navigating into player page
  useUnmount(reportPreviewFinishEvent);

  const onVideoStart = useCallback(() => {
    totalTimeToFirstFrame.current = Date.now() - loadStartTime.current;
    onStart();
    reportPreviewStartEvent();
  }, [onStart, reportPreviewStartEvent]);

  const onVideoTime = useCallback(({ position, duration }: AdProgress) => {
    onTime();
    const nowPosition = Math.floor(position);

    if (nowPosition !== prevPosition.current) {
      prevPosition.current = nowPosition;
      if (enableProgress) {
        prevRemaining.current = Math.floor(duration - position);
        setProgressPercent(Math.floor(position / duration * 100));
      }
    }
  }, [onTime, enableProgress]);

  const onVideoError = useCallback((error: ErrorEventData) => {
    trackPreviewError(error, {
      contentId: video.id,
      videoPlayerState,
      isMuted,
    });
    onError();
  }, [isMuted, onError, video.id, videoPlayerState]);

  const autostartOnPreviewComplete = useAutostartOnPreviewComplete();

  const onVideoComplete = useCallback(() => {
    if (loop) {
      setHasLooped(true);
      previewPlayerRef.current?.seek(0);
      return;
    }

    if (shouldAutoStartContent) {
      autostartOnPreviewComplete();
    }
    onComplete();
    reportPreviewFinishEvent(true);
  }, [shouldAutoStartContent, onComplete, reportPreviewFinishEvent, autostartOnPreviewComplete, loop]);

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

  const onStartupPerformance = useCallback(({ metrics }: StartupPerformanceEventData) => {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.PREVIEW_PERFORMANCE_METRIC,
      message: {
        content_id: video.id,
        metrics,
        total_time_to_first_frame: totalTimeToFirstFrame.current,
      },
    });
  }, [video.id]);

  const onBufferChange = useCallback(({ bufferPercent, duration }: { bufferPercent: number, duration: number}) => {
    if (isPlayable) return;
    const position = previewPlayerRef.current?.getPosition() || 0;
    const bufferedLength = duration * bufferPercent / 100 - position;
    if (bufferedLength > Math.min(backgroundInterval / 1000, duration - position)) {
      setIsPlayable(true);
    }
  }, [backgroundInterval, isPlayable]);

  const onPlaybackReady = useCallback(() => {
    if (__OTTPLATFORM__ === 'ANDROIDTV' || __OTTPLATFORM__ === 'PS5' || __OTTPLATFORM__ === 'COMCAST' || __WEBPLATFORM__ || isSamsung2018Or2019()) {
      setIsPlayable(true);
    }
  }, []);

  const onPlayerRemove = useCallback(() => {
    // Check player state to prevent reporting finish event twice
    if (previewPlayerRef.current?.getState() !== State.completed) reportPreviewFinishEvent();
    onRemove();
    previewPlayerRef.current = undefined;
    setIsPlayable(false);
    setIsPlayerCreated(false);
  }, [onRemove, reportPreviewFinishEvent]);

  const onPlayerCreate = useCallback((player: Player) => {
    setIsPlayable(false);
    previewPlayerRef.current = player;
    previewPlayerRef.current.on(PLAYER_EVENTS.startupPerformance, onStartupPerformance);
    previewPlayerRef.current.on(PLAYER_EVENTS.ready, onPlaybackReady);
    setIsPlayerCreated(true);
    // We don't need to handle the remove listener logic, the player will remove all listeners when we remove it
  }, [onStartupPerformance, onPlaybackReady]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.bufferChange, onBufferChange);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.bufferChange, onBufferChange);
    };
  }, [onBufferChange, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.once(PLAYER_EVENTS.firstFrame, onVideoStart);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.firstFrame, onVideoStart);
    };
  }, [onVideoStart, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.play, onPreviewPlayerPlay);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.play, onPreviewPlayerPlay);
    };
  }, [onPreviewPlayerPlay, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.time, onVideoTime);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.time, onVideoTime);
    };
  }, [onVideoTime, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.pause, onPreviewPlayerPause);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.pause, onPreviewPlayerPause);
    };
  }, [onPreviewPlayerPause, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.error, onVideoError);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.error, onVideoError);
    };
  }, [onVideoError, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.complete, onVideoComplete);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.complete, onVideoComplete);
    };
  }, [onVideoComplete, isPlayerCreated]);

  useEffect(() => {
    previewPlayerRef.current?.on(PLAYER_EVENTS.remove, onPlayerRemove);
    return () => {
      previewPlayerRef.current?.removeListener(PLAYER_EVENTS.remove, onPlayerRemove);
    };
  }, [onPlayerRemove, isPlayerCreated, video.id]);

  useEffect(() => {
    let stalledTimer: ReturnType<typeof setTimeout>;
    if (isVisible) {
      let position = previewPlayerRef.current?.getPrecisePosition();
      let prevTimestamp = now();
      // We increased the gap interval from 500ms to 1s after noticing 500ms was too small of a gap
      // on Kepler to see updates in currentPosition values
      const gap = 1000;
      stalledTimer = setInterval(() => {
        const currentPosition = previewPlayerRef.current?.getPrecisePosition();
        const currentTimestamp = now();
        const timestampDelta = currentTimestamp - prevTimestamp;
        if (timestampDelta < gap - 1) return;
        prevTimestamp = currentTimestamp;
        if (previewPlayerRef.current?.isPaused()) return;
        if (typeof currentPosition === 'number' && currentPosition > 0) {
          if (position === currentPosition) {
            previewPlayerRef.current?.pause();
            setIsPlayable(false);
          }
          position = currentPosition;
        } else {
          onStartUpStall?.();
        }
      }, gap);
    }
    return () => {
      clearInterval(stalledTimer);
    };
  }, [isVisible, onStartUpStall]);

  const previewPlayerBackground = classNames(backgroundClassname, {
    [styles.visible]: !isVisible && !isFidelityLevelLow,
  });

  return previewUrl || isReusable
    ? (
      <>
        <div
          className={className}
          style={!isVisible && isFidelityLevelLow ? { display: 'none' } : {}}
          title={intl.formatMessage(messages.clickToPlay)}
        >
          <VideoPlayer
            {...(!isReusable ? { key: video.id } : {})}
            videoPreviewUrl={previewUrl}
            captionSettings={captionSettings}
            onPlayerCreate={onPlayerCreate}
            data={video}
            autoStart={false}
            analyticsConfig={Analytics.getAnalyticsConfig()}
            performanceCollectorEnabled={performanceCollectorEnabled}
            useHlsNext={useHlsNext}
            playerName={PlayerName.Preview}
            preload={__OTTPLATFORM__ === 'PS4' ? undefined : 'force-auto'}
            customAdapter={AdapterTypes.HTML5}
            enableVideoSessionCollect
            forceHlsJS={false}
            userId={userId}
            // We don't enable preview player youbora, so we pass empty here
            youboraExperimentMap={FREEZED_EMPTY_OBJECT}
            allowReuse={isReusable}
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
