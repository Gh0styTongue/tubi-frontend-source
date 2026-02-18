import type { Player } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';

import type { PlayerType } from 'client/features/playback/track/client-log';
import { ONE_SECOND } from 'common/constants/constants';
import type { UseOnPlayerCreateCallback } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import { RerenderMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/monitor/rerenderMonitor';
import { TimeUpdateMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/monitor/timeUpdateMonitor';

/**
 * This class is generally concerned with helping us measure the impact of our UI
 * and first-party JS code on the performance of our video player on player-related
 * pages. Sub-concerns include:
 * - measuring how frequenty we receive timeupdate messages from the player, which
 *   is a proxy for the impact of our JS on device resource usage
 * - measuring the re-rendering of React components
 *
 * As the classes referenced here for each concern are private, this class
 * is intended to be used as an interface for them, even if some methods
 * are just passthroughs. This helps enforce separation of concerns
 */
export class PlayerUiPerfMonitor {
  private timeUpdateMonitor: TimeUpdateMonitor;

  private rerenderMonitor: RerenderMonitor;

  private constructionTime: number;

  private playerType: PlayerType;

  constructor(playerType: PlayerType) {
    this.playerType = playerType;
    this.constructionTime = now();
    this.timeUpdateMonitor = new TimeUpdateMonitor();
    this.rerenderMonitor = new RerenderMonitor();
  }

  // Intended to be passed to the `useOnPlayerCreate` hook
  onPlayerCreate: UseOnPlayerCreateCallback = (player: Player) => {
    const timeUpdateHandler = this.timeUpdateMonitor.timeUpdateHandler;
    player.getCurrentVideoElement()?.addEventListener('timeupdate', timeUpdateHandler);
    return () => {
      player.getCurrentVideoElement()?.removeEventListener('timeupdate', timeUpdateHandler);
    };
  };

  // Intended to be called when unmonting page to get data suitable for logging
  getStats = () => {
    const sessionLengthSec = (now() - this.constructionTime) / ONE_SECOND;
    return {
      ...this.timeUpdateMonitor.getStats(),
      ...this.rerenderMonitor.getStats(sessionLengthSec),
      sessionLengthSec,
      playerType: this.playerType,
    };
  };

  // Mark a rerender for a component
  markRerender = (componentName: string) => this.rerenderMonitor.markRerender(componentName);
}
