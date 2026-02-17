import type {
  Player,
} from '@adrise/player';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import PlayerStartupManager from 'client/features/playback/services/PlayerStartupManager';
import { RESUME_TYPE } from 'common/constants/player';
import WebIosPlayback, { WEB_IOS_PLAYBACK_VARIANTS } from 'common/experiments/config/webIosPlayback';
import WebLastVideoResourceRetry from 'common/experiments/config/webLastVideoResourceRetry';
import WebRepositionVideoResource from 'common/experiments/config/webRepositionVideoResource';
import WebSkipAdWithHealthscore from 'common/experiments/config/webSkipAdWithHealthscore';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import { useYouboraExperimentMap } from 'common/features/playback/hooks/useYouboraExperimentMap';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isMobileDeviceSelector, userAgentSelector } from 'common/selectors/ui';
import FeatureSwitchManager, { AD_MOCK_LIST } from 'common/services/FeatureSwitchManager';
import type { WebCaptionSettingsState } from 'common/types/captionSettings';
import type { History } from 'common/types/history';
import type { Video } from 'common/types/video';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import PlaybackInfo from 'ott/features/playback/components/PlaybackInfo/PlaybackInfo';
import { useHandlePlayerErrors } from 'web/features/playback/components/VideoDetail/hooks/useHandlePlayerErrors';
import { useManagePlayerLifecycle } from 'web/features/playback/components/VideoDetail/hooks/useManagePlayerLifecycle';
import { usePlayerFullscreen } from 'web/features/playback/components/VideoDetail/hooks/usePlayerFullscreen';
import { useSetupVodSessions } from 'web/features/playback/components/VideoDetail/hooks/useSetupVodSessions';
import { useTryFallbackVideoResource } from 'web/features/playback/components/VideoDetail/hooks/useTryFallbackVideoResource';
import { useVideoErrorModal } from 'web/features/playback/components/VideoDetail/hooks/useVideoErrorModal';
import { useVideoResourceManagerOldPosition } from 'web/features/playback/components/VideoDetail/hooks/useVideoResourceManagerOldPosition';
import { useTheaterMode } from 'web/features/playback/components/VideoDetail/PlayerArea/hooks/useTheaterMode';
import WebErrorModal from 'web/features/playback/components/WebErrorModal/WebErrorModal';
import { drmKeySystemSelector, isDrmKeySystemReadySelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';
import { renderControlsSelector } from 'web/features/playback/selectors/ui';
import { getIsFromAutoplay } from 'web/features/playback/utils/getIsFromAutoplay';
import BackgroundImage from 'web/rd/components/BackgroundImage/BackgroundImage';
import ContentDetail from 'web/rd/components/ContentDetail/ContentDetail';

import PlayerArea from './PlayerArea/PlayerArea';
import MoreDetailBottom from './TheaterMode/MoreDetailBottom';
import { getVideoResource, getVideoResourceManager } from './utils/getVideoResource';
import styles from './VideoDetail.scss';

export interface VideoDetailProps extends WithRouterProps {
  video: Video;
  startPosition: number;
  belongSeries: string | undefined;
  viewHistory?: History;
  series?: Video;
  adBreaks: number[];
  aboveParental?: boolean;
  posterUrl?: string;
  userBirthday?: string;
  seasonIndex?: number;
  episodeIndex?: number;
  isInMobileWhitelist?: boolean;
  // chromecast session connected
  isCasting: boolean;
  captionSettings: WebCaptionSettingsState;
  isContentReady: boolean;
  isFullscreen: boolean;
  isContentLoginGated?: boolean;
  isKidsModeEnabled: boolean;
  isContentUnavailable: boolean;
  performanceCollectorEnabled: boolean;
  contentId: string;
  setNoVideoResourceFound: () => void;
  showRemindMe: boolean;
}

const VideoDetail = (props: VideoDetailProps) => {
  const {
    contentId,
    isContentReady,
    video,
    location: { query },
    adBreaks,
    belongSeries,
    startPosition,
    series,
    viewHistory,
    posterUrl,
    seasonIndex,
    episodeIndex,
    aboveParental,
    isInMobileWhitelist,
    isCasting,
    userBirthday,
    captionSettings,
    isFullscreen,
    isContentLoginGated,
    isKidsModeEnabled,
    performanceCollectorEnabled,
    isContentUnavailable,
    setNoVideoResourceFound,
    showRemindMe,
  } = props;

  const dispatch = useAppDispatch();

  // ✨🌟✨ the player ✨🌟✨
  const playerRef = useRef<InstanceType<typeof Player> | null>(null);

  // route derivations
  const isFromAutoplay = getIsFromAutoplay(query);

  // Redux store derivations
  const deviceId = useAppSelector(deviceIdSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isDrmKeySystemReady = useAppSelector(isDrmKeySystemReadySelector);
  const renderControls = useAppSelector(renderControlsSelector);
  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const userAgent = useAppSelector(userAgentSelector);
  const isSafari = userAgent?.browser?.name === 'Safari';
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, contentId));
  const [resumePosition, setResumePosition] = useState(0);
  const { youboraExperimentMap } = useYouboraExperimentMap();

  // Prop derivations
  const isDeeplink = isDeepLinkOnWeb(query);

  // VOD page and VOD playback session initialization
  const { reportPlaybackSessionData } = useSetupVodSessions({ video, isFromAutoplay, isDeeplink, resumePosition });

  // Experiments
  const webLastVideoResourceRetry = useExperiment(WebLastVideoResourceRetry);
  useExperiment(WebSkipAdWithHealthscore);

  useEffect(() => {
    webLastVideoResourceRetry.logExposure();
  }, [webLastVideoResourceRetry]);

  const webIosPlayback = useExperiment(WebIosPlayback);
  const webRepositionVideoResource = useExperiment(WebRepositionVideoResource);

  // Video resource (old location pending reposition experiment)
  const {
    videoResourceManagerOldPosition,
    showDRMUnsupportedWarning,
    videoResourceOldPosition,
    setVideoResourceOldPosition,
  } = useVideoResourceManagerOldPosition({ video, isContentReady });
  const enableReposition = FeatureSwitchManager.isEnabled(['Player', 'EnableReposition']) || webRepositionVideoResource.getValue();

  // Fullscreen
  const { requestFullscreen } = usePlayerFullscreen({ contentId, playerRef });

  useEffect(() => {
    const playerStartupManager = PlayerStartupManager.getInstance();
    playerStartupManager?.recordEvent('ReactRendered');
  }, []);

  const { tryFallbackVideoResource } = useTryFallbackVideoResource({
    video,
    videoResourceManager: videoResourceManagerOldPosition,
    setResumePosition,
    startPosition,
    playerRef,
    setVideoResource: setVideoResourceOldPosition,
  });

  const { isTheater, showMetaInTheaterMode, clickMoreDetail, positionPlayerRef } = useTheaterMode({
    dispatch,
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
  });

  const {
    onPlayerCreate,
    removePlayer,
    playerReady,
    blockAutoStart,
    getAutoStart,
    isPrerollEnabled,
    getContentAdUrl,
    showAutoPlay,
  } = useManagePlayerLifecycle({
    video,
    playerRef,
    isLoggedIn,
    startPosition,
    showAlertModal,
    isSafari,
    webRepositionVideoResource,
    drmKeySystem,
    isDRMSupported,
    videoResourceManagerOldPosition,
    isContentReady,
    videoResourceOldPosition,
    reportPlaybackSessionData,
    adBreaks,
    isFromAutoplay,
    isDeeplink,
  });

  const { handlePlayerErrors, playerError } = useHandlePlayerErrors({ blockAutoStart });

  // from the old class component-- below this point references to the
  // video resource manager old position may be undefined if in the treatment
  const maybeVideoResourceManagerOldPosition = useMemo(
    () => (enableReposition ? undefined : videoResourceManagerOldPosition),
    [enableReposition, videoResourceManagerOldPosition]
  );

  const videoResource = getVideoResource(
    {
      webRepositionVideoResource,
      video,
      drmKeySystem,
      isDRMSupported,
      videoResourceManager: maybeVideoResourceManagerOldPosition,
      isContentReady,
      videoResource: videoResourceOldPosition,
    });
  const videoResourceManager = getVideoResourceManager({
    video,
    drmKeySystem,
    isDRMSupported,
    videoResourceManager: maybeVideoResourceManagerOldPosition,
    webRepositionVideoResource,
    isContentReady,
  });

  const resumeType = startPosition > 0 ? RESUME_TYPE.STOP : undefined;
  const prerollUrl = isPrerollEnabled() ? getContentAdUrl(startPosition, resumeType) : AD_MOCK_LIST.EmptyAd;

  const isEpisode = !!belongSeries;
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

  const shouldEnableWebIosPlayback = webIosPlayback.getValue() !== WEB_IOS_PLAYBACK_VARIANTS.DISABLED;

  const shouldHidePlayer = isMatureContentGated || isContentUnavailable || !isContentReady;

  return (
    <div className={classNames(styles.contentContainer, {
      [styles.transportShowup]: renderControls,
      [styles.fullscreen]: isFullscreen,
      [styles.theater]: isTheater,
    })}
    >
      {shouldDisableBackground ? null : (
        <BackgroundImage preload src={desktopBackground} srcMobile={mobileBackground} />
      )}
      <div
        className={classNames(styles.positionPlayer, {
          [styles.collapsed]: !playerReady,
          [styles.fullscreen]: isFullscreen,
          [styles.hidden]: shouldHidePlayer,
          [styles.theater]: isTheater,
        })}
        ref={positionPlayerRef}
      >
        {shouldHidePlayer ? null : (
          <PlayerArea
            key={`${video.id}-${autoStart ? 'true' : 'false'}`}
            isMobile={!!isMobile}
            belongSeries={belongSeries}
            viewHistory={viewHistory}
            deviceId={deviceId}
            video={video}
            adBreaks={adBreaks}
            aboveParental={aboveParental}
            isContentLoginGated={isContentLoginGated}
            showAutoPlay={showAutoPlay}
            onPlayerCreate={onPlayerCreate}
            removePlayer={removePlayer}
            prerollUrl={prerollUrl as string}
            mobilePlaybackEnabled={isInMobileWhitelist}
            playerReady={playerReady}
            isCasting={isCasting}
            seriesTitle={seriesTitle}
            userBirthday={userBirthday}
            isContentReady={isContentReady}
            showDRMUnsupportedWarning={showDRMUnsupportedWarning}
            autoStart={autoStart}
            startPosition={position}
            captionSettings={captionSettings}
            playerError={playerError ?? undefined}
            isFullscreen={isFullscreen}
            isFromAutoplay={isFromAutoplay}
            isKidsModeEnabled={isKidsModeEnabled}
            videoResource={enableReposition ? undefined : videoResource}
            getVideoResource={enableReposition ? () => getVideoResource({
              webRepositionVideoResource,
              video,
              drmKeySystem,
              isDRMSupported,
              videoResourceManager,
              isContentReady,
              videoResource,
            }) : undefined}
            getVideoResourceManager={() => getVideoResourceManager({
              video,
              drmKeySystem,
              isDRMSupported,
              videoResourceManager,
              webRepositionVideoResource,
              isContentReady,
            })}
            lastResourceRetryCount={lastResourceRetryCount}
            requestFullscreen={requestFullscreen}
            performanceCollectorEnabled={performanceCollectorEnabled}
            youboraExperimentMap={youboraExperimentMap}
            shouldEnableWebIosPlayback={shouldEnableWebIosPlayback}
            tryFallbackVideoResource={tryFallbackVideoResource}
            playerErrorHandle={handlePlayerErrors}
            contentId={contentId}
            setNoVideoResourceFound={setNoVideoResourceFound}
          />
        )}
        {isDrmKeySystemReady && FeatureSwitchManager.isEnabled(['Player', 'Info']) ? /* istanbul ignore next */ <PlaybackInfo
          className={classNames(styles.PlaybackInfoWrapper)}
          videoResourceManager={videoResourceManager ?? undefined}
          youboraExperimentMap={youboraExperimentMap}
        /> : null }
      </div>
      { !isTheater ? null : (
        <div className={classNames(styles.moreDetailBottom, {
          [styles.visible]: !showMetaInTheaterMode,
          [styles.hidden]: showMetaInTheaterMode,
        })}
        >
          <MoreDetailBottom onClick={clickMoreDetail} />
        </div>)
      }
      <div className={classNames(styles.positionContentDetail, {
        [styles.hidden]: isFullscreen,
        [styles.noPlayer]: shouldHidePlayer,
        [styles.theater]: isTheater,
      })}
      >
        {isContentReady && <ContentDetail
          belongSeries={belongSeries}
          content={video}
          seasons={(series || {}).seasons}
          seriesTitle={isEpisode ? seriesTitle : undefined}
          posterUrl={posterUrl}
          seasonIndex={seasonIndex}
          episodeIndex={episodeIndex}
          shouldShowContentUnavailable={isContentUnavailable}
          showRemindMe={showRemindMe}
          audioTracks={videoResource?.audio_tracks}
          isMatureContentGated={isMatureContentGated}
        />}
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
