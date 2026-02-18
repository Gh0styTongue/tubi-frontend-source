import type {
  Player,
  AdapterConfig,
  ErrorEventData,
  PlayerConfig,
  DrmKeySystem,
  AdapterTypes,
  AdPod } from '@adrise/player';
import {
  State,
} from '@adrise/player';
import useLatestForEffect from '@adrise/utils/lib/useLatestForEffect';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import classNames from 'classnames';
import type { Location } from 'history';
import React, { useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';

import type { setup } from 'client/features/playback/monitor/monitoring';
import PlayerStartupManager from 'client/features/playback/services/PlayerStartupManager';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { trackPlayerStartupMetric } from 'client/features/playback/track/client-log';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { exposeToTubiGlobal } from 'client/global';
import { isCrawler } from 'client/utils/isCrawler';
import { getExperiment } from 'common/experimentV2';
import PlayerNewerGetAudioConfig from 'common/experimentV2/configs/webottPlayerNewerGetAudioConfig';
import type SuitestPlayerAdapter from 'common/features/playback/components/SuitestPlayerAdapter/SuitestPlayerAdapter';
import type { AdapterType } from 'common/features/playback/components/VideoPlayer/hooks/useBuildPlayer';
import { useBuildPlayer } from 'common/features/playback/components/VideoPlayer/hooks/useBuildPlayer';
import { useGetCaptionsConfig } from 'common/features/playback/components/VideoPlayer/hooks/useGetCaptionsConfig';
import { useGetVideoResource } from 'common/features/playback/components/VideoPlayer/hooks/useGetVideoResource';
import { useSetupYouboraMonitoring } from 'common/features/playback/components/VideoPlayer/hooks/useSetupYouboraMonitoring';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import { withPlayerExtensionAndExperimentalConfig } from 'common/features/playback/HOCs/withPlayerExtensionAndExperimentalConfig';
import type { WithPlayerExtensionAndExperimentalConfigProps } from 'common/features/playback/HOCs/withPlayerExtensionAndExperimentalConfig';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import { isYouboraEnabled } from 'common/selectors/experiments/remoteConfig';
import { useWebPlayerPipExperiment } from 'common/selectors/experiments/webPlayerPipSelector';
import type { UserAgent } from 'common/types/ui';
import type { Video, VideoResource } from 'common/types/video';
import hasTrailerValue from 'common/utils/hasTrailerValue';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';

import { loadCustomAdapter } from './utils/loadCustomAdapter';
import styles from './VideoPlayer.scss';
import { useGetPlayerInstance } from '../../context/playerContext/hooks/useGetPlayerInstance';
import { useOnDecoupledPlayerCreate } from '../../context/playerContext/hooks/useOnDecoupledPlayerCreate';
import { getPlayerHTMLString } from '../../utils/getPlayerAdapter';

export interface VideoPlayerProps extends
  WithPlayerExtensionAndExperimentalConfigProps {
    autoStart?: boolean,
    getAutoStart?: () => boolean,
    performanceCollectorEnabled?: boolean;
    poster?: string,
    prerollUrl?: string,
    reuseVideoElement?: boolean;
    preload?: AdapterConfig['preload'];
    enableVideoSessionCollect?: boolean
    tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined;
    playerErrorHandle?: (error: ErrorEventData) => void;
    data: Video,
    cls?: string,
    customAdapter?: AdapterTypes;
    drmKeySystem?: DrmKeySystem;
    enableFrontBufferFlush?: boolean;
    enableReposition?: boolean;
    isDRMSupported?: boolean;
    onPlayerCreate?: (player: Player, playerManagers: PlayerManagers) => void,
    playerName: PlayerConfig['playerName'];
    title?: string,
    userAgent?: UserAgent;
    getPlayerDisplayMode?: () => PlayerDisplayMode;
    preFetchPrerollAds?: Promise<AdPod>;
    /**
     * Location is passed as a prop instead of using useLocation since VideoPlayer can be used
     * outside the context of the router when in-app pip is enabled on web
     */
    location?: Location;
    isVideoShrinkToTopRightCorner?: boolean;
    isVideoElementInAutoPlayMovieContainerSelected?: boolean;
    isInSplitScreenMode?: boolean;
    splitScreenAnimationState?: 'none' | 'active' | 'exiting';
    simplifyPlayerUIEnabled?: boolean;
    getIgnoreErroredAds?: () => Set<string>;
    deferImpressionUntilActivated?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  useTrackRerenders('VideoPlayer');

  const {
    customAdapter,
    onPlayerCreate,
    prerollUrl,
    enableReposition,
    videoResource,
    data,
    playerName,
    title,
    videoPreviewUrl,
    trailerId,
    resumePos,
    autoStart,
    poster,
    experimentalConfig,
    extensionConfig,
    reuseVideoElement,
    performanceCollectorEnabled,
    preload,
    enableVideoSessionCollect,
    tryFallbackVideoResource,
    playerErrorHandle,
    getAutoStart,
    isDRMSupported,
    drmKeySystem,
    getPlayerDisplayMode = () => PlayerDisplayMode.DEFAULT,
    preFetchPrerollAds,
    location,
    isVideoShrinkToTopRightCorner,
    isVideoElementInAutoPlayMovieContainerSelected,
    isInSplitScreenMode,
    splitScreenAnimationState,
    simplifyPlayerUIEnabled,
    getIgnoreErroredAds,
    deferImpressionUntilActivated,
  } = props;

  const isWebPipFeatureEnabled = useWebPlayerPipExperiment();
  const prevAutoStartRef = useRef(autoStart);
  const [prerollUrlInPlayer, setPrerollUrlInPlayer] = useState(prerollUrl);
  const [customAdapterInstance, setCustomAdapterInstance] = useState<AdapterType>();
  const [player, setPlayer] = useState<Player>();
  const enableYouboraMonitoring = useAppSelector((state) => isYouboraEnabled(props.playerName, state));
  const playerContext = usePlayerContext();
  const { getPlayerInstance } = useGetPlayerInstance();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoResourceManagerV2Ref = useRef<VideoResourceManager>();
  const isMountedRef = useRef(true);
  const suitestPlayerAdapterRef = useRef<SuitestPlayerAdapter>();
  // eslint-disable-next-line tubitv/no-client-folder-code-in-react-fc
  const monitoringRef = useRef<ReturnType<typeof setup>>();

  /**
   * Get the video resource we will use for playback
   */
  const { getVideoResource } = useGetVideoResource({
    videoResource,
    enableReposition,
    videoResourceManagerV2Ref,
  });

  const getVideoResourceSetResourceManager = useCallback(() => {
    // setup the resource manager on first render
    if (
      videoResourceManagerV2Ref.current === undefined &&
      enableReposition &&
      !hasTrailerValue(trailerId) &&
      !videoPreviewUrl
    ) {
      videoResourceManagerV2Ref.current = getCachedVideoResourceManager({
        drmKeySystem,
        isDRMSupported: !!isDRMSupported,
        rememberFallback: true,
        videoResources: data.video_resources ?? [],
      });
    }
    return getVideoResource();
  }, [enableReposition, trailerId, videoPreviewUrl, drmKeySystem, isDRMSupported, data.video_resources, getVideoResource]);

  useEffect(() => {
    // will log exposure when content starts, this only impacts
    // hlsv3 and not all content playbacks
    const isHlsV3 = getVideoResourceSetResourceManager()?.type === 'hlsv3';
    const playerNewerGetAudioConfig = getExperiment(PlayerNewerGetAudioConfig, { disableExposureLog: !isHlsV3 }).get('use_newer');
    if (typeof window.experimentUseNewGetAudioConfig === 'undefined' && playerNewerGetAudioConfig) {
      window.experimentUseNewGetAudioConfig = true;
    }
  }, [getVideoResourceSetResourceManager]);

  /**
   * Retrieve callback we can use to get captions config
   */
  const { getCaptionsConfig } = useGetCaptionsConfig({ data, location });

  /**
   * Initialize Youbora, a 3rd party video analytics tool
   */
  const { setupYouboraMonitoring } = useSetupYouboraMonitoring({
    data,
    playerName,
    title,
    enableYouboraMonitoring,
    trailerId,
    videoPreviewUrl,
    getVideoResource: getVideoResourceSetResourceManager,
    monitoringRef,
  });

  /**
   * Callback to set the player and inject it into the player context
   */
  const onPlayerCreateAndPlayerSet = useCallback((player: Player, playerManagers: PlayerManagers) => {
    setPlayer(player);
    onPlayerCreate?.(player, playerManagers);
    playerContext.injectPlayer(player, playerManagers);
  }, [onPlayerCreate, playerContext]);

  /**
   * Get a buildPlayer function that can be used to build the player
   */
  const { buildPlayer } = useBuildPlayer({
    playerContainerRef,
    resumePos,
    data,
    trailerId,
    prerollUrl,
    onPlayerCreateAndPlayerSet,
    autoStart,
    poster,
    experimentalConfig,
    extensionConfig,
    reuseVideoElement,
    performanceCollectorEnabled,
    playerName,
    videoPreviewUrl,
    preload,
    enableVideoSessionCollect,
    tryFallbackVideoResource,
    playerErrorHandle,
    getAutoStart,
    videoResourceManagerV2Ref,
    getVideoResource: getVideoResourceSetResourceManager,
    getCaptionsConfig,
    customAdapterInstance,
    setupYouboraMonitoring,
    isMountedRef,
    suitestPlayerAdapterRef,
    getPlayerDisplayMode,
    preFetchPrerollAds,
    getIgnoreErroredAds,
    deferImpressionUntilActivated,
  });

  // Store values in refs to ensure the effect callback gets the latest values
  // while the effect only runs on mount (and cleanup only runs on unmount)
  const customAdapterRef = useLatestForEffect(customAdapter);
  const buildPlayerRef = useLatestForEffect(buildPlayer);
  const isWebPipFeatureEnabledRef = useLatestForEffect(isWebPipFeatureEnabled);
  const getPlayerInstanceRef = useLatestForEffect(getPlayerInstance);

  /**
   * Build the player or custom adapter
   */
  useEffect(() => {
    if (__WEBPLATFORM__ === 'WEB' && isCrawler()) {
      return;
    }
    const customAdapter = customAdapterRef.current;
    const buildPlayer = buildPlayerRef.current;
    const isWebPipFeatureEnabled = isWebPipFeatureEnabledRef.current;
    const getPlayerInstance = getPlayerInstanceRef.current;

    if (customAdapter) {
      loadCustomAdapter(customAdapter).then((instance) => {
        setCustomAdapterInstance(() => instance);
      }).catch((e: unknown) => {
        logger.error(e);
      });
    } else {
      isMountedRef.current = true;
      buildPlayer().catch((error) => logger.error(error, 'Error thrown while building player'));

      const playerStartupManager = PlayerStartupManager.getInstance();
      playerStartupManager?.recordEvent('ReactRendered');
      playerStartupManager?.setReporter(({ timestamps }) => {
        const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
        trackPlayerStartupMetric({
          timestamps,
          playbackInfo,
        });
      });
    }

    const shouldRemovePlayerOnUnmount = !isWebPipFeatureEnabled;

    return () => {
      const player = getPlayerInstance();
      if (!player) return;
      isMountedRef.current = false;
      if (shouldRemovePlayerOnUnmount || !player.isPlaying()) {
        player.remove();
      }
    };
  }, [customAdapterRef, buildPlayerRef, isWebPipFeatureEnabledRef, getPlayerInstanceRef]);

  useOnDecoupledPlayerCreate(useCallback(() => {
    const monitoring = monitoringRef.current;
    const suitestPlayerAdapter = suitestPlayerAdapterRef.current;

    return () => {
      exposeToTubiGlobal({ player: undefined });
      monitoring?.remove();
      suitestPlayerAdapter?.remove();
    };
  }, []));

  /**
   * Rebuild the player if the custom adapter instance changes
   */
  const prevCustomAdapterInstanceRef = useRef(customAdapterInstance);
  // useLayoutEffect is a closer match to the lifecycle of the componentDidUpdate
  // lifecycle method which this code was migrated from. Using a layout effect
  // rather than use effect means that the effect runs synchronously after
  // a re-render before paint. This ensures that the effect runs early, prior to
  // callers' useEffect. This is believed to be important to prevent race conditions
  // that can occur with player setup in the VOD and preview players, especially
  // For more see the PR that introduced this comment
  useLayoutEffect(() => {
    if (customAdapter && !prevCustomAdapterInstanceRef.current && customAdapterInstance) {
      buildPlayerRef.current().catch((error) => logger.error(error, 'Error thrown while re-building player'));
    }
    prevCustomAdapterInstanceRef.current = customAdapterInstance;
  }, [customAdapter, customAdapterInstance, buildPlayerRef]);

  /**
   * Set up preroll playback
   */
  useEffect(() => {
    if (prerollUrl !== prerollUrlInPlayer) {
      if (prerollUrl && player) {
        player.setPrerollUrl(prerollUrl);
      }
      setPrerollUrlInPlayer(prerollUrl);
    }
  }, [prerollUrl, prerollUrlInPlayer, player]);

  /**
   * Handle autoStart prop changes-- if we haven't started playing and autoStart
   * flips to true, we re-try playing the video
   */
  useEffect(() => {
    if (!prevAutoStartRef.current && autoStart && player?.getState() === State.idle) {
      player.play();
    }
    prevAutoStartRef.current = autoStart;
  }, [autoStart, player]);

  // we do this to deal with samsungplayer removing the data-reactid and react being unable to find its element
  const htmlString = customAdapter && customAdapterInstance
    ? customAdapterInstance.htmlString
    : getPlayerHTMLString();

  const className = classNames(styles.playerSkin, props.cls, {
    [styles.videoPreview]: !!videoPreviewUrl,
    [styles.enableTransition]: !simplifyPlayerUIEnabled,
    [styles.ottVideoPlayerInTopRightCorner]: isVideoShrinkToTopRightCorner,
    [styles.ottVideoPlayerSelected]: isVideoShrinkToTopRightCorner && isVideoElementInAutoPlayMovieContainerSelected,
    [styles.ottVideoPlayerInSplitScreen]: isInSplitScreenMode,
    [styles.ottVideoPlayerActiveSplitScreen]: splitScreenAnimationState === 'active',
    [styles.ottVideoPlayerExitingSplitScreen]: splitScreenAnimationState === 'exiting',
  });

  /* istanbul ignore next */
  return (
    <div
      ref={playerContainerRef}
      className={className}
      data-test-id="video-player-container"
      dangerouslySetInnerHTML={{ __html: htmlString ?? '' }}
    />
  );

};

export default withPlayerExtensionAndExperimentalConfig(
  VideoPlayer
);
