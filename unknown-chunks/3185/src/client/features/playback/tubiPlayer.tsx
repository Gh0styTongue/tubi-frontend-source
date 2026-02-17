import { interceptorManager, Player, PLAYER_EVENTS, PLAYER_LOG_LEVEL, PlayerName } from '@adrise/player';
import type {
  ErrorEventData,
  PlayerConfig,
  AdMissedEvent,
  RequestProcessBeforeFetchType,
} from '@adrise/player';

import { AdMissedReason, trackAdMissed, trackDestroyTimeout } from 'client/features/playback/track/client-log';
import { isHisense5659 } from 'client/utils/clientTools';
import {
  FREEZED_EMPTY_FUNCTION,
} from 'common/constants/constants';
import type { Experiment } from 'common/experiments/Experiment';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getPlayerAdapter } from 'common/features/playback/utils/getPlayerAdapter';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { VideoResource } from 'common/types/video';

import { attachAdHealthScoreLowEvent } from './handlers/attachAdHealthScoreLowEvent';
import { attachBufferTracking } from './handlers/attachBufferTracking';
import { attachPreviewVideoSessionEvents } from './handlers/attachPreviewVideoSessionEvents';
import { attachReseek } from './handlers/attachReseek';
import { attachStartupPerformanceExpose } from './handlers/attachStartupPerformanceExpose';
import { attachVODPageSessionEvents } from './handlers/attachVODPageSessionEvents';
import { attachVODTracking } from './handlers/attachVODTracking';
import type { ErrorManagerParams } from './services/ErrorManager';
import { ErrorManager } from './services/ErrorManager';
import { attachHDMIManager } from './services/HDMIManager';
import { attachNativeCaptionsCacheManager } from './services/NativeCaptionsCacheManager';
import { attachPlaybackPageExitManager } from './services/PlaybackPageExitManager';
import { attachRenditionAndFrameInfoManager } from './services/RenditionAndFrameInfoManager';
import { attachResumeBeginningAfterAdManager } from './services/ResumeBeginningAfterAdManager';
import { attachSamsungScreenSaverManager } from './services/SamsungScreenSaverManager';
import { attachVisibilityManager } from './services/VisibilityManager';
import { attachVODAttributionManager } from './services/VODAttributionManager';
import { attachVODPlaybackSession } from './session/VODPlaybackSession';
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface PlayerManagers {
  errorManager?: ErrorManager;
  videoResourceManagerV2?: VideoResourceManager;
}

// TODO: Need to split out from this file
const attachErrorManager = (options: ErrorManagerParams, playerManagers: PlayerManagers = {}) => {
  const { player } = options;
  const manager = new ErrorManager(options);
  player.on(PLAYER_EVENTS.remove, manager.destroy);
  playerManagers.errorManager = manager;
  return () => {
    player.removeListener(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
};

let detachPlayerEvents = FREEZED_EMPTY_FUNCTION;

export const attachPlayerEvents = (player: Player, config: {
  getVideoResource: () => VideoResource | undefined;
  enableVideoSessionCollect?: boolean;
  contentId: string;
  dispatch?: TubiThunkDispatch;
  tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined;
  playerErrorHandle?: (error: ErrorEventData) => void;
  playerName: PlayerConfig['playerName'];
  youboraExperimentMap?: { [name: string]: Experiment };
}, playerManagers?: PlayerManagers) => {
  detachPlayerEvents();

  const {
    getVideoResource,
    enableVideoSessionCollect,
    contentId,
    playerName,
    dispatch,
    tryFallbackVideoResource,
    playerErrorHandle,
    youboraExperimentMap,
  } = config;
  const detachReseek = attachReseek(player);
  const detachBufferTracking = attachBufferTracking(player, getVideoResource);
  const detachVODTracking = attachVODTracking(player, contentId, getVideoResource);
  const detachAdHealthScoreLow = attachAdHealthScoreLowEvent(player, youboraExperimentMap?.webott_firetv_skip_ad_with_healthscore_v2);
  let detachPreviewVideoSessionEvents = FREEZED_EMPTY_FUNCTION;
  let detachVODPageSessionEvents = FREEZED_EMPTY_FUNCTION;
  const detachStartupPerformanceExpose = attachStartupPerformanceExpose(player);
  if (enableVideoSessionCollect) {
    switch (playerName) {
      case PlayerName.Preview:
        detachPreviewVideoSessionEvents = attachPreviewVideoSessionEvents(player);
        break;
      default:
        detachVODPageSessionEvents = attachVODPageSessionEvents(player);
    }
  }

  const detachHDMIManager = attachHDMIManager(player, contentId);
  let detachVisibilityManager: VoidFunction | undefined;
  if (__ISOTT__) {
    detachVisibilityManager = attachVisibilityManager({
      player,
      contentId,
      needAnalyticsEvent: player.playerName === PlayerName.VOD,
    });
  }
  // This manager need to bind before the playback page exit manager to ensure it can update the player exit event
  const detachResumeBeginningAfterAdManager = attachResumeBeginningAfterAdManager(player);
  const detachVODAttributionManager = attachVODAttributionManager(player);
  const detachVODPlaybackSession = attachVODPlaybackSession(player, getVideoResource, playerManagers?.videoResourceManagerV2);
  const detachPlaybackPageExitManager = attachPlaybackPageExitManager({ player, contentId, getVideoResource });
  const detachErrorManager = attachErrorManager({
    player,
    getVideoResource,
    contentId,
    dispatch,
    enableVideoSessionCollect,
    tryFallbackVideoResource,
    playerErrorHandle,
    videoResourceManagerV2: playerManagers?.videoResourceManagerV2,
    youboraExperimentMap,
  }, playerManagers);
  const detachSamsungScreenSaverManager = attachSamsungScreenSaverManager(player);
  const detachRenditionAndFrameInfoManager = attachRenditionAndFrameInfoManager(player, contentId);
  let detachNativeCaptionsCacheManager: VoidFunction | undefined;
  if (youboraExperimentMap && youboraExperimentMap.ottFireTVNativeCaptionsCache) {
    detachNativeCaptionsCacheManager = attachNativeCaptionsCacheManager({ player, ottFireTVNativeCaptionsCache: youboraExperimentMap.ottFireTVNativeCaptionsCache },);
  }

  detachPlayerEvents = () => {
    detachReseek();
    detachBufferTracking();
    detachVODTracking();
    detachStartupPerformanceExpose();
    detachPreviewVideoSessionEvents();
    detachVODPageSessionEvents();
    detachHDMIManager();
    detachVODAttributionManager();
    detachVODPlaybackSession();
    detachPlaybackPageExitManager();
    detachErrorManager();
    detachVisibilityManager?.();
    detachSamsungScreenSaverManager();
    detachResumeBeginningAfterAdManager();
    detachRenditionAndFrameInfoManager();
    detachNativeCaptionsCacheManager?.();
    detachAdHealthScoreLow();
  };
};

/**
 * @param {Object} config including `contentId`, `resumePosition`, `trackEvent`
 * and all options passed to `Player` class
 * @param {String} config.contentId
 * @param {Function} config.trackEvent
 */
export const createPlayer = (config: PartialBy<PlayerConfig, 'Adapter'> & {
  getVideoResource: () => VideoResource | undefined;
  enableVideoSessionCollect?: boolean;
  contentId: string;
  dispatch?: TubiThunkDispatch;
  tryFallbackVideoResource?: (error: ErrorEventData, position?: number) => VideoResource | undefined;
  playerErrorHandle?: (error: ErrorEventData) => void;
  getAutoStart?: () => boolean;
  adRequestPreProcessor?: RequestProcessBeforeFetchType;
  youboraExperimentMap?: { [name: string]: Experiment };
}, playerManagers?: PlayerManagers) => {
  const {
    contentId,
    resumePosition,
    captionsStyles,
    enableVideoSessionCollect,
    Adapter: AdapterOverride,
    dispatch,
    mediaUrl,
    youboraExperimentMap,
    tryFallbackVideoResource,
    playerErrorHandle,
    adRequestPreProcessor,
    ...options
  } = config;
  const reuseVideoElement = FeatureSwitchManager.isDefault(['Player', 'DedicatedAdPlayer'])
    ? config.reuseVideoElement
    : !FeatureSwitchManager.isEnabled(['Player', 'DedicatedAdPlayer']);

  const mockUrl = config.playerName === PlayerName.VOD && !FeatureSwitchManager.isDefault(['VOD', 'MockUrl'])
    ? FeatureSwitchManager.get(['VOD', 'MockUrl']) as string
    : config.playerName === PlayerName.Preview && !FeatureSwitchManager.isDefault(['Preview', 'MockUrl'])
      ? FeatureSwitchManager.get(['Preview', 'MockUrl']) as string
      : undefined;

  const adapter = AdapterOverride || getPlayerAdapter();

  const debugLevel = FeatureSwitchManager.isDefault(['Logging', 'Player']) ? PLAYER_LOG_LEVEL.DISABLE : FeatureSwitchManager.get(['Logging', 'Player']) as PLAYER_LOG_LEVEL;

  if (debugLevel !== PLAYER_LOG_LEVEL.DISABLE) {
    interceptorManager.toggleDebug(true);
  }

  const player = new Player({
    ...options,
    mediaUrl: mockUrl ?? mediaUrl,
    captionsStyles,
    Adapter: adapter,
    debugLevel,
    resumePosition,
    reuseVideoElement,
    shouldReportBitrate: FeatureSwitchManager.isEnabled(['Player', 'Info']),
    shouldWaitForSeekedEvent: !isHisense5659(),
    trackAdMissedCallback: (data: AdMissedEvent) => {
      trackAdMissed({
        ...data,
        detail: AdMissedReason.EXIT_BEFORE_RESPONSE,
        position: player.getPosition(),
      });
    },
    adRequestProcessBeforeFetch: adRequestPreProcessor,
    trackDestroyTimeout,

  });

  attachPlayerEvents(player, config, playerManagers);

  return player;
};
