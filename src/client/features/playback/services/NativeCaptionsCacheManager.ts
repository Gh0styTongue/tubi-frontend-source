import { PLAYER_EVENTS, type Player } from '@adrise/player';

import type { Experiment } from 'common/experiments/Experiment';

import { BasePlayerManager } from './BasePlayerManager';
interface NativeCaptionsCacheManagerOptions {
    player: Player;
    ottFireTVNativeCaptionsCache: Experiment;
}

class NativeCaptionsCacheManager extends BasePlayerManager<Player> {
  private ottFireTVNativeCaptionsCache: Experiment;

  constructor({
    player,
    ottFireTVNativeCaptionsCache,
  }: NativeCaptionsCacheManagerOptions) {
    super({ player });
    this.ottFireTVNativeCaptionsCache = ottFireTVNativeCaptionsCache;
    this.attachCaptionsAvailableEvents();
  }

  destroy = () => {
    super.destroy();
  };

  private attachCaptionsAvailableEvents() {
    this.player?.on(PLAYER_EVENTS.captionsChange, this.onCaptionsChange);
  }

  private onCaptionsChange = ({ captionsIndex }: { captionsIndex: number }) => {
    if (captionsIndex > 0) {
      this.ottFireTVNativeCaptionsCache.logExposure();
    }
  };
}

export function attachNativeCaptionsCacheManager(options: NativeCaptionsCacheManagerOptions) {
  const manager = new NativeCaptionsCacheManager(options);
  options.player.on(PLAYER_EVENTS.remove, manager.destroy);
  return () => {
    options.player.off(PLAYER_EVENTS.remove, manager.destroy);
  };
}
