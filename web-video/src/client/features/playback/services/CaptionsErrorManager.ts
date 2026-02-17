import type { CaptionsErrorEventData, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { BasePlayerManager } from './BasePlayerManager';
import { trackCaptionsError } from '../track/client-log/trackCaptionsError';

interface CaptionsErrorManagerOptions {
  /**
   * Note we accept only the Player interface here, not the LivePlayerWrapper
   */
  player: Player;
}

/**
 * This manager is responsible for logging errors originating in the player
 * related to captions fetching, parsing, etc.
 */
export class CaptionsErrorManager extends BasePlayerManager<Player> {
  constructor({
    player,
  }: CaptionsErrorManagerOptions) {
    super({ player });
    this.setupCaptionsErrorListeners(player);
  }

  destroy = () => {
    /* istanbul ignore next */
    if (this.player) this.tearDownCaptionsErrorListeners(this.player as Player);
    super.destroy();
  };

  private handleCaptionsError(error: CaptionsErrorEventData) {
    trackCaptionsError({ errorMessage: error.message });
  }

  private setupCaptionsErrorListeners(player: Player) {
    player.on(PLAYER_EVENTS.captionsError, this.handleCaptionsError);
  }

  private tearDownCaptionsErrorListeners(player: Player) {
    player.off(PLAYER_EVENTS.captionsError, this.handleCaptionsError);
  }
}
