import { interceptorManager, Player } from '@adrise/player';
import type { PLAYER_EVENTS } from '@adrise/player';
import { debug } from '@adrise/player/lib/utils/tools';

import type WebMAFPlayerWrapper from 'client/features/playback/old-vod/WebMAFPlayerWrapper';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import { LivePlayerWrapper } from '../live/LivePlayerWrapper';

const generatePlayerEventBinder = (remove: boolean) => (player: Player | LivePlayerWrapper | undefined, event: PLAYER_EVENTS, fn: () => void) => {
  const key = remove ? 'off' : 'on';
  /* istanbul ignore else */
  if (player instanceof Player) {
    player[key](event, fn);
  } else if (player instanceof LivePlayerWrapper) {
    player[key](event, fn);
  }
};

export const addPlayerEventListener = generatePlayerEventBinder(false);
export const removePlayerEventListener = generatePlayerEventBinder(true);

export abstract class BasePlayerManager<PlayerType extends Player | LivePlayerWrapper | WebMAFPlayerWrapper> {
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
