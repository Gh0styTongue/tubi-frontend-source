import type { Player } from '@adrise/player';
import { useCallback, useRef } from 'react';

import { trackTimeupdateStats } from 'client/features/playback/track/client-log/trackTimeupdateStats';
import { exposeToTubiGlobal } from 'client/global';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getDebugLog } from 'common/utils/debug';
import { useOnPlayerCreate } from 'web/features/playback/contexts/playerContext/hooks/useOnPlayerCreate';

const logger = getDebugLog('TimeUpdateMonitor');

// What % of devices should we collect timeupdate data from? 1 is 100%, 0 is 0%
export const PLATFORM_SAMPLE_RATES: Partial<Record<OTTPLATFORM, number>> = {
  FIRETV_HYB: 0.10,
};

// fall back on this sample rate if no platform-specific rate is defined
export const DEFAULT_SAMPLE_RATE = 0.10;

// how many decimal places to round to when logging timeupdate differences
const DEBUG_LOG_PRECISION = 5;

// Threshold for considering a timeupdate difference to be "tiny"
// we ignore diffs smaller than this because they do strange things to the average
const TINY_DIFF_THRESHOLD = 0.01;

/**
 * Should we collect timeupdate data from this device?
 */
let shouldCollect: undefined | boolean;
export const getShouldCollect = () => {
  if (shouldCollect === undefined) {
    const platformSampleRate = PLATFORM_SAMPLE_RATES[__OTTPLATFORM__];
    const sampleRate = platformSampleRate !== undefined ? platformSampleRate : DEFAULT_SAMPLE_RATE;
    shouldCollect = Math.random() < sampleRate;
  }
  if (FeatureSwitchManager.isEnabled(['Player', 'ForceTimeUpdateMonitor'])) {
    return true;
  }
  return shouldCollect;
};

// for testing only
export const resetShouldCollect = () => {
  shouldCollect = undefined;
};

/**
 * Allows us to monitor and analyze the frequency of timeupdate events from
 * the player.
 */
export class TimeUpdateMonitor {
  // time of the last timeupdate we saw
  private lastPosition?: number;

  // Sum of all timeupdate differences
  private timeupdateDiffSum = 0;

  // How many updates were over 1 second
  private updatesOverOneSecond = 0;

  // How many updates were under 1 second
  private updatesUnderOneSecond = 0;

  private checkFeatureSwitch = () => {
    return FeatureSwitchManager.isEnabled(['Player', 'ForceTimeUpdateMonitor']);
  };

  /**
   * Intended to be used internally for logging purposes, but can
   * also be called by the developer via Tubi global
   */
  getStats = () => {
    const totalCount = this.updatesOverOneSecond + this.updatesUnderOneSecond;
    const average = this.timeupdateDiffSum / (totalCount || 1);
    const slowTimeupdateRatio = this.updatesOverOneSecond / (totalCount || 1) * 100;
    return {
      average,
      slowTimeupdateRatio,
      updatesOverOneSecond: this.updatesOverOneSecond,
      updatesUnderOneSecond: this.updatesUnderOneSecond,
    };
  };

  /**
   * Intended to be passed as handler for the player's timeupdate event
   */
  timeUpdateHandler = (event: Event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    const elm = event.target;
    const isPlaying = !elm.paused && !elm.ended && elm.readyState > 2 && !elm.seeking;
    const position = elm.currentTime;

    if (!isPlaying) {
      this.lastPosition = undefined;
      return;
    }

    if (!this.lastPosition) {
      this.lastPosition = position;
      return;
    }
    const difference = position - this.lastPosition;

    // if we have a negative difference, something weird happened and we should
    // ignore this update (likely events arriving out of order...). Also seems
    // to occur when resuming after ads.
    if (difference < 0) {
      if (this.checkFeatureSwitch()) logger('negative diff', difference);
      return;
    }

    // Tiny diffs are ignored because they can cause the average to be
    // skewed by a few very small values. These tend to happen when some event
    // takes place that stops playback-- we can sometimes get a quick timeupdate
    // that fires almost synchronously with the event that stops playback.
    if (difference < TINY_DIFF_THRESHOLD) {
      if (this.checkFeatureSwitch()) logger('tiny diff', difference);
      return;
    }

    this.lastPosition = position;
    this.timeupdateDiffSum += difference;
    if (difference >= 1) {
      this.updatesOverOneSecond += 1;
    } else {
      this.updatesUnderOneSecond += 1;
    }

    // optional verbose logging
    if (this.checkFeatureSwitch()) {
      logger('diff', difference.toFixed(DEBUG_LOG_PRECISION));
    }
  };
}

/**
 * This hook wraps a class which allows us to monitor the frequency '
 * of timeupdate events from the player.
 */
export const useTimeupdateMonitor = () => {
  const enableMonitor = getShouldCollect();
  const timeUpdateMonitorRef = useRef(enableMonitor ? new TimeUpdateMonitor() : undefined);

  useOnPlayerCreate(useCallback((player: Player) => {
    const timeUpdateMonitor = timeUpdateMonitorRef.current;
    const timeupdateHandler = timeUpdateMonitorRef.current?.timeUpdateHandler;
    if (!enableMonitor || !timeupdateHandler || !timeUpdateMonitor) return;
    exposeToTubiGlobal({ timeUpdateMonitor });

    player.getCurrentVideoElement()?.addEventListener('timeupdate', timeupdateHandler);

    return () => {
      player.getCurrentVideoElement()?.removeEventListener('timeupdate', timeupdateHandler);
      // Send up logs on unmount
      trackTimeupdateStats(timeUpdateMonitor.getStats());
    };
    // intentionally do not include enableMonitor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  return {
    // exposed so the caller can interact with the monitor
    timeUpdateMonitorRef,
  };
};

