import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { mins, secs } from '@adrise/utils/lib/time';
import { toFixed2 } from '@adrise/utils/lib/tools';

import logger from 'common/helpers/logging';

import { VODPlaybackEvents, VODPlaybackSession } from '../../session/VODPlaybackSession';
import { BasePlayerManager } from '../BasePlayerManager';
import { loadStore, saveStore, updateSlidingWindow } from './store';
import { BufferRatioGroup, type HysteresisThresholds, StreakCategory, THRESHOLDS_VERSION, THRESHOLDS_V1_1, type ToleranceStreakResult } from './types';

// ============================================================================
// BUFFER RATIO CLASSIFICATION MANAGER
// ============================================================================

export class BufferRatioClassificationManager extends BasePlayerManager<Player> {
  private currentGroup: BufferRatioGroup = BufferRatioGroup.CORE;
  private lastMovement: { from: BufferRatioGroup; to: BufferRatioGroup; timestamp: number } | undefined;

  constructor({ player }: { player: Player }) {
    super({ player });
    this.loadCurrentGroup();
    this.vodPlaybackSessionListener('prependListener');
  }

  /**
   * Categorize a single buffer ratio into one of the 4 trigger categories
   * @param ratio - Buffer ratio (0-100, where 0.02 = 0.02%)
   * @param thresholds - Hysteresis thresholds for categorization
   * @param currentGroup - Current buffer ratio group to determine which categories are relevant
   * @returns The streak category for this ratio
   */
  static getStreakCategory(ratio: number, thresholds: HysteresisThresholds, currentGroup: BufferRatioGroup): StreakCategory {
    switch (currentGroup) {
      case BufferRatioGroup.BEST:
        // From BEST group, only EXIT_BEST is relevant
        if (ratio >= thresholds.coreToBest.exitBestBufferRatio) {
          return StreakCategory.EXIT_BEST;
        }
        return StreakCategory.NONE;

      case BufferRatioGroup.CORE:
        // From CORE group, both ENTER_BEST and ENTER_LOW_END are relevant
        if (ratio <= thresholds.coreToBest.enterBestBufferRatio) {
          return StreakCategory.ENTER_BEST;
        }
        if (ratio >= thresholds.coreToLowEnd.enterLowEndBufferRatio) {
          return StreakCategory.ENTER_LOW_END;
        }
        return StreakCategory.NONE;

      case BufferRatioGroup.LOW_END:
        // From LOW_END group, only EXIT_LOW_END is relevant
        if (ratio <= thresholds.coreToLowEnd.exitLowEndBufferRatio) {
          return StreakCategory.EXIT_LOW_END;
        }
        return StreakCategory.NONE;

      default:
        return StreakCategory.NONE;
    }
  }

  /**
   * Get the tail streak from the buffer ratio window
   * @param ratios - Array of buffer ratios
   * @param thresholds - Hysteresis thresholds for categorization
   * @param currentGroup - Current buffer ratio group to determine which categories are relevant
   * @returns Object containing the category and length of the tail streak
   */
  static getTailStreak(
    ratios: number[],
    thresholds: HysteresisThresholds,
    currentGroup: BufferRatioGroup
  ): { category: StreakCategory; length: number } {
    if (ratios.length === 0) {
      return { category: StreakCategory.NONE, length: 0 };
    }

    // Start from the tail (most recent) and work backwards
    const tailCategory = BufferRatioClassificationManager.getStreakCategory(ratios[ratios.length - 1], thresholds, currentGroup);

    if (tailCategory === StreakCategory.NONE) {
      return { category: StreakCategory.NONE, length: 0 };
    }

    let streakLength = 0;

    // Count consecutive matches from the tail backwards
    for (let i = ratios.length - 1; i >= 0; i--) {
      const currentCategory = BufferRatioClassificationManager.getStreakCategory(ratios[i], thresholds, currentGroup);
      if (currentCategory === tailCategory) {
        streakLength++;
      } else {
        break; // Stop when streak breaks
      }
    }

    return { category: tailCategory, length: streakLength };
  }

  /**
   * V1.1: Check tolerance requirement for ENTER transitions (allow 1 break in required count)
   * @param ratios - Array of buffer ratios
   * @param thresholds - Hysteresis thresholds for categorization
   * @param currentGroup - Current buffer ratio group
   * @param targetCategory - Target category to count
   * @param requiredCount - Required number of qualifying sessions
   * @returns Tolerance streak result with counts and requirement status
   */
  private static checkToleranceRequirement(
    ratios: number[],
    thresholds: HysteresisThresholds,
    currentGroup: BufferRatioGroup,
    targetCategory: StreakCategory,
    requiredCount: number
  ): ToleranceStreakResult {
    let qualifyingCount = 0;
    let breaksUsed = 0;
    let totalExamined = 0;
    const maxBreaks = 1;
    const maxExamine = requiredCount + maxBreaks; // e.g., 6 for "5 of 6"

    // Scan from tail backwards, examining up to maxExamine sessions
    for (let i = ratios.length - 1; i >= 0 && totalExamined < maxExamine; i--) {
      totalExamined++;
      const category = this.getStreakCategory(ratios[i], thresholds, currentGroup);

      if (category === targetCategory) {
        qualifyingCount++;
      } else {
        // If we would exceed max breaks, stop examining
        if (breaksUsed >= maxBreaks) {
          break;
        }
        breaksUsed++;
      }
    }

    return {
      qualifyingCount,
      totalExamined,
      breaksUsed,
      meetsRequirement: qualifyingCount >= requiredCount && breaksUsed <= maxBreaks,
    };
  }

  /**
   * Decide the next group based on the current group and buffer ratio window
   * V1.1: Uses tolerance for ENTER transitions, strict consecutive for EXIT transitions
   * @param current - Current buffer ratio group
   * @param window - Array of buffer ratios
   * @param thresholds - Hysteresis thresholds
   * @returns Next buffer ratio group
   */
  static decideNextGroup(
    current: BufferRatioGroup,
    window: number[],
    thresholds: HysteresisThresholds
  ): BufferRatioGroup {
    // For EXIT transitions, use existing strict consecutive logic
    const tailStreak = BufferRatioClassificationManager.getTailStreak(window, thresholds, current);

    switch (current) {
      case BufferRatioGroup.BEST:
        // EXIT uses strict consecutive (no tolerance)
        if (tailStreak.category === StreakCategory.EXIT_BEST &&
            tailStreak.length >= thresholds.coreToBest.exitBestSessionCount) {
          return BufferRatioGroup.CORE;
        }
        return BufferRatioGroup.BEST;

      case BufferRatioGroup.CORE:
        // ENTER transitions use tolerance
        const bestResult = this.checkToleranceRequirement(
          window,
          thresholds,
          current,
          StreakCategory.ENTER_BEST,
          thresholds.coreToBest.enterBestSessionCount
        );

        if (bestResult.meetsRequirement) {
          return BufferRatioGroup.BEST;
        }

        const lowEndResult = this.checkToleranceRequirement(
          window,
          thresholds,
          current,
          StreakCategory.ENTER_LOW_END,
          thresholds.coreToLowEnd.enterLowEndSessionCount
        );

        if (lowEndResult.meetsRequirement) {
          return BufferRatioGroup.LOW_END;
        }

        return BufferRatioGroup.CORE;

      case BufferRatioGroup.LOW_END:
        // EXIT uses strict consecutive (no tolerance)
        if (tailStreak.category === StreakCategory.EXIT_LOW_END &&
            tailStreak.length >= thresholds.coreToLowEnd.exitLowEndSessionCount) {
          return BufferRatioGroup.CORE;
        }
        return BufferRatioGroup.LOW_END;

      default:
        return BufferRatioGroup.CORE;
    }
  }

  vodPlaybackSessionListener(method: 'prependListener' | 'off') {
    VODPlaybackSession.getInstance().getEventEmitter()[method](VODPlaybackEvents.reportPlaybackSessionData, this.recordBufferRatioGroupUpdate);
  }

  private loadCurrentGroup(): void {
    const record = loadStore();
    this.currentGroup = record.group;
  }

  private recordBufferRatioGroupUpdate = (): void => {
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    const viewTimeInMS = secs(playbackInfo.playbackViewTime);
    if (viewTimeInMS > mins(1)) {
      const bufferRatio = (playbackInfo.totalBufferingDuration / viewTimeInMS) * 100;
      this.logBufferRatio(bufferRatio);
    }

    VODPlaybackSession.getInstance().recordBufferRatioGroupUpdate({
      current: this.currentGroup,
      last: this.lastMovement?.from || this.currentGroup,
      version: THRESHOLDS_VERSION,
      moved: this.wasLastSessionMovement(),
      bufferRatioWindow: this.getWindowRatios(),
    });
  };

  logBufferRatio = (bufferRatio: number): void => {
    // V1.1: Cap extreme values and log warnings for abnormal samples
    const cappedRatio = toFixed2(Math.min(bufferRatio, 100)); // Cap at 100%

    // Log warning for abnormal values
    if (bufferRatio > 50) {
      logger.warn(`Abnormal buffer ratio detected: original=${toFixed2(bufferRatio)}, capped=${cappedRatio}, threshold=50`);
    }

    // Get or create device record
    let record = loadStore();

    // Update sliding window with capped value
    record = updateSlidingWindow(record, cappedRatio);

    // Use stored ratios for classification
    const windowRatios = record.bufferRatioWindow;

    // V1.1: Decide next group using tolerance-based approach
    const nextGroup = BufferRatioClassificationManager.decideNextGroup(record.group, windowRatios, THRESHOLDS_V1_1);

    // Check for group movement
    const groupChanged = nextGroup !== record.group;
    if (groupChanged) {
      this.lastMovement = {
        from: record.group,
        to: nextGroup,
        timestamp: Date.now(),
      };

      logger.info(`Device group transition: ${record.group} -> ${nextGroup} (version: ${THRESHOLDS_VERSION})`);

      // Update the record
      record.group = nextGroup;
      this.currentGroup = nextGroup;
    }

    // Save updated record
    saveStore(record);
  };

  wasLastSessionMovement(): boolean {
    // Simply return whether this manager instance had a movement
    return this.lastMovement !== undefined;
  }

  getWindowRatios(): number[] {
    const record = loadStore();
    return record.bufferRatioWindow;
  }

  getDeviceGroup(): BufferRatioGroup {
    return this.currentGroup;
  }

  destroy(): void {
    this.vodPlaybackSessionListener('off');
    if (this.player) {
      this.player.off(PLAYER_EVENTS.startLoad, this.loadCurrentGroup);
    }
    super.destroy();
  }
}

export function attachBufferRatioClassificationManager({ player }: { player: Player }) {
  const manager = new BufferRatioClassificationManager({ player });

  const cleanup = () => {
    player.off(PLAYER_EVENTS.remove, cleanup);
    manager.destroy();
  };

  player.on(PLAYER_EVENTS.remove, cleanup);

  return cleanup;
}
