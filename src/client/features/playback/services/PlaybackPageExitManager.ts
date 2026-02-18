import { PLAYER_EVENTS } from '@adrise/player';
import type { Player } from '@adrise/player';

import type { VideoResource } from 'common/types/video';

import { BasePlayerManager } from './BasePlayerManager';
import { isPackagePlayer } from '../predicates/isPackagePlayer';
import { VODPageSessionEvents, getVODPageSessionEventEmitter } from '../session/VODPageSession';
import { trackPlayerPageExit } from '../track/client-log';

let playbackPageExitManagerCount = 0;

export function hasPlaybackPageExitManager() {
  return playbackPageExitManagerCount > 0;
}

export class PlaybackPageExitManager extends BasePlayerManager<Player> {
  private contentId: string;

  private getVideoResource: () => VideoResource | undefined;

  private isDestroyed: boolean = false;

  constructor({
    player,
    contentId,
    getVideoResource,
  }: {
    player: Player;
    contentId: string;
    getVideoResource: () => VideoResource | undefined;
  }) {
    super({ player });
    this.contentId = contentId;
    this.getVideoResource = getVideoResource;
    getVODPageSessionEventEmitter().addListener(VODPageSessionEvents.ended, this.trackPlaybackPageExit);
    playbackPageExitManagerCount++;
  }

  destroy = () => {
    /* istanbul ignore if */
    if (this.isDestroyed) return;
    getVODPageSessionEventEmitter().removeListener(VODPageSessionEvents.ended, this.trackPlaybackPageExit);
    this.isDestroyed = true;
    playbackPageExitManagerCount--;
    super.destroy();
  };

  private trackPlaybackPageExit = () => {
    const { player, contentId } = this;
    const videoResource = this.getVideoResource();
    /* istanbul ignore if */
    if (typeof player === 'undefined' || !isPackagePlayer(player) || !videoResource) return;
    trackPlayerPageExit({
      player,
      contentId,
      videoResource,
    });
  };
}

export function attachPlaybackPageExitManager({
  player,
  contentId,
  getVideoResource,
}: {
  player: Player;
  contentId: string;
  getVideoResource: () => VideoResource | undefined;
}) {
  const manager = new PlaybackPageExitManager({ player, contentId, getVideoResource });
  player.on(PLAYER_EVENTS.remove, manager.destroy);
  return () => {
    player.removeListener(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
}
