import { interceptorManager } from '@adrise/player';
import type { PLAYER_EVENTS, Player } from '@adrise/player';
import { debug } from '@adrise/player/lib/utils/tools';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

export abstract class BasePlayerManager<PlayerType extends Player | LivePlayerWrapper> {
  protected player?: PlayerType;

  log: (...args: unknown[]) => void;

  constructor({
    player,
  }: {
    player: PlayerType;
  }) {
    this.player = player;
    const name = this.constructor.name.replace(/Manager$/, '');

    /* istanbul ignore if */
    if (FeatureSwitchManager.isEnabled(['Logging', 'PlayerManager']) || FeatureSwitchManager.get(['Logging', 'PlayerManager']) === name) {
      this.log = debug(name);
      interceptorManager.toggleDebug(true);
    } else {
      this.log = () => {};
    }
  }

  addPlayerEventListener(event: PLAYER_EVENTS, fn: () => void) {
    this.player?.on(event, fn);
  }

  removePlayerEventListener(event: PLAYER_EVENTS, fn: () => void) {
    this.player?.off(event, fn);
  }

  destroy() {
    delete this.player;
  }
}
