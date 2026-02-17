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
 * Represents the names of various metrics that can be calculated from timestamps during the player startup process.
 */
type PlayerStartupMetricName =
  'DOMCompleteTime'
  | 'FirstReactRenderTime'
  | 'ReactToPlayerLoadTime'
  | 'PlayerInitTime'
  | 'PrerollRequestTime'
  | 'PrerollResponseTime'
  | 'PrerollLoadTime'
  | 'MediaAttachTime'
  | 'ManifestLoadTime'
  | 'ManifestParseTime'
  | 'LevelLoadTime'
  | 'AudioTrackLoadTime'
  | 'KeyLoadTime'
  | 'FragLoadTime'
  | 'FragDecryptTime'
  | 'InitFragParseTime'
  | 'FragBufferTime'
  | 'DRMLicenseServerResponseTime'
  | 'DRMLicenseProcessedTime'
  | 'ResumeSeekLatencyTime'
  | 'PageLoadTime'
  | 'VideoStartupTime'
  | 'TotalPrerollRequestTime'
  | 'TotalStartupTime';

/**
 * A map of event names to their respective timestamps.
 */
type EventTimestamp = {
  [eventName in PlayerStartupEventName]?: number;
};

/**
 * A map of metric names to their respective result values.
 */
type PlayerStartupMetrics = {
  [metricName in PlayerStartupMetricName]?: number;
};

interface MetricCalculation {
  start: PlayerStartupEventName;
  end: PlayerStartupEventName;
}

type MetricCalculations = {
  [K in PlayerStartupMetricName]: MetricCalculation;
};

/**
 * Manages tracking the player startup process, recording timestamps and calculating metrics.
 */
class PlayerStartupManager {
  private static instance?: PlayerStartupManager;

  private eventTimestamps: EventTimestamp = {};

  static getInstance(): PlayerStartupManager | undefined {
    return PlayerStartupManager.instance;
  }

  /**
   * A map of metric names to their respective start and end timestamps to be used
   * to calculate their value
   */
  private metricCalculations: MetricCalculations = {
    DOMCompleteTime: { start: 'PageRequested', end: 'DOMContentLoaded' },
    FirstReactRenderTime: { start: 'DOMContentLoaded', end: 'ReactRendered' },
    ReactToPlayerLoadTime: { start: 'ReactRendered', end: 'PlayerInitialized' },
    PlayerInitTime: { start: 'PlayerInitialized', end: 'PlayerReady' },
    PrerollRequestTime: { start: 'ReactRendered', end: 'PrerollRequested' },
    PrerollResponseTime: { start: 'PrerollRequested', end: 'PrerollResponseReceived' },
    PrerollLoadTime: { start: 'PrerollResponseReceived', end: 'FirstFrameRendered' },
    MediaAttachTime: { start: 'MediaAttaching', end: 'MediaAttached' },
    ManifestLoadTime: { start: 'ManifestLoading', end: 'ManifestLoaded' },
    ManifestParseTime: { start: 'ManifestLoaded', end: 'ManifestParsed' },
    LevelLoadTime: { start: 'LevelLoading', end: 'LevelLoaded' },
    AudioTrackLoadTime: { start: 'AudioTrackLoading', end: 'AudioTrackLoaded' },
    KeyLoadTime: { start: 'KeyLoading', end: 'KeyLoaded' },
    FragLoadTime: { start: 'FragLoading', end: 'FragLoaded' },
    FragDecryptTime: { start: 'FragLoaded', end: 'FragDecrypted' },
    InitFragParseTime: { start: 'FragParsingInitSegment', end: 'FragParsed' },
    FragBufferTime: { start: 'FragParsed', end: 'FragBuffered' },
    DRMLicenseServerResponseTime: { start: 'EmeGenerateKeySession', end: 'EmeOnKeySessionMessage' },
    DRMLicenseProcessedTime: { start: 'EmeOnKeySessionMessage', end: 'EmeSessionUpdate' },
    ResumeSeekLatencyTime: { start: 'InitResumeSeek', end: 'FirstFrameRendered' },
    PageLoadTime: { start: 'PageRequested', end: 'PlayerInitialized' },
    VideoStartupTime: { start: 'PlayerReady', end: 'FirstFrameRendered' },
    TotalPrerollRequestTime: { start: 'PlayerInitialized', end: 'PrerollResponseReceived' },
    TotalStartupTime: { start: 'PageRequested', end: 'FirstFrameRendered' },
  };

  private player?: Player;

  private playerEventsMap: { metric: PlayerStartupEventName; event: PLAYER_EVENTS; }[] = [];

  private playerListeners: { [eventName in PlayerStartupEventName]?: () => void } = {};

  private hls?: Hls;

  private hlsEventsMap: { metric: PlayerStartupEventName; event: HlsEvents; }[] = [];

  private hlsListeners: { [eventName in PlayerStartupEventName]?: () => void } = {};

  private isAd = false;

  static initialize(): PlayerStartupManager {
    if (!PlayerStartupManager.instance) {
      PlayerStartupManager.instance = new PlayerStartupManager();
      return PlayerStartupManager.instance;
    }
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
    this.player.once(PLAYER_EVENTS.adStart, this.onAdStart);
    this.playerEventsMap = [
      { metric: 'MediaAttaching', event: PLAYER_EVENTS.hlsSetup },
      { metric: 'PlayerInitialized', event: PLAYER_EVENTS.setup },
      { metric: 'PlayerReady', event: PLAYER_EVENTS.ready },
      { metric: 'PrerollRequested', event: PLAYER_EVENTS.adPodFetch },
      { metric: 'PrerollResponseReceived', event: PLAYER_EVENTS.adPodFetchSuccess },
      { metric: 'PlayerLoad', event: PLAYER_EVENTS.startLoad },
      { metric: 'InitResumeSeek', event: PLAYER_EVENTS.seeking },
      { metric: 'FirstFrameRendered', event: PLAYER_EVENTS.firstFrame },
    ];
    this.generatePlayerListenerMap();
    this.bindPlayerEvents();
  };

  private onAdStart = () => {
    this.isAd = true;
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
    this.playerEventsMap.forEach(({ metric, event }) => {
      const listener = this.playerListeners[metric];
      if (!listener) return;
      const fnName = remove ? 'removeListener' : 'once';
      this.player?.[fnName](event, listener);
    });
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

  private getTimeDifference = (startEvent: PlayerStartupEventName, endEvent: PlayerStartupEventName): number => {
    const start = this.eventTimestamps[startEvent];
    const end = this.eventTimestamps[endEvent];

    if (start !== undefined && end !== undefined) {
      return Math.round(end - start);
    }
    return -1;
  };

  getPlayerMetrics = (): PlayerStartupMetrics => {
    const metrics: PlayerStartupMetrics = {};

    for (const metricName of Object.keys(this.metricCalculations) as (keyof MetricCalculations)[]) {
      const calculation = this.metricCalculations[metricName];
      const { start, end } = calculation;
      if (metricName === 'PrerollLoadTime' && !this.isAd) continue;
      const timeDiff = this.getTimeDifference(start, end);
      if (timeDiff >= 0) {
        metrics[metricName] = timeDiff;
      }
    }

    return metrics;
  };

  getAllTimestamps = (): EventTimestamp => this.eventTimestamps;

  private destroy = () => {
    this.bindPlayerEvents(true);
    this.bindHlsEvents(true);
    this.player = undefined;
    this.hls = undefined;
    this.isAd = false;
    this.playerListeners = {};
    this.hlsListeners = {};
    this.eventTimestamps = {};
  };
}

export default PlayerStartupManager;
