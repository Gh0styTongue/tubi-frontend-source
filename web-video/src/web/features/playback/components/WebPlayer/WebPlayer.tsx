import type { ErrorEventData, Player } from '@adrise/player';
import { PlayerName } from '@adrise/player';
import { isMobileWebkit } from '@adrise/utils/lib/ua-sniffing';
import Analytics from '@tubitv/analytics';
import React, { useEffect, useCallback } from 'react';

import { CaptionsErrorManagerWrapper } from 'client/features/playback/hooks/useCaptionsErrorManager';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import WebHlsUpgrade from 'common/experiments/config/webHlsUpgrade';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import VideoPlayer from 'common/features/playback/components/VideoPlayer/VideoPlayer';
import { ViewTimeManagerWrapper } from 'common/features/playback/hooks/useViewTimeManager';
import { adRequestProcessorForWeb } from 'common/features/playback/utils/adTools';
import type { PlaybackComponentExperimentProps } from 'common/HOCs/withExperiment';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { playerHlsNormalizationUpgradeSelector } from 'common/selectors/experiments/playerHlsNormalizationUpgrade';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import trackingManager from 'common/services/TrackingManager';
import type { WebCaptionSettingsState } from 'common/types/captionSettings';
import type { UserAgent } from 'common/types/ui';
import type { Video, VideoResource } from 'common/types/video';
import { getVideoResolutionType } from 'common/utils/qualityLevels';
import { getUrlParam } from 'common/utils/urlManipulation';
import { useAudioTracks } from 'web/features/playback/components/WebPlayer/hooks/useAudioTracks';
import { usePip } from 'web/features/playback/components/WebPlayer/hooks/usePip';
import WebPlayerOverlay from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';
export interface WebPlayerProps extends PlaybackComponentExperimentProps {
  ready: boolean;
  video: Video;
  className?: string;
  startPosition?: number;
  belongSeries?: string | number;
  prerollUrl: string;
  onPlayerCreate: (player: InstanceType<typeof Player>, playerManagers?: PlayerManagers) => void;
  autoStart?: boolean;
  captionSettings: WebCaptionSettingsState;
  poster?: string;
  userAgent?: UserAgent;
  videoResource?: VideoResource;
  lastResourceRetryCount?: number;
  adBreaks?: number[];
  performanceCollectorEnabled?: boolean;
  tryFallbackVideoResource?: (error: ErrorEventData) => VideoResource | undefined;
  playerErrorHandle?: (error: ErrorEventData) => void;
  getVideoResource?: () => VideoResource | undefined;
  contentId: string;
  requestFullscreen: (value: boolean) => void;
  showAutoPlay?: boolean;
  isMobile: boolean;
  title: string;
  seriesTitle: string | undefined;
  isFromAutoplay: boolean;
  isFullscreen: boolean;
}

const WebPlayer: React.FC<WebPlayerProps> = (props) => {
  const {
    contentId,
    onPlayerCreate: propsOnPlayerCreate,
    className,
    video,
    seriesTitle,
    belongSeries,
    prerollUrl,
    ready,
    autoStart = false,
    startPosition,
    captionSettings,
    poster,
    userAgent,
    // drm infos
    videoResource,
    lastResourceRetryCount,
    // experiments
    performanceCollectorEnabled,
    youboraExperimentMap,
    tryFallbackVideoResource,
    playerErrorHandle,
    getVideoResource,
    requestFullscreen,
    showAutoPlay,
    isMobile = false,
    title,
    adBreaks,
    isFromAutoplay,
    isFullscreen,
  } = props;
  const playerRef = React.useRef<InstanceType<typeof Player> | null>(null);
  const shouldUseHlsNext = useAppSelector(playerHlsNormalizationUpgradeSelector);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const userId = useAppSelector(userIdSelector);

  // set up PiP
  const { pipEnabled, togglePictureInPicture } = usePip({ contentId, player: playerRef.current });

  // set up audio track events
  const { setAudioTrack, getAudioTracks, getCurrentAudioTrack, setupAudioEvents } = useAudioTracks({ contentId });

  // webHlsNormalizationUpgrade experiment
  const webHlsUpgrade = useExperiment(WebHlsUpgrade);

  useEffect(() => {
    webHlsUpgrade.logExposure();
  }, [webHlsUpgrade]);

  const trackPlayProgressEvent = useCallback((position: number, viewTime: number) => {
    const level = playerRef.current?.getQualityLevel();
    const videoResolution = getVideoResolutionType(level);

    trackingManager.trackPlayProgressEvent({
      contentId,
      resumePos: position,
      viewTime,
      isAutoplay: !!getUrlParam().autoplay,
      videoResolution,
    });
  }, [contentId]);

  const onPlayerCreate = useCallback((player: InstanceType<typeof Player>, playerManagers?: PlayerManagers) => {
    playerRef.current = player;
    setupAudioEvents(player);
    propsOnPlayerCreate(player, playerManagers);
  }, [setupAudioEvents, propsOnPlayerCreate]);

  /**
   * Mobile webkit browsers have stricter rules for programmatically playing
   * video elements than other browsers. The play promise for midroll ads often
   * fails on mobile webkit browsers, so we reuse the video element to avoid
   * this issue (the video element was interacted with the user and therefore
   * we're allowed to play it programmatically when it is unmuted)
   */
  const shouldReuseVideoElement = userAgent && isMobileWebkit(userAgent);

  const player = playerRef.current;

  const enableReposition = getVideoResource !== undefined;
  const {
    background: { toggle: backgroundToggle },
    font: { size: fontSize },
  } = captionSettings;

  const basicCaptionSettings = { fontSize, backgroundToggle };

  let overlayComponent = null;
  if (ready) {
    overlayComponent = <WebPlayerOverlay
      player={player}
      video={video}
      requestFullscreen={requestFullscreen}
      showAutoPlay={showAutoPlay}
      isMobile={isMobile}
      seriesTitle={seriesTitle}
      title={title}
      adBreaks={adBreaks}
      isFromAutoplay={isFromAutoplay}
      basicCaptionSettings={basicCaptionSettings}
      getAudioTracks={getAudioTracks}
      setAudioTrack={setAudioTrack}
      getCurrentAudioTrack={getCurrentAudioTrack}
      isFullscreen={isFullscreen}
      pipEnabled={pipEnabled}
      togglePictureInPicture={togglePictureInPicture}
    />;
  }

  return (
    <div className={className} data-test-id="web-player-outer">
      <VideoPlayer
        playerName={PlayerName.VOD}
        forceHlsJS={false}
        key={`${JSON.stringify(enableReposition ? {} : videoResource)}-${lastResourceRetryCount}`}
        data={video}
        title={seriesTitle || video.title}
        isSeriesContent={!!belongSeries}
        prerollUrl={prerollUrl}
        onPlayerCreate={onPlayerCreate}
        autoStart={autoStart}
        resumePos={startPosition}
        captionSettings={captionSettings}
        poster={poster}
        userAgent={userAgent}
        userId={userId}
        videoResource={enableReposition ? undefined : videoResource}
        getVideoResource={getVideoResource}
        analyticsConfig={Analytics.getAnalyticsConfig()}
        reuseVideoElement={shouldReuseVideoElement}
        performanceCollectorEnabled={performanceCollectorEnabled}
        useHlsNext={shouldUseHlsNext}
        enableVideoSessionCollect
        youboraExperimentMap={youboraExperimentMap}
        tryFallbackVideoResource={tryFallbackVideoResource}
        playerErrorHandle={playerErrorHandle}
        isDRMSupported={isDRMSupported}
        drmKeySystem={drmKeySystem}
        enableReposition={enableReposition}
        adRequestPreProcessor={adRequestProcessorForWeb(FeatureSwitchManager.isDefault(['Ad', 'MockUrl']))}
      />
      {overlayComponent}
      <ViewTimeManagerWrapper
        player={player}
        track={trackPlayProgressEvent}
      />
      <CaptionsErrorManagerWrapper player={player} />
    </div>
  );
};

export default WebPlayer;
