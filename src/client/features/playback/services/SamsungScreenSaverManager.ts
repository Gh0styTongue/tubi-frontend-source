import { PLAYER_EVENTS, PlayerName } from '@adrise/player';
import type { Player } from '@adrise/player';

import { BasePlayerManager } from './BasePlayerManager';

export class SamsungScreenSaverManager extends BasePlayerManager<Player> {
  constructor({ player }: { player: Player }) {
    super({ player });
    /* istanbul ignore if: to ensure only works on Samsung VOD player */
    if (__OTTPLATFORM__ !== 'TIZEN' || player.playerName !== PlayerName.VOD) return;
    this.addPlayerEventListener(PLAYER_EVENTS.pause, this.enableScreenSaver);
    this.addPlayerEventListener(PLAYER_EVENTS.adPause, this.enableScreenSaver);
    this.addPlayerEventListener(PLAYER_EVENTS.stop, this.enableScreenSaver);
    this.addPlayerEventListener(PLAYER_EVENTS.play, this.disableScreenSaver);
    this.addPlayerEventListener(PLAYER_EVENTS.adPlay, this.disableScreenSaver);
  }

  destroy = () => {
    this.removePlayerEventListener(PLAYER_EVENTS.pause, this.enableScreenSaver);
    this.removePlayerEventListener(PLAYER_EVENTS.adPause, this.enableScreenSaver);
    this.removePlayerEventListener(PLAYER_EVENTS.stop, this.enableScreenSaver);
    this.removePlayerEventListener(PLAYER_EVENTS.play, this.disableScreenSaver);
    this.removePlayerEventListener(PLAYER_EVENTS.adPlay, this.disableScreenSaver);
    super.destroy();
  };

  private setScreenSaver(on: boolean) {
    /* istanbul ignore if: API check */
    if (!window.webapis?.appcommon) return;
    const { appcommon } = window.webapis;
    /* istanbul ignore if: API check */
    if (typeof appcommon.setScreenSaver !== 'function' || !appcommon.AppCommonScreenSaverState) return;
    appcommon.setScreenSaver(on ? appcommon.AppCommonScreenSaverState.SCREEN_SAVER_ON : appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
  }

  private enableScreenSaver = () => {
    this.setScreenSaver(true);
  };

  private disableScreenSaver = () => {
    this.setScreenSaver(false);
  };
}

export function attachSamsungScreenSaverManager(player: Player) {
  const manager = new SamsungScreenSaverManager({ player });
  player.on(PLAYER_EVENTS.remove, manager.destroy);
  return () => {
    player.off(PLAYER_EVENTS.remove, manager.destroy);
    manager.destroy();
  };
}
