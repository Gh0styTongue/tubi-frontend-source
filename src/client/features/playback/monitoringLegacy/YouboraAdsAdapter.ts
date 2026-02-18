import { PLAYER_EVENTS } from '@adrise/player';
import type { AdError, Player, Ad } from '@adrise/player';
import youbora from 'youboralib';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { convertAdErrorIntoErrorClientLog } from 'client/features/playback/track/client-log/';

import YouboraAdapter from './YouboraAdapter';
import type { YouboraAdapterBaseClass, CustomYouboraAdapterSharedClass } from './YouboraAdapter';
import type { LiveAdEventData } from '../live/utils/liveAdClient';

export enum AdPosition {
  pre = 'pre',
  mid = 'mid',
}

const platform = (__OTTPLATFORM__ || __WEBPLATFORM__).toLowerCase();

type YouboraAdapterAdClass = YouboraAdapterBaseClass & {
  fireClick: (a: string) => void;
  fireQuartile: (a: number) => void;
  getIsVisible: () => boolean;
  getPosition: () => AdPosition;
};

export type CustomYouboraAdapterAdClass = YouboraAdapterAdClass & CustomYouboraAdapterSharedClass & {
  duration?: number;
  playhead?: number;
  title?: string;
  resource?: string;
  resetValues: () => void;
  adStartListener: (event: { ad: Ad; } | LiveAdEventData) => void;
  adPlayListener: () => void;
  adPauseListener: () => void;
  adQuartileListener: (quartile: number) => void;
  adCompleteListener: () => void;
  adTimeListener: (event: { position: number, duration: number }) => void;
  adBufferStartListener: () => void;
  adBufferEndListener: () => void;
  adPodCompleteListener: () => void;
  adClickListener: (a: string) => void;
  adErrorListener: (error: AdError) => void;
};

/**
 * Youbora ads adapter for tubi player.
 * Most of code borrow from:
 * - jwplayer-ads-adapter: https://bitbucket.org/npaw/jwplayer-adapter-js/src/master/src/ads/native.js
 */
const YouboraAdsAdapter: new (player: LivePlayerWrapper | Player) => CustomYouboraAdapterAdClass = youbora.Adapter.extend({
  ...{} as YouboraAdapterAdClass,
  fireBufferEnd: YouboraAdapter.prototype.fireBufferEnd,
  getVersion(): string {
    return `${youbora.VERSION}-youbora-${platform}-ads-adapter`;
  },
  getPlayhead(): number | undefined {
    return this.playhead;
  },
  getDuration(): number | undefined {
    return this.duration;
  },
  getResource(): string | undefined {
    return this.resource;
  },
  getTitle(): string | undefined {
    return this.title;
  },
  getIsVisible(): boolean {
    const videoElement = this.player.getCurrentVideoElement();
    if (!videoElement) {
      return false;
    }
    return youbora.Util.calculateAdViewability(videoElement);
  },
  /**
   * Get the ad position, i.e. preroll, midroll
   */
  getPosition(): AdPosition {
    const adapter = this.plugin && this.plugin.getAdapter();
    if (adapter && !adapter.flags.isJoined) {
      return AdPosition.pre;
    }
    return AdPosition.mid;
  },
  registerListeners() {
    let bufferEnable = true;

    // Enable playhead monitor (buffer = true, seek = false)
    if (__SHOULD_DISABLE_YOUBORA_BUFFER_MONITOR__) {
      bufferEnable = false;
    }

    this.monitorPlayhead(bufferEnable, false, 1200);

    this.playerListenerMap = [
      [PLAYER_EVENTS.adStart, this.adStartListener.bind(this)],
      [PLAYER_EVENTS.adPlay, this.adPlayListener.bind(this)],
      [PLAYER_EVENTS.adPause, this.adPauseListener.bind(this)],
      [PLAYER_EVENTS.adQuartile, this.adQuartileListener.bind(this)],
      [PLAYER_EVENTS.adTime, this.adTimeListener.bind(this)],
      [PLAYER_EVENTS.adComplete, this.adCompleteListener.bind(this)],
      [PLAYER_EVENTS.adPodComplete, this.adPodCompleteListener.bind(this)],
      [PLAYER_EVENTS.adError, this.adErrorListener.bind(this)],
      [PLAYER_EVENTS.adClick, this.adClickListener.bind(this)],
    ];
    if (!bufferEnable) {
      this.playerListenerMap.push(
        [PLAYER_EVENTS.adBufferStart, this.adBufferStartListener.bind(this)],
        [PLAYER_EVENTS.adBufferEnd, this.adBufferEndListener.bind(this)]
      );
    }
    for (const listener of this.playerListenerMap) {
      this.player.on(listener[0], listener[1]);
    }
  },
  adStartListener(event: { ad: Ad }|LiveAdEventData) {
    this.resource = (event as { ad: Ad }).ad?.video || (event as LiveAdEventData).adId || 'unknown';
    this.title = (event as { ad: Ad }).ad?.id || (event as LiveAdEventData).adId || 'unknown';
    this.duration = (event as { ad: Ad }).ad?.duration || 0;

    const adapter = this.plugin && this.plugin.getAdapter();
    if (adapter && !adapter.flags.isStarted) {
      // Make sure `start` event sent before `adStart` event
      adapter.fireStart();
    }
    if (adapter && !adapter.flags.isPaused) {
      // Explicitly pause the content adapter so some internal monitors of it could pause
      adapter.firePause();
    }

    this.fireStart();
  },
  /**
   * `adPlay` handler, note that we fire `adPlay` at the beginning as well
   */
  adPlayListener() {
    if (this.flags.isPaused) {
      // Call `fireResume` only if it's from a paused state
      this.fireResume();
    }
    this.fireBufferEnd();
  },
  adPauseListener() {
    this.firePause();
  },
  adBufferStartListener() {
    this.fireBufferBegin();
  },
  adBufferEndListener() {
    this.fireBufferEnd();
  },
  adQuartileListener(quartile: number) {
    this.fireQuartile(quartile);
  },
  adTimeListener(event: { position: number, duration: number }) {
    this.playhead = event.position;
    this.duration = event.duration;

    if (this.getPlayhead() > 1) {
      this.fireJoin();
      // Avoid unnecessary /adBufferUnderrun request after /adJoin
      if (this.monitor) this.monitor.skipNextTick();
    }
  },
  adCompleteListener() {
    this.fireStop();
    this.resetValues();
  },
  adPodCompleteListener() {
    const adapter = this.plugin && this.plugin.getAdapter();
    if (adapter && adapter.flags.isPaused) {
      // Explicitly resume the content adapter so some internal monitors of it could resume
      adapter.fireResume();
    }
  },
  adErrorListener(error: AdError) {
    this.fireStop();
    const info = convertAdErrorIntoErrorClientLog(error);
    this.fireError(info.error_code, info.error_message, info, info.fatal ? 'fatal' : 'error');
  },
  adClickListener(url: string) {
    this.fireClick(url);
  },
  unregisterListeners() {
    if (!this.playerListenerMap) {
      return;
    }
    for (const listener of this.playerListenerMap) {
      this.player.removeListener(listener[0], listener[1]);
    }
    this.playerListenerMap = undefined;
  },
  resetValues() {
    this.playhead = undefined;
    this.duration = undefined;
    this.resource = undefined;
    this.title = undefined;
  },
} as CustomYouboraAdapterAdClass);

export default YouboraAdsAdapter;

