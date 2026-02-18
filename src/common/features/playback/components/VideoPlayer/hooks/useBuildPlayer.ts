import type {
  ErrorEventData,
  ExperimentalConfig,
  ExtensionConfig,
  Player,
  AdPod,
} from '@adrise/player';
import { PlayerName } from '@adrise/player';
import type Html5Adapter from '@adrise/player/lib/adapters/html5';
import type SamsungAdapter from '@adrise/player/lib/adapters/samsung';
import type WebAdapter from '@adrise/player/lib/adapters/web';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import { nativeErrorTransformer } from 'client/features/playback/error/transformer';
import PlayerStartupManager from 'client/features/playback/services/PlayerStartupManager';
import { createPlayer } from 'client/features/playback/tubiPlayer';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import type { TubiGlobalPlayer } from 'client/global';
import { exposeToTubiGlobal } from 'client/global';
import systemApi from 'client/systemApi';
import { ACTION_PROMISE_TIMEOUT } from 'common/constants/player';
import type SuitestPlayerAdapter from 'common/features/playback/components/SuitestPlayerAdapter/SuitestPlayerAdapter';
import type { GetCaptionsConfigFn } from 'common/features/playback/components/VideoPlayer/hooks/useGetCaptionsConfig';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getTrailer } from 'common/features/playback/utils/getTrailer';
import type { VideoProps } from 'common/features/playback/utils/getVideoProps';
import { getVideoProps } from 'common/features/playback/utils/getVideoProps';
import { useContent } from 'common/hooks/useContent/useContent';
import type { Video, VideoResource } from 'common/types/video';
import { getDefaultAudioTrackInfo } from 'common/utils/audioTracks';
import hasTrailerValue from 'common/utils/hasTrailerValue';
import { isSamsung2015 } from 'common/utils/tizenTools';

export type AdapterType = typeof WebAdapter | typeof SamsungAdapter | typeof Html5Adapter;

export interface UseBuildPlayerProps {
  playerContainerRef: MutableRefObject<HTMLDivElement | null>;
  resumePos: number | undefined;
  data: Video;
  trailerId: string | number | undefined;
  prerollUrl: string | undefined;
  onPlayerCreateAndPlayerSet: (player: Player, playerManagers: PlayerManagers) => void;
  autoStart: boolean | undefined;
  poster: string | undefined;
  experimentalConfig: ExperimentalConfig | undefined;
  extensionConfig: ExtensionConfig | undefined;
  reuseVideoElement: boolean | undefined;
  performanceCollectorEnabled: boolean | undefined;
  playerName: PlayerName;
  videoPreviewUrl: string | undefined;
  preload: '' | 'auto' | 'metadata' | 'none' | 'force-auto' | undefined;
  enableVideoSessionCollect: boolean | undefined;
  tryFallbackVideoResource:
    | ((error: ErrorEventData, position?: number | undefined) => VideoResource | undefined)
    | undefined;
  playerErrorHandle: ((error: ErrorEventData) => void) | undefined;
  getAutoStart: (() => boolean) | undefined;
  videoResourceManagerV2Ref: MutableRefObject<VideoResourceManager | undefined>;
  getVideoResource: (() => VideoResource | undefined) & (() => VideoResource | undefined);
  getCaptionsConfig: GetCaptionsConfigFn;
  customAdapterInstance: AdapterType | undefined;
  setupYouboraMonitoring: (player: Player) => Promise<void>;
  isMountedRef: MutableRefObject<boolean>;
  suitestPlayerAdapterRef: MutableRefObject<SuitestPlayerAdapter | undefined>;
  getPlayerDisplayMode: () => PlayerDisplayMode;
  preFetchPrerollAds: Promise<AdPod> | undefined;
  getIgnoreErroredAds?: () => Set<string>;
  deferImpressionUntilActivated?: boolean;
}

export const useBuildPlayer = ({
  playerContainerRef,
  resumePos = 0,
  data,
  trailerId,
  prerollUrl,
  onPlayerCreateAndPlayerSet,
  autoStart = false,
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
  getVideoResource,
  getCaptionsConfig,
  customAdapterInstance,
  setupYouboraMonitoring,
  isMountedRef,
  suitestPlayerAdapterRef,
  getPlayerDisplayMode,
  preFetchPrerollAds,
  getIgnoreErroredAds,
  deferImpressionUntilActivated,
}: UseBuildPlayerProps) => {
  // we only use this for refetch so do not need to query data initially thus enabled is false
  const { refetch: refetchContent } = useContent(data.id, { queryOptions: { enabled: false } });

  const buildPlayer = useCallback(async () => {
    if (!playerContainerRef.current) {
      throw new Error('Miss player container during setup');
    }

    const playerManagers: PlayerManagers = {};
    const { id, trailers = [] } = data;

    const isTrailer = hasTrailerValue(trailerId);
    const isVideoPreview = !!videoPreviewUrl;

    const videoResource = getVideoResource();

    // the call to getVideoResource should populate the value of videoResourceManagerV2Ref.current
    playerManagers.videoResourceManagerV2 = videoResourceManagerV2Ref.current;

    let mediaProps: VideoProps;
    if (isTrailer) {
      mediaProps = getTrailer(trailers, trailerId);
    } else if (isVideoPreview) {
      mediaProps = {
        mediaUrl: videoPreviewUrl,
      };
    } else {
      mediaProps = getVideoProps(videoResource);
    }

    const captionsConfig = getCaptionsConfig(isTrailer || isVideoPreview || playerName === PlayerName.AD);

    const deviceMemory = (systemApi.getDeviceMemory && systemApi.getDeviceMemory()) || 0;

    const defaultAudioTrack = getDefaultAudioTrackInfo();

    // Tizen 2015 uses an older browser which doesn't support newer TLS versions.
    // Tizen 2015 has out dated certificate files on device.
    if (__OTTPLATFORM__ === 'TIZEN' && isSamsung2015()) {
      mediaProps.mediaUrl = mediaProps.mediaUrl.replace(/^https/, 'http');
    }

    // createPlayer selects the adapter, instantiates the Player module,
    // attaches functional events, and attaches player metric events
    const player = createPlayer(
      {
        Adapter: customAdapterInstance,
        playerContainer: playerContainerRef.current,
        contentId: id,
        autoStart,
        getAutoStart,
        ...captionsConfig,
        resumePosition: resumePos,
        poster,
        preload,
        prerollUrl,
        defaultAudioTrack,
        extensionConfig,
        experimentalConfig: {
          ...experimentalConfig,
          enableHlsDetachDuringAds: experimentalConfig?.enableHlsDetachDuringAds,
          pauseContentDownloadDuringAds: experimentalConfig?.pauseContentDownloadDuringAds,
          deferImpressionUntilActivated,
        },
        nativeErrorTransformer,
        systemData: {
          deviceMemory,
          systemVersion: undefined,
        },
        needAutoplayAttributeOnVideoElement: __OTTPLATFORM__ === 'VIZIO' || __OTTPLATFORM__ === 'FIRETV_HYB',
        reuseVideoElement,
        performanceCollectorEnabled,
        actionsTimeout: ACTION_PROMISE_TIMEOUT[__OTTPLATFORM__ as keyof typeof ACTION_PROMISE_TIMEOUT],
        ...mediaProps,
        enableVideoSessionCollect,
        playerName,
        isSDKUpgrade: false,
        getVideoResource,
        tryFallbackVideoResource,
        playerErrorHandle,
        useQueueImpressions: __OTTPLATFORM__ === 'PS4',
        getPlayerDisplayMode,
        preFetchPrerollAds,
        cuePoints: data.monetization?.cue_points,
        refetchContent,
        getIgnoreErroredAds,
      },
      playerManagers
    );

    const playerStartupManager = PlayerStartupManager.getInstance();

    exposeToTubiGlobal({ player: player as unknown as TubiGlobalPlayer, playerStartupManager });

    if (playerName === PlayerName.VOD) {
      playerStartupManager?.setPlayer(player);
    }
    onPlayerCreateAndPlayerSet(player, playerManagers);

    await setupYouboraMonitoring(player);

    // if not unmounted while waiting for youbora
    if (isMountedRef.current) {
      await player.setup();
      // if unmounted while setting up player
    } else {
      player.remove();
    }

    /* istanbul ignore next */
    if (__OTTPLATFORM__ === 'TIZEN' && window.suitest) {
      const SuitestAdapter: typeof SuitestPlayerAdapter =
        require('../../SuitestPlayerAdapter/SuitestPlayerAdapter').default;
      suitestPlayerAdapterRef.current = new SuitestAdapter(player);
    }
  }, [
    autoStart,
    customAdapterInstance,
    data,
    deferImpressionUntilActivated,
    enableVideoSessionCollect,
    experimentalConfig,
    getAutoStart,
    getCaptionsConfig,
    extensionConfig,
    getVideoResource,
    isMountedRef,
    onPlayerCreateAndPlayerSet,
    performanceCollectorEnabled,
    playerContainerRef,
    playerErrorHandle,
    playerName,
    poster,
    preload,
    prerollUrl,
    refetchContent,
    resumePos,
    reuseVideoElement,
    setupYouboraMonitoring,
    suitestPlayerAdapterRef,
    tryFallbackVideoResource,
    trailerId,
    videoPreviewUrl,
    videoResourceManagerV2Ref,
    getPlayerDisplayMode,
    preFetchPrerollAds,
    getIgnoreErroredAds,
  ]);

  return { buildPlayer };
};
