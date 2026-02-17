import { PLAYER_EVENTS, PlayerName } from '@adrise/player';
import type { Player } from '@adrise/player';
import { PauseState } from '@tubitv/analytics/lib/playerEvent';

import { updateHdmiConnectionStatus } from 'client/features/playback/session/VODPageSession';
import { trackBackgroundPlayback } from 'client/features/playback/track/client-log/trackBackgroundPlayback';
import { trackOnHDMIConnected } from 'client/features/playback/track/client-log/trackOnHDMIConnected';
import { exposeToTubiGlobal } from 'client/global';
import systemApi from 'client/systemApi';
import { isAppHidden } from 'client/systemApi/utils';
import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import { PAUSE_TOGGLE } from 'common/constants/event-types';
import { buildPauseToggleEventObject } from 'common/utils/analytics';
import { trackEvent } from 'common/utils/track';

import { BasePlayerManager } from './BasePlayerManager';
import type { LivePlayerWrapper } from '../live/LivePlayerWrapper';

const sourceMap = {
  [PlayerName.Linear]: 'live',
  [PlayerName.Preview]: 'preview',
  [PlayerName.Trailer]: 'trailer',
} as const;

/* istanbul ignore next*/
export function getHDMIManagerConfig(player: Player | LivePlayerWrapper, contentId: string): ConstructorParameters<typeof HDMIManager>[0] {
  if ([PlayerName.Linear, PlayerName.Preview].includes(player.playerName!)) {
    return {
      player,
      source: sourceMap[player.playerName!],
      pauseDelay: 0,
      contentId,
      needAnalyticsEvent: false,
    };
  }
  return {
    player,
    source: 'video',
    pauseDelay: 1000,
    contentId,
    needAnalyticsEvent: true,
  };
}

const VALID_BACKGROUND_PLAYBACK_GAP_SECONDS = 5;

export class HDMIManager extends BasePlayerManager<Player | LivePlayerWrapper> {
  private source?: Parameters<typeof trackOnHDMIConnected>[0];

  private pauseDelay: number = 0;

  private pauseDelayTimer?: number;

  private contentId: string;

  private needAnalyticsEvent: boolean = false;

  private backgroundPlaybackTime: number = 0;

  private prevPosition: number = -1;

  private interactionTimesDuringBackgroundPlayback: number = 0;

  private backgroundPlaybackTimeWithInteraction: number = 0;

  private shouldStopBackgroundPlayback: boolean = false;

  constructor(option: {
    pauseDelay?: number;
    player: Player | LivePlayerWrapper;
    source: Parameters<typeof trackOnHDMIConnected>[0];
    contentId: string;
    needAnalyticsEvent: boolean;
    shouldStopBackgroundPlayback?: boolean;
  }) {
    super(option);
    exposeToTubiGlobal({ hdmiManager: this });
    this.player = option.player;
    this.pauseDelay = option.pauseDelay ?? 0;
    this.source = option.source;
    this.contentId = option.contentId;
    this.needAnalyticsEvent = option.needAnalyticsEvent;
    this.shouldStopBackgroundPlayback = option.shouldStopBackgroundPlayback ?? false;
    systemApi.addListener('onHdmiConnected', this.onHDMIConnected);
    this.addPlayerEventListener(PLAYER_EVENTS.time, this.pauseIfPlayWithHDMIDisconnected);
    this.addPlayerEventListener(PLAYER_EVENTS.adTime, this.pauseIfPlayWithHDMIDisconnected);
    // Use the document API with capture mode to avoid stopping propagation from other handlers.
    document.addEventListener('keydown', this.onKeyDown, true);
    this.log('create');
  }

  private pauseIfPlayWithHDMIDisconnected = async () => {
    if (!this.player || await systemApi.isHDMIConnected()) return;
    const { prevPosition } = this;
    const position = Math.floor(this.player.getPosition());
    if (prevPosition > 0 && prevPosition !== position) {
      this.backgroundPlaybackTime++;
      if (this.interactionTimesDuringBackgroundPlayback > 2) {
        this.backgroundPlaybackTimeWithInteraction++;
      }
      // Log this to record count
      if (this.backgroundPlaybackTime === VALID_BACKGROUND_PLAYBACK_GAP_SECONDS) {
        trackBackgroundPlayback({
          source: this.source!,
          duration: VALID_BACKGROUND_PLAYBACK_GAP_SECONDS,
          condition: 'HDMI',
          interaction: this.interactionTimesDuringBackgroundPlayback,
          suspiciousDuration: this.backgroundPlaybackTimeWithInteraction,
        });
      }
    }
    this.prevPosition = position;
    // If there is scheduled pause, we can skip the current setting.
    if (this.shouldStopBackgroundPlayback && typeof this.pauseDelayTimer === 'undefined') {
      this.schedulePause();
    }
  };

  private onHDMIConnected = ({ hdmi_connection }: { hdmi_connection: boolean }) => {
    /* istanbul ignore next */
    if (!this.player) return;
    this.log('onHDMIConnected', hdmi_connection);
    trackOnHDMIConnected(this.source!, hdmi_connection);
    updateHdmiConnectionStatus(hdmi_connection ? 'connected' : 'disconnected');

    // we would better handle it on FireTV firstly
    if (isAppHidden() && __OTTPLATFORM__ === 'FIRETV_HYB') {
      return;
    }

    this.clearPauseDelayTimer();
    if (hdmi_connection) {
      // The isReady prop of the PreviewPlayer component should handle playing on foreground
      if ((this.player as Player).playerName !== PlayerName.Preview) {
        this.player.play();
        if (this.needAnalyticsEvent) {
          this.trackPauseToggleEvent(PauseState.RESUMED);
        }
      }
    } else {
      this.schedulePause();
    }
  };

  private schedulePause() {
    this.log('schedulePause');
    if (this.pauseDelay <= 0) {
      this.actionPause();
      return;
    }
    this.pauseDelayTimer = window.setTimeout(this.actionPause, this.pauseDelay);
  }

  private actionPause = () => {
    /* istanbul ignore next */
    if (!this.player || this.player.isPaused()) {
      this.clearPauseDelayTimer();
      return;
    }
    this.log('action pause');
    this.player.pause();
    if (this.needAnalyticsEvent) {
      this.trackPauseToggleEvent(PauseState.PAUSED);
    }
    this.clearPauseDelayTimer();
  };

  private clearPauseDelayTimer() {
    clearTimeout(this.pauseDelayTimer);
    delete this.pauseDelayTimer;
  }

  private trackPauseToggleEvent(pauseState: PauseState) {
    const pauseToggleEventObject = buildPauseToggleEventObject(this.contentId, pauseState);
    trackEvent(PAUSE_TOGGLE, pauseToggleEventObject);
  }

  private onKeyDown = async () => {
    if (await systemApi.isHDMIConnected() || this.backgroundPlaybackTime < VALID_BACKGROUND_PLAYBACK_GAP_SECONDS) return;
    this.interactionTimesDuringBackgroundPlayback++;
  };

  destroy = () => {
    this.log('destroy');
    // Log this to record real cost
    if (this.backgroundPlaybackTime > VALID_BACKGROUND_PLAYBACK_GAP_SECONDS) {
      trackBackgroundPlayback({
        source: this.source!,
        condition: 'HDMI',
        duration: this.backgroundPlaybackTime,
        interaction: this.interactionTimesDuringBackgroundPlayback,
        suspiciousDuration: this.backgroundPlaybackTimeWithInteraction,
      });
    }
    this.removePlayerEventListener(PLAYER_EVENTS.time, this.pauseIfPlayWithHDMIDisconnected);
    this.removePlayerEventListener(PLAYER_EVENTS.adTime, this.pauseIfPlayWithHDMIDisconnected);
    systemApi.removeListener('onHdmiConnected', this.onHDMIConnected);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.clearPauseDelayTimer();
    delete this.source;
    super.destroy();
  };
}

export function attachHDMIManager(player: InstanceType<typeof Player>, contentId: string) {
  if (__CLIENT__ && window.Cypress) {
    return FREEZED_EMPTY_FUNCTION;
  }
  if (__OTTPLATFORM__ === 'FIRETV_HYB' || __IS_ANDROIDTV_HYB_PLATFORM__) {
    const hdmiManager = new HDMIManager({
      ...getHDMIManagerConfig(player, contentId),
    });
    player.on(PLAYER_EVENTS.remove, hdmiManager.destroy);
    return () => {
      player.removeListener(PLAYER_EVENTS.remove, hdmiManager.destroy);
      hdmiManager.destroy();
    };
  }
  return FREEZED_EMPTY_FUNCTION;
}
