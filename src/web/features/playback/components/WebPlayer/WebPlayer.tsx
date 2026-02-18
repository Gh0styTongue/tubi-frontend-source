import type { ErrorEventData, Player } from '@adrise/player';
import { PlayerName } from '@adrise/player';
import Analytics from '@tubitv/analytics';
import React, { useCallback, useMemo } from 'react';

import { CaptionsErrorManagerWrapper } from 'client/features/playback/hooks/useCaptionsErrorManager';
import { OutPortal } from 'common/components/ReversePortal/ReversePortal';
import { useLocation } from 'common/context/ReactRouterModernContext';
import type { VideoPlayerProps } from 'common/features/playback/components/VideoPlayer/VideoPlayer';
import VideoPlayer from 'common/features/playback/components/VideoPlayer/VideoPlayer';
import { ViewTimeManagerWrapper } from 'common/features/playback/hooks/useViewTimeManager';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import type { PlaybackComponentExperimentProps } from 'common/HOCs/withExperiment';
import useAppSelector from 'common/hooks/useAppSelector';
import { vodPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { useWebPlayerPipExperiment } from 'common/selectors/experiments/webPlayerPipSelector';
import trackingManager from 'common/services/TrackingManager';
import type { UserAgent } from 'common/types/ui';
import type { Video, VideoResource } from 'common/types/video';
import { getVideoResolutionType } from 'common/utils/qualityLevels';
import { getUrlParam } from 'common/utils/urlManipulation';
import { useAudioTracks } from 'web/features/playback/components/WebPlayer/hooks/useAudioTracks';
import { usePip } from 'web/features/playback/components/WebPlayer/hooks/usePip';
import WebPlayerOverlay from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';

import { usePlayerPortal } from '../../contexts/playerPortalContext/playerPortalContext';
import { PlayerPortalWrapper } from '../PlayerPortalWrapper/PlayerPortalWrapper';

export interface WebPlayerProps extends PlaybackComponentExperimentProps {
  ready: boolean;
  video: Video;
  className: string;
  startPosition: number;
  prerollUrl: string;
  autoStart: boolean;
  poster: string;
  userAgent: UserAgent;
  videoResource: VideoResource | undefined;
  lastResourceRetryCount: number;
  tryFallbackVideoResource: (error: ErrorEventData) => VideoResource | undefined;
  playerErrorHandle: (error: ErrorEventData) => void;
  contentId: string;
  requestFullscreen: (value: boolean) => void;
  showAutoPlay: boolean;
  isMobile: boolean;
  title: string;
  seriesTitle: string | undefined;
  isFromAutoplay: boolean;
}

const WebPlayer: React.FC<WebPlayerProps> = (props) => {
  useTrackRerenders('WebPlayer');
  const {
    contentId,
    className,
    video,
    seriesTitle,
    prerollUrl,
    ready,
    autoStart,
    startPosition,
    poster,
    userAgent,
    // drm infos
    videoResource,
    lastResourceRetryCount,
    // experiments
    youboraExperimentMap,
    tryFallbackVideoResource,
    playerErrorHandle,
    requestFullscreen,
    showAutoPlay,
    isMobile = false,
    title,
    isFromAutoplay,
  } = props;
  const playerRef = React.useRef<InstanceType<typeof Player> | null>(null);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const captionSettings = useAppSelector(captionSettingsSelector);
  const performanceCollectorEnabled = useAppSelector(vodPerformanceMetricEnabledSelector);

  const isWebPipFeatureEnabled = useWebPlayerPipExperiment();
  const { playerPortalNode, getPlayerDisplayMode } = usePlayerPortal();

  // set up PiP
  const { pipEnabled, togglePictureInPicture } = usePip({ contentId });

  // set up audio track events
  const { setAudioTrack, getAudioTracks, getCurrentAudioTrack, setupAudioEvents } = useAudioTracks({ contentId });

  const trackPlayProgressEvent = useCallback((position: number, viewTime: number) => {
    const level = playerRef.current?.getQualityLevel();
    const videoResolution = getVideoResolutionType(level);

    trackingManager.trackPlayProgressEvent({
      contentId,
      resumePos: position,
      viewTime,
      isAutoplay: !!getUrlParam().autoplay,
      videoResolution,
      playerDisplayMode: getPlayerDisplayMode(),
    });
  }, [contentId, getPlayerDisplayMode]);

  const onPlayerCreate = useCallback((player: InstanceType<typeof Player>) => {
    playerRef.current = player;
    setupAudioEvents(player);
  }, [setupAudioEvents]);

  const location = useLocation();

  const player = playerRef.current;

  const {
    background: { toggle: backgroundToggle },
    font: { size: fontSize },
  } = captionSettings;

  const memoizedOverlayComponent = useMemo(() => {
    if (!ready) return null;
    const basicCaptionSettings = { fontSize, backgroundToggle };
    return (
      <WebPlayerOverlay
        video={video}
        requestFullscreen={requestFullscreen}
        showAutoPlay={showAutoPlay}
        isMobile={isMobile}
        seriesTitle={seriesTitle}
        title={title}
        isFromAutoplay={isFromAutoplay}
        basicCaptionSettings={basicCaptionSettings}
        getAudioTracks={getAudioTracks}
        setAudioTrack={setAudioTrack}
        getCurrentAudioTrack={getCurrentAudioTrack}
        pipEnabled={pipEnabled}
        togglePictureInPicture={togglePictureInPicture}
      />
    );
  }, [
    ready,
    video,
    requestFullscreen,
    showAutoPlay,
    isMobile,
    seriesTitle,
    title,
    isFromAutoplay,
    fontSize,
    backgroundToggle,
    getAudioTracks,
    setAudioTrack,
    getCurrentAudioTrack,
    pipEnabled,
    togglePictureInPicture,
  ]);

  // Extract shared VideoPlayer props
  const videoPlayerProps: VideoPlayerProps = useMemo(() => ({
    playerName: PlayerName.VOD,
    forceHlsJS: false,
    key: `${JSON.stringify(videoResource)}-${lastResourceRetryCount}`,
    data: video,
    title: seriesTitle || video.title,
    prerollUrl,
    onPlayerCreate,
    autoStart,
    resumePos: startPosition,
    poster,
    userAgent,
    videoResource,
    analyticsConfig: Analytics.getAnalyticsConfig(),
    performanceCollectorEnabled,
    enableVideoSessionCollect: true,
    youboraExperimentMap,
    tryFallbackVideoResource,
    playerErrorHandle,
    isDRMSupported,
    drmKeySystem,
    enableReposition: false,
    getPlayerDisplayMode,
    location,
  }), [
    videoResource,
    lastResourceRetryCount,
    video,
    seriesTitle,
    prerollUrl,
    onPlayerCreate,
    autoStart,
    startPosition,
    poster,
    userAgent,
    performanceCollectorEnabled,
    youboraExperimentMap,
    tryFallbackVideoResource,
    playerErrorHandle,
    isDRMSupported,
    drmKeySystem,
    getPlayerDisplayMode,
    location,
  ]);

  const memoizedVideoPlayerContent = useMemo(() => {
    if (!isWebPipFeatureEnabled) return null;

    return (
      <>
        <VideoPlayer {...videoPlayerProps} />
        <ViewTimeManagerWrapper track={trackPlayProgressEvent} />
        <CaptionsErrorManagerWrapper player={player} />
        {memoizedOverlayComponent}
      </>
    );
  }, [
    isWebPipFeatureEnabled,
    videoPlayerProps,
    trackPlayProgressEvent,
    player,
    memoizedOverlayComponent,
  ]);

  if (!isWebPipFeatureEnabled) {
    // Control group - unchanged behavior
    return (
      <div className={className} data-test-id="web-player-outer">
        <VideoPlayer {...videoPlayerProps} />
        <ViewTimeManagerWrapper track={trackPlayProgressEvent} />
        <CaptionsErrorManagerWrapper player={player} />
        {memoizedOverlayComponent}
      </div>
    );
  }

  // Experimental group - portal behavior
  return (
    <div className={className} data-test-id="web-player-outer">
      <PlayerPortalWrapper contentId={contentId}>
        {memoizedVideoPlayerContent}
      </PlayerPortalWrapper>
      <OutPortal node={playerPortalNode} />
    </div>
  );
};

export default WebPlayer;
