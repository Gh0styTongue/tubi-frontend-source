import { PLAYER_EVENTS, PlayerName } from '@adrise/player';
import type { Player, AdTimeEventData } from '@adrise/player';
import { secs } from '@adrise/utils/lib/time';

import { VODPlaybackSession, VODPlaybackEvents } from 'common/playback/VODPlaybackSession';

import { BasePlayerManager } from './BasePlayerManager';
import type { LivePlayerWrapper } from '../live/LivePlayerWrapper';
import { addViewTime, addAdViewTime } from '../session/VODPageSession';

export interface ViewTimeManagerOptions {
  player: Player | LivePlayerWrapper;
  getTrack: () => (position: number, secondsOfViewTime: number) => void;
}

export class ViewTimeManager extends BasePlayerManager<Player | LivePlayerWrapper> {
  // Number of seconds of view time. Should fire play progress event every 10 seconds
  private secondsOfViewTime = 0;

  private totalViewTime = 0;

  // The start position before instantiating the time listener
  private prevPosition = 0;

  private totalAdViewTime = 0;

  private prevAdPosition = 0;

  private getTrack: ViewTimeManagerOptions['getTrack'];

  constructor({
    player,
    getTrack,
  }: ViewTimeManagerOptions) {
    super({ player });
    this.getTrack = getTrack;
    this.prevPosition = this.player?.getPosition() ?? 0;
    this.secondsOfViewTime = 0;
    this.managerPlayerEventSubscription();
    this.manageVODSessionEventSubscription();
  }

  destroy = () => {
    this.managerPlayerEventSubscription(true);
    this.manageVODSessionEventSubscription(true);
    this.flushPlayProgressEvent();
    this.addViewTimeToVODSession();
    super.destroy();
  };

  private addViewTimeToVODSession = () => {
    if (this.player?.playerName !== PlayerName.VOD) return;
    VODPlaybackSession.getInstance().addViewTime(this.totalViewTime);
    VODPlaybackSession.getInstance().addAdViewTime(this.totalAdViewTime);
    addViewTime(this.totalViewTime);
    addAdViewTime(this.totalAdViewTime);
    this.totalViewTime = 0;
    this.totalAdViewTime = 0;
  };

  private manageVODSessionEventSubscription(remove = false) {
    if (this.player?.playerName !== PlayerName.VOD) return;
    const key = remove ? 'off' : 'on';
    VODPlaybackSession.getInstance().getEventEmitter()[key](VODPlaybackEvents.addViewTime, this.addViewTimeToVODSession);
  }

  private managerPlayerEventSubscription(remove = false) {
    const { player } = this;
    /* istanbul ignore if */
    if (!player) return;
    const key: keyof Player = remove ? 'off' : 'on';
    const operation = (player as Player)[key]?.bind(player);
    operation(PLAYER_EVENTS.time, this.timeHandler);
    operation(PLAYER_EVENTS.adTime, this.adTimeHandler);
    operation(PLAYER_EVENTS.adPlay, this.flushPlayProgressEvent);
    operation(PLAYER_EVENTS.complete, this.flushPlayProgressEvent);
    operation(PLAYER_EVENTS.pause, this.flushPlayProgressEvent);
    operation(PLAYER_EVENTS.remove, this.flushPlayProgressEvent);
  }

  private timeHandler = ({ position }: { position: number }) => {
    const nowPosition = Math.floor(position);

    if (nowPosition !== this.prevPosition) {
      this.prevPosition = nowPosition;
      this.secondsOfViewTime++;
      this.totalViewTime++;
    }

    if (secs(this.secondsOfViewTime) >= secs(10)) {
      this.emitPlayProgressEvent(position);
    }
  };

  private adTimeHandler = ({ position }: AdTimeEventData) => {
    const nowAdPosition = Math.floor(position);
    if (nowAdPosition !== this.prevAdPosition) {
      this.prevAdPosition = nowAdPosition;
      this.totalAdViewTime++;
    }
  };

  private emitPlayProgressEvent(position: number) {
    this.getTrack()(position, this.secondsOfViewTime);
    this.secondsOfViewTime = 0;
  }

  // Send play progress event if there is any remaining view time.
  // This is useful right before an AdStart event or right before
  // a NavigateToPageEvent (autoplay to next video or back to details page)
  private flushPlayProgressEvent = () => {
    const position = this.player?.getPosition() ?? 0;
    // Only fire if view_time > 0
    if (this.secondsOfViewTime > 0) {
      this.emitPlayProgressEvent(position);
    }
  };
}
