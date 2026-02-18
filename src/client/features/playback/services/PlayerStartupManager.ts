import type Hls from '@adrise/hls.js';
import type { Events as HlsEvents } from '@adrise/hls.js';
import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import isEmpty from 'lodash/isEmpty';

import logger from 'common/helpers/logging';

/**
 * Represents the names of various timestamps that can occur during the player startup process.
 */
type PlayerStartupEventName =
  'PageRequested'
  | 'DOMContentLoaded'
  | 'ReactRendered'
  | 'PlayerInitialized'
  | 'PlayerReady'
  | 'PrerollRequested'
  | 'PrerollResponseReceived'
  | 'MediaAttaching'
  | 'MediaAttached'
  | 'ManifestLoading'
  | 'ManifestLoaded'
  | 'ManifestParsed'
  | 'LevelLoading'
  | 'LevelLoaded'
  | 'AudioTrackLoading'
  | 'AudioTrackLoaded'
  | 'KeyLoading'
  | 'KeyLoaded'
  | 'FragLoading'
  | 'FragLoaded'
  | 'FragDecrypted'
  | 'FragParsingInitSegment'
  | 'FragParsed'
  | 'FragBuffered'
  | 'EmeGenerateKeySession'
  | 'EmeOnKeySessionMessage'
  | 'EmeSessionUpdate'
  | 'PlayerLoad'
  | 'InitResumeSeek'
  | 'FirstFrameRendered';

/**
 * A map of event names to their respective timestamps.
 */
export type EventTimestamp = {
  [eventName in PlayerStartupEventName]?: number;
};

type PlayerStartupMetricReporter = (data: { timestamps: Record<string, number>; }) => void;

/**
 * Manages tracking the player startup process and recording timestamps.
 */
class PlayerStartupManager {
  private static instance?: PlayerStartupManager;

  private eventTimestamps: EventTimestamp = {};

  static getInstance(): PlayerStartupManager | undefined {
    return PlayerStartupManager.instance;
  }

  private truncatedEventNameMap: { [eventName in PlayerStartupEventName]?: string } = {
    PageRequested: 'pge_req',
    DOMContentLoaded: 'dom_ldg',
    ReactRendered: 'rct_rdy',
    PlayerInitialized: 'plr_int',
    PlayerReady: 'plr_rdy',
    PrerollRequested: 'prl_req',
    PrerollResponseReceived: 'prl_res',
    MediaAttaching: 'mda_att',
    MediaAttached: 'mda_atd',
    ManifestLoading: 'mft_ldg',
    ManifestLoaded: 'mft_ldd',
    ManifestParsed: 'mft_prs',
    LevelLoading: 'lvl_ldg',
    LevelLoaded: 'lvl_ldd',
    AudioTrackLoading: 'aud_ldg',
    AudioTrackLoaded: 'aud_ldd',
    KeyLoading: 'key_ldg',
    KeyLoaded: 'key_ldd',
    FragLoading: 'frg_ldg',
    FragLoaded: 'frg_ldd',
    FragDecrypted: 'frg_dcp',
    FragParsingInitSegment: 'frg_pis',
    FragParsed: 'frg_prs',
    FragBuffered: 'frg_bfd',
    EmeGenerateKeySession: 'eme_gks',
    EmeOnKeySessionMessage: 'eme_okm',
    EmeSessionUpdate: 'eme_ses',
    PlayerLoad: 'plr_ldg',
    InitResumeSeek: 'ini_rsk',
    FirstFrameRendered: 'fst_frm',
  };

  private player?: Player;

  private playerEventsMap: { metric: PlayerStartupEventName; event: PLAYER_EVENTS; }[] = [];

  private playerListeners: { [eventName in PlayerStartupEventName]?: () => void } = {};

  private hls?: Hls;

  private hlsEventsMap: { metric: PlayerStartupEventName; event: HlsEvents; }[] = [];

  private hlsListeners: { [eventName in PlayerStartupEventName]?: () => void } = {};

  private isAd = false;

  private hasEmittedFirstFrame = false;

  private reportPlayerStartupMetrics: PlayerStartupMetricReporter = () => {};

  static initialize(): PlayerStartupManager {
    if (!PlayerStartupManager.instance) {
      PlayerStartupManager.instance = new PlayerStartupManager();
    }

    PlayerStartupManager.instance.reset();
    PlayerStartupManager.instance.recordEvent('PageRequested');
    return PlayerStartupManager.instance;
  }

  setPlayer = (player: Player) => {
    if (this.player) {
      logger.error('[PlayerStartupManager] Player is already set');
      return;
    }
    this.player = player;
    this.player.once(PLAYER_EVENTS.remove, this.destroy);
    this.player.once(PLAYER_EVENTS.hlsSetup, this.onHlsSetup);
    this.player.once(PLAYER_EVENTS.adReady, this.onAdReady);
    this.player.once(PLAYER_EVENTS.ready, this.onReady);
    this.player.once(PLAYER_EVENTS.adCurrentTimeProgressed, this.onFirstFrame);
    this.player.once(PLAYER_EVENTS.currentTimeProgressed, this.onFirstFrame);
    this.playerEventsMap = [
      { metric: 'MediaAttaching', event: PLAYER_EVENTS.hlsSetup },
      { metric: 'PlayerInitialized', event: PLAYER_EVENTS.setup },
      { metric: 'PrerollRequested', event: PLAYER_EVENTS.adPodFetch },
      { metric: 'PrerollResponseReceived', event: PLAYER_EVENTS.adPodFetchSuccess },
      { metric: 'PlayerLoad', event: PLAYER_EVENTS.startLoad },
      { metric: 'InitResumeSeek', event: PLAYER_EVENTS.seeking },
    ];
    this.generatePlayerListenerMap();
    this.bindPlayerEvents();
  };

  setReporter = (reporter: PlayerStartupMetricReporter) => {
    logger.info('[PlayerStartupManager] Setting player startup timestamps reporter');
    this.reportPlayerStartupMetrics = reporter;
  };

  private onFirstFrame = () => {
    if (this.hasEmittedFirstFrame) return;

    this.recordEvent('FirstFrameRendered');
    this.hasEmittedFirstFrame = true;

    const timestamps = this.getTruncatedTimestamps();

    logger.info(`[PlayerStartupManager] Tracking player startup timestamps: ${JSON.stringify(timestamps)}`);
    this.reportPlayerStartupMetrics({ timestamps });

    this.destroy();
  };

  private onReady = () => {
    this.isAd = false;
    this.recordEvent('PlayerReady');
    // adReady listener is no longer needed as we are only interested in content startup
    this.player?.removeListener(PLAYER_EVENTS.adReady, this.onAdReady);
  };

  private onAdReady = () => {
    this.isAd = true;
    this.recordEvent('PlayerReady');
    // ready and hlsSetup listeners are no longer needed as we are only interested in ad startup
    this.player?.removeListener(PLAYER_EVENTS.ready, this.onReady);
    this.player?.removeListener(PLAYER_EVENTS.hlsSetup, this.onHlsSetup);
  };

  private generatePlayerListenerMap = () => {
    if (!isEmpty(this.playerListeners)) {
      logger.error('[PlayerStartupManager] Player listeners already set.');
      return;
    }

    this.playerEventsMap.forEach(({ metric }) => {
      this.playerListeners[metric] = () => {
        this.recordEvent(metric);
      };
    });
  };

  private bindPlayerEvents = (remove = false) => {
    if (this.hasEmittedFirstFrame && !remove) return;
    this.playerEventsMap.forEach(({ metric, event }) => {
      const listener = this.playerListeners[metric];
      if (!listener) return;
      const fnName = remove ? 'removeListener' : 'once';
      this.player?.[fnName](event, listener);
    });
    if (remove && this.player) {
      this.player.removeListener(PLAYER_EVENTS.remove, this.destroy);
      this.player.removeListener(PLAYER_EVENTS.hlsSetup, this.onHlsSetup);
      this.player.removeListener(PLAYER_EVENTS.adReady, this.onAdReady);
      this.player.removeListener(PLAYER_EVENTS.ready, this.onReady);
      this.player.removeListener(PLAYER_EVENTS.adCurrentTimeProgressed, this.onFirstFrame);
      this.player.removeListener(PLAYER_EVENTS.currentTimeProgressed, this.onFirstFrame);
    }
  };

  private onHlsSetup = ({ hlsInstance, ExternalHls }: { hlsInstance: Hls; ExternalHls?: typeof Hls }) => {
    if (this.hls) {
      logger.error('[PlayerStartupManager] Hls is already set');
      return;
    }

    this.hls = hlsInstance;
    if (!ExternalHls) {
      logger.error('[PlayerStartupManager] Hls not provided oh hls setup');
      return;
    }

    const { Events } = ExternalHls;
    this.hlsEventsMap = [
      { metric: 'MediaAttached', event: Events.MEDIA_ATTACHED },
      { metric: 'ManifestLoading', event: Events.MANIFEST_LOADING },
      { metric: 'ManifestLoaded', event: Events.MANIFEST_LOADED },
      { metric: 'ManifestParsed', event: Events.MANIFEST_PARSED },
      { metric: 'LevelLoading', event: Events.LEVEL_LOADING },
      { metric: 'LevelLoaded', event: Events.LEVEL_LOADED },
      { metric: 'AudioTrackLoading', event: Events.AUDIO_TRACK_LOADING },
      { metric: 'AudioTrackLoaded', event: Events.AUDIO_TRACK_LOADED },
      { metric: 'KeyLoading', event: Events.KEY_LOADING },
      { metric: 'KeyLoaded', event: Events.KEY_LOADED },
      { metric: 'FragLoading', event: Events.FRAG_LOADING },
      { metric: 'FragLoaded', event: Events.FRAG_LOADED },
      { metric: 'FragDecrypted', event: Events.FRAG_DECRYPTED },
      { metric: 'FragParsingInitSegment', event: Events.FRAG_PARSING_INIT_SEGMENT },
      { metric: 'FragParsed', event: Events.FRAG_PARSED },
      { metric: 'FragBuffered', event: Events.FRAG_BUFFERED },
      { metric: 'EmeGenerateKeySession', event: Events.EME_GENERATE_KEY_SESSION },
      { metric: 'EmeOnKeySessionMessage', event: Events.EME_ON_KEY_SESSION_MESSAGE },
      { metric: 'EmeSessionUpdate', event: Events.EME_SESSION_UPDATE },
    ];
    this.generateHlsListenerMap();
    this.bindHlsEvents();
  };

  private generateHlsListenerMap = () => {
    if (!isEmpty(this.hlsListeners)) {
      logger.error('[PlayerStartupManager] Hls listeners already set.');
      return;
    }

    this.hlsEventsMap.forEach(({ metric }) => {
      this.hlsListeners[metric] = () => {
        this.recordEvent(metric as PlayerStartupEventName);
      };
    });
  };

  private bindHlsEvents = (remove = false) => {
    if (this.hasEmittedFirstFrame && !remove) return;
    this.hlsEventsMap.forEach(({ metric, event }) => {
      const listener = this.hlsListeners[metric];
      if (!listener) return;
      const fnName = remove ? 'off' : 'once';
      this.hls?.[fnName](event, listener);
    });
  };

  recordEvent = (eventName: PlayerStartupEventName) => {
    this.eventTimestamps[eventName] = Math.round(performance.now());
    logger.info(`[PlayerStartupManager] Event recorded: ${eventName} at ${this.eventTimestamps[eventName]} ms`);
  };

  getAllTimestamps = (): EventTimestamp => this.eventTimestamps;

  getTruncatedTimestamps = (): Record<string, number> => {
    const truncatedTimestamps: Record<string, number> = {};
    const baseTimestamp = this.eventTimestamps.PageRequested;
    if (baseTimestamp === undefined) {
      logger.error('[PlayerStartupManager] PageRequested timestamp not found');
      return {};
    }
    for (const eventName of Object.keys(this.eventTimestamps) as PlayerStartupEventName[]) {
      const key = this.truncatedEventNameMap[eventName];
      const timestamp = this.eventTimestamps[eventName];
      if (key && timestamp !== undefined) {
        truncatedTimestamps[key] = timestamp - baseTimestamp;
      }
    }

    return truncatedTimestamps;
  };

  /**
   * Resets the event timestamps and flags to their initial state.
   * This is separated from destroy in order to persist the timestamps
   * after they are reported for debugging purposes.
   */
  private reset = () => {
    this.eventTimestamps = {};
    this.hasEmittedFirstFrame = false;
    this.isAd = false;
  };

  private destroy = () => {
    this.bindPlayerEvents(true);
    this.bindHlsEvents(true);
    this.player = undefined;
    this.hls = undefined;
    this.playerListeners = {};
    this.hlsListeners = {};
  };
}

export default PlayerStartupManager;
