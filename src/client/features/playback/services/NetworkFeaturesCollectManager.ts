import type Hls from '@adrise/hls.js';
import type { Events as HlsEvents, FragLoadedData, FragLoadingData, Fragment } from '@adrise/hls.js';
import type { Player } from '@adrise/player';
import { PLAYER_EVENTS, PLAYER_LOG_LEVEL } from '@adrise/player';
import type { FragDownloadStats } from '@adrise/player/lib/types';

import { platformSamplerFactory } from 'client/features/playback/track/client-log/utils/platformSampler';
import { exposeToTubiGlobal } from 'client/global';
import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import { BasePlayerManager } from './BasePlayerManager';
import { VODPlaybackEvents, VODPlaybackSession } from '../session/VODPlaybackSession';
/**
 * Represents a single network feature record for a period
 */
type NetworkRecord = {
  /** Average bandwidth during the period (kilobits per second) */
  bandwidth_kbps: number;
  /** Average latency (time-to-first-byte) during the period in milliseconds */
  latency_ms: number;
};

/**
 * Statistical metrics calculated from network records
 */
type NetworkStatistics = {
  mean: number;
  std: number;
  min: number;
  max: number;
};

/**
 * Running statistics for incremental calculation
 */
type RunningStatistics = {
  count: number;
  mean: number;
  m2: number; // sum of squared deviations for Welford's algorithm
  min: number;
  max: number;
};

/**
 * Complete network features data including both throughput and TTFB stats
 */
export type NetworkFeatures = {
  throughput: NetworkStatistics;
  ttfb: NetworkStatistics;
  records: NetworkRecord[];
  recordsCSV: string;
};

// Sample 1% of network features records to be sent
const sampler = platformSamplerFactory([{ platforms: '*', percentageToAllow: __DEVELOPMENT__ ? 100 : 1, allowedUnsampledCalls: 0 }]);

// 120 records * 30 seconds = 1 hour
const MAX_RECORDS_TO_KEEP = 120;
const PERIOD_DURATION_MS = 30_000; // 30 seconds

/**
 * Manages collection of network performance features during HLS playback using 15-second aggregation periods.
 *
 * **NEW ARCHITECTURE:**
 * - Collects throughput via `player.getFragDownloadStats()` every 15 seconds
 * - Averages TTFB from fragment loading/loaded pairs that complete within each 15-second window
 * - Skips periods with no fragment activity (idle windows)
 * - Provides statistical analysis (mean, std, min, max) of collected period data
 */
export class NetworkFeaturesCollectManager extends BasePlayerManager<Player> {

  static recordsToCSV = (records: NetworkRecord[]): string => {
    const headers = 'bandwidth_kbps,latency_ms';
    const rows = records.map(record => `${record.bandwidth_kbps},${record.latency_ms}`);
    return [headers, ...rows].join('\n');
  };

  private records: NetworkRecord[] = [];

  // Running statistics for O(1) incremental calculation
  private throughputStats: RunningStatistics = {
    count: 0,
    mean: 0,
    m2: 0,
    min: Infinity,
    max: -Infinity,
  };

  private ttfbStats: RunningStatistics = {
    count: 0,
    mean: 0,
    m2: 0,
    min: Infinity,
    max: -Infinity,
  };

  // Fragment tracking for TTFB calculation within periods
  private fragmentLoadingMap: Map<string, number> = new Map(); // fragment unique key -> request start time

  private periodTTFBSamples: number[] = []; // TTFB samples for the current period

  // Period tracking
  private periodIntervalId?: NodeJS.Timeout;

  private lastFragDownloadStats?: FragDownloadStats;

  private hls?: Hls;

  private ExternalHls?: typeof Hls;

  /** Timestamp (ms) of the previous period tick – used to calculate duration */
  private lastPeriodTimestamp?: number;

  /**
   * Helper function to log debug messages only when feature switch is set to MANAGER_LEVEL
   */
  private logDebug = (message: string): void => {
    if (FeatureSwitchManager.get(['Logging', 'Player']) === PLAYER_LOG_LEVEL.MANAGER_LEVEL) {
      logger.debug(message);
    }
  };

  constructor({
    player,
  }: {
    player: Player;
  }) {
    super({ player });

    // Set up event listeners
    player.on(PLAYER_EVENTS.hlsSetup, this.onHlsSetup);
    VODPlaybackSession.getInstance().getEventEmitter().on(VODPlaybackEvents.endPlayback, this.recordNetworkFeatures);

    // Start the 15-second interval timer
    this.startPeriodTimer();
  }

  private startPeriodTimer = () => {
    this.periodIntervalId = setInterval(this.onPeriodTick, PERIOD_DURATION_MS);
    this.lastPeriodTimestamp = performance.now();
    this.logDebug('[NetworkFeaturesCollectManager] Started 15-second period timer');
  };

  private stopPeriodTimer = () => {
    if (this.periodIntervalId) {
      clearInterval(this.periodIntervalId);
      this.periodIntervalId = undefined;
      this.logDebug('[NetworkFeaturesCollectManager] Period timer cleared');
    }
  };

  private onPeriodTick = () => {
    const now = performance.now();

    // Calculate actual duration based on timestamps to be resilient to timer drift
    const durationMs = this.lastPeriodTimestamp ? now - this.lastPeriodTimestamp : PERIOD_DURATION_MS;
    this.lastPeriodTimestamp = now;

    const currentStats = this.player?.getFragDownloadStats?.();

    // Skip period if no fragment download stats available
    if (!currentStats) {
      return;
    }

    // Calculate throughput from FragDownloadStats
    const throughput = this.calculateThroughputFromStats(currentStats, this.lastFragDownloadStats);

    // Calculate average TTFB for this period
    const avgTtfb = this.periodTTFBSamples.reduce((sum, ttfb) => sum + ttfb, 0) / this.periodTTFBSamples.length;

    if (throughput > 0 && avgTtfb > 0) {
      const record: NetworkRecord = {
        bandwidth_kbps: Math.round(throughput),
        latency_ms: Math.round(avgTtfb),
      };

      // Update running statistics incrementally (O(1) operation)
      this.updateRunningStatistics(this.throughputStats, throughput);
      this.updateRunningStatistics(this.ttfbStats, avgTtfb);

      // Keep a limited number of records
      this.records.push(record);

      if (this.records.length > MAX_RECORDS_TO_KEEP) {
        this.records.shift(); // Remove oldest record to keep the max number of records
      }

      this.logDebug(`[NetworkFeaturesCollectManager] Period recorded - duration: ${durationMs.toFixed(0)}ms, bandwidth: ${throughput.toFixed(1)} kbps, latency: ${avgTtfb.toFixed(1)}ms, samples: ${this.periodTTFBSamples.length}`);
    } else {
      logger.warn('[NetworkFeaturesCollectManager] Invalid period metrics calculated');
    }

    // Prepare for next period
    this.periodTTFBSamples = [];
    this.lastFragDownloadStats = {
      ...currentStats,
      video: { ...currentStats.video },
      audio: { ...currentStats.audio },
    };
  };

  private calculateThroughputFromStats = (currentStats: FragDownloadStats, lastStats: FragDownloadStats | undefined): number => {
    // If this is the first measurement, return 0
    if (!lastStats) {
      return 0;
    }

    // Calculate delta values for both video and audio
    const videoDeltaSize = currentStats.video.totalDownloadSize - lastStats.video.totalDownloadSize;
    const videoDeltaTime = currentStats.video.totalDownloadTimeConsuming - lastStats.video.totalDownloadTimeConsuming;

    const audioDeltaSize = currentStats.audio.totalDownloadSize - lastStats.audio.totalDownloadSize;
    const audioDeltaTime = currentStats.audio.totalDownloadTimeConsuming - lastStats.audio.totalDownloadTimeConsuming;

    // Total delta for combined throughput calculation
    const totalDeltaSize = videoDeltaSize + audioDeltaSize;
    const totalDeltaTime = Math.max(videoDeltaTime, audioDeltaTime); // Use the longer of the two

    // Calculate throughput in kilobits per second (kbps)
    if (totalDeltaTime > 0 && totalDeltaSize > 0) {
      // Convert: bytes -> bits (x8) -> kilobits (/1000) -> per second (/time_in_seconds)
      // (bytes * 8 / 1000) / (ms / 1000) = (bytes * 8) / ms = kbps
      return (totalDeltaSize * 8) / totalDeltaTime;
    }

    return 0;
  };

  private onHlsSetup = ({ hlsInstance, ExternalHls }: { hlsInstance: Hls; ExternalHls?: typeof Hls }) => {
    this.hls = hlsInstance;
    this.ExternalHls = ExternalHls;

    if (!ExternalHls) {
      logger.error('[NetworkFeaturesCollectManager] ExternalHls not provided on HLS setup');
      return;
    }

    this.bindHlsEvents();
  };

  private bindHlsEvents = (remove = false) => {
    if (!this.hls || !this.ExternalHls) return;

    const { Events } = this.ExternalHls;
    const fnName = remove ? 'off' : 'on';

    this.hls[fnName](Events.FRAG_LOADING, this.onFragLoading);
    this.hls[fnName](Events.FRAG_LOADED, this.onFragLoaded);
  };

  /**
   * Creates a unique identifier for a fragment that works across HLSv3 and HLSv6
   * For HLSv6 (fmp4), fragments can share the same URL but have different byte ranges
   */
  private getFragmentUniqueKey = (frag: Fragment): string => {
    const baseKey = `${frag.type}-${frag.level || 0}-${frag.sn || 0}-${frag.url}`;

    // For fmp4 segments with byte ranges, include range information
    if (frag.byteRangeStartOffset !== undefined && frag.byteRangeEndOffset !== undefined) {
      return `${baseKey}-${frag.byteRangeStartOffset}-${frag.byteRangeEndOffset}`;
    }

    // For regular segments without byte ranges, include start time for additional uniqueness
    if (frag.start !== undefined) {
      return `${baseKey}-${frag.start}`;
    }

    return baseKey;
  };

  private onFragLoading = (event: HlsEvents.FRAG_LOADING, data: FragLoadingData) => {
    const { frag } = data;
    if (frag && frag.url && frag.type !== 'subtitle') {
      // Store the request start time for this fragment using a unique key
      const requestTime = performance.now();
      const fragmentKey = this.getFragmentUniqueKey(frag);
      this.fragmentLoadingMap.set(fragmentKey, requestTime);
      this.logDebug(`[NetworkFeaturesCollectManager] Fragment loading started: ${fragmentKey} at ${requestTime}ms`);
    }
  };

  /**
   * Update running statistics incrementally using Welford's online algorithm
   */
  private updateRunningStatistics = (stats: RunningStatistics, newValue: number): void => {
    // Standard Welford's algorithm for running statistics
    stats.count++;
    const delta = newValue - stats.mean;
    stats.mean += delta / stats.count;
    const delta2 = newValue - stats.mean;
    stats.m2 += delta * delta2;

    // Update min/max
    stats.min = Math.min(stats.min, newValue);
    stats.max = Math.max(stats.max, newValue);
  };

  /**
   * Convert running statistics to NetworkStatistics format
   */
  private getStatisticsFromRunning = (stats: RunningStatistics): NetworkStatistics => {
    if (stats.count === 0) {
      return { mean: 0, std: 0, min: 0, max: 0 };
    }

    // Sample variance for Welford's algorithm
    const variance = stats.count > 1 ? stats.m2 / (stats.count - 1) : 0;

    return {
      mean: stats.mean,
      std: Math.sqrt(Math.max(0, variance)), // Ensure non-negative
      min: stats.min === Infinity ? 0 : stats.min,
      max: stats.max === -Infinity ? 0 : stats.max,
    };
  };

  private onFragLoaded = (_event: HlsEvents.FRAG_LOADED, data: FragLoadedData) => {
    const { frag } = data;
    if (frag.type === 'subtitle') return;

    const fragmentKey = this.getFragmentUniqueKey(frag);
    const requestStartTime = this.fragmentLoadingMap.get(fragmentKey);

    if (!fragmentKey || requestStartTime === undefined) {
      logger.warn(`[NetworkFeaturesCollectManager] Fragment loading time not found for loaded fragment: ${fragmentKey}`);
      return;
    }

    // Calculate TTFB from fragment stats
    const stats = frag.stats;
    if (!stats || !stats.loading || stats.loading.first === undefined) {
      logger.warn('[NetworkFeaturesCollectManager] Fragment stats incomplete for TTFB calculation');
      this.fragmentLoadingMap.delete(fragmentKey);
      return;
    }

    // Calculate TTFB: time from request start to first byte received
    const ttfb = stats.loading.first - requestStartTime;

    if (ttfb >= 0) {
      // Add TTFB sample to current period
      this.periodTTFBSamples.push(ttfb);
      this.logDebug(`[NetworkFeaturesCollectManager] TTFB sample added: ${ttfb.toFixed(1)}ms (period has ${this.periodTTFBSamples.length} samples)`);
    } else {
      logger.warn(`[NetworkFeaturesCollectManager] Invalid TTFB calculated: ${ttfb}`);
    }

    // Clean up the loading map entry
    this.fragmentLoadingMap.delete(fragmentKey);
  };

  /**
   * Get current network features based on incremental statistics (O(1) operation)
   */
  getNetworkFeatures = (): NetworkFeatures => {
    return {
      throughput: this.getStatisticsFromRunning(this.throughputStats),
      ttfb: this.getStatisticsFromRunning(this.ttfbStats),
      records: this.records,
      recordsCSV: NetworkFeaturesCollectManager.recordsToCSV(this.records),
    };
  };

  /**
   * Reset all statistics (useful when changing configuration significantly)
   */
  resetStatistics = (): void => {
    this.throughputStats = {
      count: 0,
      mean: 0,
      m2: 0,
      min: Infinity,
      max: -Infinity,
    };
    this.ttfbStats = {
      count: 0,
      mean: 0,
      m2: 0,
      min: Infinity,
      max: -Infinity,
    };
    this.records = [];
    this.periodTTFBSamples = [];
    this.lastFragDownloadStats = undefined;
  };

  /**
   * Get the raw records for debugging or advanced analysis
   */
  getRecords = (): NetworkRecord[] => this.records;

  /**
   * Get the number of periods processed
   */
  getRecordCount = (): number => this.records.length;

  /**
   * Download all collected period records as a JSON file.
   * File name pattern: `network-features-<ISO-timestamp>.json`
   */
  downloadRecordsAsJson = __DEVELOPMENT__ ? (): void => {
    if (this.records.length === 0) {
      logger.warn('[NetworkFeaturesCollectManager] No network records to download');
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(this.records, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `network-features-${new Date().toISOString()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      logger.error('[NetworkFeaturesCollectManager] Failed to download network records', error);
    }
  } : FREEZED_EMPTY_FUNCTION;

  private recordNetworkFeatures = () => {
    const features = this.getNetworkFeatures();
    const recordsCSV = features.recordsCSV;
    const records = features.records;
    features.records = [];
    features.recordsCSV = '';
    const sampledRecordNetworkFeatures = sampler(() => {
      features.records = records;
      features.recordsCSV = recordsCSV;
    });

    sampledRecordNetworkFeatures();
    VODPlaybackSession.getInstance().recordNetworkFeatures(features);
  };

  /**
   * Clean up and remove all listeners
   */
  destroy = () => {
    // Clear the period timer
    this.stopPeriodTimer();

    this.bindHlsEvents(true);
    this.resetStatistics();
    this.fragmentLoadingMap.clear();
    this.hls = undefined;
    this.ExternalHls = undefined;
    VODPlaybackSession.getInstance().getEventEmitter().off(VODPlaybackEvents.endPlayback, this.recordNetworkFeatures);
    this.player?.off(PLAYER_EVENTS.hlsSetup, this.onHlsSetup);
    logger.info('[NetworkFeaturesCollectManager] Destroyed');

    super.destroy();
  };
}

/**
 * Attach the NetworkFeaturesCollectManager to a player
 * Returns a detach function for cleanup
 */
export function attachNetworkFeaturesCollectManager({
  player,
}: {
  player: Player;
}) {
  const manager = new NetworkFeaturesCollectManager({ player });
  player.on(PLAYER_EVENTS.remove, manager.destroy);

  // Expose helper functions globally for easy dev inspection
  exposeToTubiGlobal({
    getNetworkFeaturesRecords: () => manager.getRecords(),
    downloadNetworkFeaturesRecords: () => manager.downloadRecordsAsJson(),
  });

  return () => {
    player.removeListener(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
}
