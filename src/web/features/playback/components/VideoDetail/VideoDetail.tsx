import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { RESUME_TYPE } from 'common/constants/player';
import WebLastVideoResourceRetry from 'common/experiments/config/webLastVideoResourceRetry';
import WebSkipAdWithHealthscore from 'common/experiments/config/webSkipAdWithHealthscore';
import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { useYouboraExperimentMap } from 'common/features/playback/hooks/useYouboraExperimentMap';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isInWebMobileDetailsRedesignSelector } from 'common/selectors/experiments/webMobileDetailsRedesign';
import { shouldShowMatureContentModalSelector } from 'common/selectors/fire';
import { isFullscreenSelector, isMobileDeviceSelector, userAgentSelector } from 'common/selectors/ui';
import { seriesByContentIdSelector } from 'common/selectors/video';
import FeatureSwitchManager, { AD_MOCK_LIST } from 'common/services/FeatureSwitchManager';
import type { Video } from 'common/types/video';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import { getDeepLinkForVideo } from 'common/utils/urlConstruction';
import { isWebTheaterPlayerUrl } from 'common/utils/urlPredicates';
import PlaybackInfo from 'ott/features/playback/components/PlaybackInfo/PlaybackInfo';
import { useGetStartPosition } from 'web/features/playback/components/VideoDetail/hooks/useGetStartPosition';
import { useHandlePlayerErrors } from 'web/features/playback/components/VideoDetail/hooks/useHandlePlayerErrors';
import { useManagePlayerLifecycle } from 'web/features/playback/components/VideoDetail/hooks/useManagePlayerLifecycle';
import { usePlayerFullscreen } from 'web/features/playback/components/VideoDetail/hooks/usePlayerFullscreen';
import { useTryFallbackVideoResource } from 'web/features/playback/components/VideoDetail/hooks/useTryFallbackVideoResource';
import { useVideoErrorModal } from 'web/features/playback/components/VideoDetail/hooks/useVideoErrorModal';
import { useVideoResourceManager } from 'web/features/playback/components/VideoDetail/hooks/useVideoResourceManager';
import { useGetPosterUrl } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/useGetPosterUrl';
import WebErrorModal from 'web/features/playback/components/WebErrorModal/WebErrorModal';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import { isDrmKeySystemReadySelector } from 'web/features/playback/selectors/drm';
import { renderControlsSelector } from 'web/features/playback/selectors/ui';
import { getIsFromAutoplay } from 'web/features/playback/utils/getIsFromAutoplay';
import BackgroundImage from 'web/rd/components/BackgroundImage/BackgroundImage';
import ContentDetail from 'web/rd/components/ContentDetail/ContentDetail';

import ContentDetailSkeleton from './ContentDetailSkeleton/ContentDetailSkeleton';
import PlayerArea from './PlayerArea/PlayerArea';
import PlayerAreaSkeleton from './PlayerAreaSkeleton/PlayerAreaSkeleton';
import styles from './VideoDetail.scss';

export interface VideoDetailProps extends WithRouterProps {
  video: Video;
  isContentReady: boolean;
  isContentUnavailable: boolean;
  contentId: string;
  setNoVideoResourceFound: () => void;
  showRemindMe: boolean;
}

const VideoDetail = (props: VideoDetailProps) => {
  useTrackRerenders('VideoDetail');

  const {
    contentId,
    isContentReady,
    video,
    location: { query, pathname },
    isContentUnavailable,
    setNoVideoResourceFound,
    showRemindMe,
  } = props;
  // route derivations
  const isFromAutoplay = getIsFromAutoplay(query);
  const { startPosition } = useGetStartPosition({ contentId });

  // Redux store derivations
  const deviceId = useAppSelector(deviceIdSelector);
  const isDrmKeySystemReady = useAppSelector(isDrmKeySystemReadySelector);
  const renderControls = useAppSelector(renderControlsSelector);
  const userAgent = useAppSelector(userAgentSelector);
  const isSafari = userAgent?.browser?.name === 'Safari';
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, contentId));
  const [resumePosition, setResumePosition] = useState(0);
  const { youboraExperimentMap } = useYouboraExperimentMap();
  const isTheaterMode = isWebTheaterPlayerUrl(pathname);
  const series = useAppSelector((state) => seriesByContentIdSelector(state, contentId));
  const isFullscreen = useAppSelector(isFullscreenSelector);
  const { posterUrl } = useGetPosterUrl(contentId, video);
  const shouldShowMatureContentModal = useAppSelector(shouldShowMatureContentModalSelector);
  const isContentLoginGated = shouldShowMatureContentModal(video);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);

  const handleWatch = useCallback(() => {
    if (isMobile) {
      window.location.href = getDeepLinkForVideo(video, deviceId, {
        stopTracking: !isThirdPartySDKTrackingEnabled,
      });

    }
  }, [isThirdPartySDKTrackingEnabled, isMobile, deviceId, video]);

  // Prop derivations
  const isDeeplink = isDeepLinkOnWeb(query);

  // Experiments
  const webLastVideoResourceRetry = useExperiment(WebLastVideoResourceRetry);
  useExperiment(WebSkipAdWithHealthscore);

  useEffect(() => {
    webLastVideoResourceRetry.logExposure();
  }, [webLastVideoResourceRetry]);

  const {
    videoResourceManager,
    showDRMUnsupportedWarning,
    videoResource,
    setVideoResource,
  } = useVideoResourceManager({ video, isContentReady });

  // Fullscreen
  const { requestFullscreen } = usePlayerFullscreen({ contentId });

  const { tryFallbackVideoResource } = useTryFallbackVideoResource({
    video,
    videoResourceManager,
    setResumePosition,
    startPosition,
    setVideoResource,
  });

  const {
    showAlertModal,
    handleErrorModalClose,
    isErrorModalOpen,
    errorModalOpenDetails,
    lastResourceRetryCount,
  } = useVideoErrorModal({
    video,
    resumePosition,
    isFromAutoplay,
    isDeeplink,
  });

  const {
    removePlayer,
    playerReady,
    blockAutoStart,
    getAutoStart,
    isPrerollEnabled,
    getContentAdUrl,
    showAutoPlay,
  } = useManagePlayerLifecycle({
    video,
    startPosition,
    showAlertModal,
    isSafari,
    videoResourceManager,
    isContentReady,
    videoResource,
    isFromAutoplay,
    isDeeplink,
  });

  const { handlePlayerErrors, playerError } = useHandlePlayerErrors({ blockAutoStart });

  const resumeType = startPosition > 0 ? RESUME_TYPE.STOP : undefined;
  const prerollUrl = isPrerollEnabled() ? getContentAdUrl(startPosition, resumeType) : AD_MOCK_LIST.EmptyAd;

  const isEpisode = !!video.series_id;
  let seriesTitle: string | undefined;
  if (series) {
    seriesTitle = series.title;
  }

  const { hero_images: heroImages = [], posterarts: posters = [], backgrounds = [], images = {} } = (isEpisode ? series : video) || {};
  const desktopBackground = backgrounds[0] || heroImages[0] || posters[0];
  const mobileBackground = images.hero_422 && images.hero_422[0];
  const shouldDisableBackground = !isMobile && !isContentUnavailable;

  const position = playerReady && resumePosition ? resumePosition : startPosition;

  const autoStart = getAutoStart();

  const shouldHidePlayer = isMatureContentGated || isContentUnavailable;
  const shouldShowPlayerSkeleton = !isContentReady && !shouldHidePlayer;
  const videoResourceUrl = video.video_resources?.[0]?.manifest.url; // Trigger to re-render when get video resource we re-query for expired url case
  const isInWebMobileDetailsRedesign = useAppSelector(isInWebMobileDetailsRedesignSelector);

  const renderPlayerContent = () => {
    if (shouldShowPlayerSkeleton) {
      return <PlayerAreaSkeleton />;
    }

    if (shouldHidePlayer) {
      return null;
    }

    return (
      <PlayerArea
        key={`${video.id}-${Boolean(autoStart)}-${videoResourceUrl}`}
        isMobile={!!isMobile}
        deviceId={deviceId}
        video={video}
        isContentLoginGated={isContentLoginGated}
        showAutoPlay={showAutoPlay}
        removePlayer={removePlayer}
        prerollUrl={prerollUrl as string}
        playerReady={playerReady}
        seriesTitle={seriesTitle}
        isContentReady={isContentReady}
        showDRMUnsupportedWarning={showDRMUnsupportedWarning}
        autoStart={autoStart}
        startPosition={position}
        playerError={playerError ?? undefined}
        isFromAutoplay={isFromAutoplay}
        videoResource={videoResource}
        lastResourceRetryCount={lastResourceRetryCount}
        requestFullscreen={requestFullscreen}
        youboraExperimentMap={youboraExperimentMap}
        tryFallbackVideoResource={tryFallbackVideoResource}
        playerErrorHandle={handlePlayerErrors}
        contentId={contentId}
        setNoVideoResourceFound={setNoVideoResourceFound}
      />
    );
  };

  return (
    <div className={classNames(styles.contentContainer, {
      [styles.transportShowup]: renderControls,
      [styles.fullscreen]: isFullscreen,
      [styles.theaterMode]: isTheaterMode,
    })}
    >
      {shouldDisableBackground ? null : (
        <BackgroundImage
          preload
          src={desktopBackground}
          srcMobile={mobileBackground}
          isMobileRedesign={isInWebMobileDetailsRedesign}
          content={video}
          seriesContent={series}
          seriesTitle={seriesTitle}
        />
      )}

      {!isInWebMobileDetailsRedesign && (
        <div
          className={classNames(styles.positionPlayer, {
            [styles.collapsed]: !playerReady && !shouldShowPlayerSkeleton,
            [styles.fullscreen]: isFullscreen,
            [styles.hidden]: shouldHidePlayer,
          })}
        >
          {renderPlayerContent()}
          {isDrmKeySystemReady && FeatureSwitchManager.isEnabled(['Player', 'Info']) ? /* istanbul ignore next */ <PlaybackInfo
            className={classNames(styles.PlaybackInfoWrapper)}
            videoResourceManager={videoResourceManager ?? undefined}
            youboraExperimentMap={youboraExperimentMap}
          /> : null }
        </div>
      )}
      <div className={classNames(styles.positionContentDetail, {
        [styles.hidden]: isFullscreen,
        [styles.noPlayer]: shouldHidePlayer,
        [styles.mobileRedesign]: isInWebMobileDetailsRedesign,
      })}
      >
        {isContentReady && !isTheaterMode ? (
          <ContentDetail
            posterUrl={posterUrl}
            belongSeries={video.series_id}
            content={video}
            seasons={(series || {}).seasons}
            seriesTitle={isEpisode ? seriesTitle : undefined}
            shouldShowContentUnavailable={isContentUnavailable}
            showRemindMe={showRemindMe}
            audioTracks={videoResource?.audio_tracks}
            isMatureContentGated={isMatureContentGated}
            isMobileRedesign={isInWebMobileDetailsRedesign}
            seriesContent={series}
            onClickWatch={isInWebMobileDetailsRedesign ? handleWatch : undefined}
          />
        ) : !isContentReady && !isTheaterMode ? (
          <ContentDetailSkeleton
            _isMobileRedesign={isInWebMobileDetailsRedesign}
          />
        ) : null}
      </div>
      <WebErrorModal
        isOpen={isErrorModalOpen}
        onClose={handleErrorModalClose}
        playerErrorDetails={errorModalOpenDetails}
      />
    </div>
  );
};

export default withRouter(VideoDetail);
