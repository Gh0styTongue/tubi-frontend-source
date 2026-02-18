import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { getDebugLog } from 'common/utils/debug';

const logger = getDebugLog('TimeUpdateMonitor');

// how many decimal places to round to when logging timeupdate differences
const DEBUG_LOG_PRECISION = 5;

// Threshold for considering a timeupdate difference to be "tiny"
// we ignore diffs smaller than this because they do strange things to the average
const TINY_DIFF_THRESHOLD = 0.01;

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
    return FeatureSwitchManager.isEnabled(['Player', 'EnablePlayerUiPerfMonitor']);
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
      timeupdatesAverage: average,
      slowTimeupdateRatio,
      timeupdatesOverOneSecond: this.updatesOverOneSecond,
      timeupdatesUnderOneSecond: this.updatesUnderOneSecond,
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

