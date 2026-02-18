import { PLAYER_EVENTS, PlayerName } from '@adrise/player/lib';
import type { Player, AdPodCompleteEventData, BufferStartEventData, SeekEventData, TimeEventData, ErrorEventData } from '@adrise/player/lib';

import { BasePlayerManager } from './BasePlayerManager';
import { VODPageSessionEvents, getVODPageSessionEventEmitter } from '../session/VODPageSession';
import { trackResumeBeginningAfterAd } from '../track/client-log/trackResumeBeginningAfterAd';

export type ResumeBeginningAfterAdEvent = {
  resumePosition: number;
  timeupdatePosition: number;
  seekPosition: number;
  pauseCount: number;
  seekCount: number;
  bufferCount: number;
  hasCalledResumeSeek: boolean;
  resumeSeekFailed: boolean;
  pauseStage?: 'before' | 'after';
  bufferReason?: string;
  bufferStage?: 'before' | 'after';
  errorMessage?: string;
};

export class ResumeBeginningAfterAdManager extends BasePlayerManager<Player> {
  private resumeSession?: ResumeBeginningAfterAdEvent;

  private timeEvent: PLAYER_EVENTS;

  constructor({ player }: { player: Player }) {
    super({ player });

    // Use timeSeconds event when experiment is enabled, otherwise use standard time event
    this.timeEvent = player.experimentalConfig?.enableDiluteTimeEvent
      ? PLAYER_EVENTS.timeSeconds
      : PLAYER_EVENTS.time;

    /* istanbul ignore next: safety check only */
    if (!this.player && player.playerName !== PlayerName.VOD) return;

    this.handleEventListener(player, false);
  }

  destroy() {
    if (!this.player) return;
    this.handleEventListener(this.player, true);
    this.endResumeSession();
    super.destroy();
  }

  private handleEventListener(player: Pick<Player, keyof Player>, remove: boolean) {
    const func = player[remove ? 'off' : 'on'].bind(player);
    func(PLAYER_EVENTS.adPodComplete, this.onAdPodComplete);
    func(PLAYER_EVENTS.contentStart, this.endResumeSession);
  }

  private onAdPodComplete = ({ position: resumePosition }: AdPodCompleteEventData) => {
    if (resumePosition === 0) return;
    this.startResumeSession(resumePosition);
  };

  private handleResumeSessionEventListeners(remove: boolean) {
    /* istanbul ignore if: safety check only */
    if (!this.player) return;
    // ensure events only added once
    if (remove === false) {
      this.handleResumeSessionEventListeners(true);
    }
    const func = this.player[remove ? 'off' : 'on'].bind(this.player);
    func(PLAYER_EVENTS.seek, this.onSeek);
    func(this.timeEvent, this.onTime);
    func(PLAYER_EVENTS.bufferStart, this.onBufferStart);
    func(PLAYER_EVENTS.pause, this.onPause);
    func(PLAYER_EVENTS.error, this.onError);
    func(PLAYER_EVENTS.seekFailed, this.onSeekFailed);
  }

  private onSeek = ({ position, offset }: SeekEventData) => {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession) return;
    const { resumePosition, seekCount } = this.resumeSession;
    // This should be the resume seek.
    if (position === offset && offset === resumePosition) {
      this.resumeSession.hasCalledResumeSeek = true;
      return;
    }
    this.resumeSession.seekCount++;
    if (seekCount === 0) {
      this.resumeSession.seekPosition = position;
    }
    if (position < resumePosition - 10) {
      this.markResumeBeginningAfterAd();
    }
  };

  private onSeekFailed = ({ position, offset }: SeekEventData) => {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession) return;

    // This should be the resume seek.
    /* istanbul ignore else: no other branch required */
    if (position === offset && offset === this.resumeSession.resumePosition) {
      this.resumeSession.resumeSeekFailed = true;
    }
  };

  private onTime = ({ position }: TimeEventData) => {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession) return;
    const { timeupdatePosition, resumePosition } = this.resumeSession;
    if (timeupdatePosition === -1) {
      this.resumeSession.timeupdatePosition = position;
    }
    if (position < resumePosition - 10) {
      this.markResumeBeginningAfterAd();
    }
  };

  private onBufferStart = ({ reason }: BufferStartEventData) => {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession || !this.player) return;
    this.resumeSession.bufferCount++;
    // Only logs the first buffer case
    if (this.resumeSession.bufferCount > 1) return;
    this.resumeSession.bufferReason = reason;
    // No precise position means not loading
    /* istanbul ignore next: ignore branch check here */
    this.resumeSession.bufferStage = this.player.getPrecisePosition() < this.resumeSession.resumePosition ? 'before' : 'after';
  };

  private onPause = () => {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession || !this.player) return;
    this.resumeSession.pauseCount++;
    // Only logs the first pause case
    if (this.resumeSession.pauseCount > 1) return;
    // No precise position means not loading
    /* istanbul ignore next: ignore branch check here */
    this.resumeSession.pauseStage = this.player.getPrecisePosition() < this.resumeSession.resumePosition ? 'before' : 'after';
  };

  private onError = (data: ErrorEventData) => {
    if (!this.resumeSession || this.resumeSession.errorMessage) return;
    this.resumeSession.errorMessage = data.message;
  };

  private startResumeSession(resumePosition: number) {
    this.log('resume session start');
    this.resumeSession = {
      resumePosition,
      timeupdatePosition: -1,
      seekPosition: -1,
      pauseCount: 0,
      seekCount: 0,
      bufferCount: 0,
      hasCalledResumeSeek: false,
      resumeSeekFailed: false,
    };
    this.handleResumeSessionEventListeners(false);
  }

  private endResumeSession = () => {
    this.log('end resume session', this.resumeSession);
    this.handleResumeSessionEventListeners(true);
    delete this.resumeSession;
  };

  private markResumeBeginningAfterAd() {
    /* istanbul ignore if: safety check only */
    if (!this.resumeSession) return;
    this.log('mark resume beginning after ad', this.resumeSession);
    trackResumeBeginningAfterAd(this.resumeSession);
    getVODPageSessionEventEmitter().emit(VODPageSessionEvents.resumeBeginningAfterAd);
    this.endResumeSession();
  }
}

export function attachResumeBeginningAfterAdManager(player: Player) {
  const manager = new ResumeBeginningAfterAdManager({ player });
  return () => manager.destroy();
}
