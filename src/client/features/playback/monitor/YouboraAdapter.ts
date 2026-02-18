import type { ErrorEventData, Player } from '@adrise/player';
import { PLAYER_ERROR_DETAILS, PLAYER_EVENTS, PlayerName, VERSION as PLAYER_VERSION } from '@adrise/player';
import youbora from 'youboralib';

import { isDomExceptionAbortError } from 'client/features/playback/error/predictor';
import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { convertErrorEventDataIntoErrorClientLog } from 'client/features/playback/track/client-log';
import type { ErrorClientLogInfo } from 'client/features/playback/track/client-log/utils/types';
import { getLivePlayerWrapperFromYoubora, isLivePlayer } from 'client/features/playback/utils/getLivePlayerType';
import { VIDEO_BUFFERING_THRESHOLD } from 'common/constants/constants';

const platform = (__OTTPLATFORM__ || __WEBPLATFORM__).toLowerCase();

const YouboraPlayerNameMap = {
  [PlayerName.Linear]: 'tubi-web',
  [PlayerName.VOD]: 'tubi-web',
  [PlayerName.Preview]: PlayerName.Preview,
  [PlayerName.Trailer]: PlayerName.Trailer,
};

const CDN_LIST = {
  'cloudfront': 'AMAZON',
  'fastly': 'FASTLY',
  'google': 'GOOGLE',
  'akamai': 'AKAMAI',
  'lnc-': 'AMAZON', // Live
  'livetv-fa': 'FASTLY', // Live
};

interface YouboraEventParam {
  triggeredEvents?: string[];
}

export type YouboraAdapterBaseClass = {
  fireBufferBegin: () => void;
  fireBufferEnd: () => void;
  fireError: (a: string, b: string, c: ErrorClientLogInfo, d: string) => void;
  fireResume: () => void;
  fireStart: () => void;
  firePause: () => void;
  fireJoin: () => void;
  fireStop: () => void;
  cancelBuffer: () => void;
  _getDeltaBufferTime: () => number;
  _isAdsAdapter: boolean;
  player: Player | LivePlayerWrapper;
  flags: {
    isJoined: boolean;
    isPaused: boolean;
    isStarted: boolean;
    isBuffering: boolean;
  };
  monitor?: {
    skipNextTick: () => void;
    stop: () => void;
  };
  plugin: {
    getAdapter: () => YouboraAdapterBaseClass | undefined,
    options: {
      ['parse.cdnNode']?: boolean;
      ['ignoreShortBuffering']?: boolean;
    },
    setOptions: (options: {['content.cdn']: string}) => void
  };
  monitorPlayhead: (a: boolean, b: boolean, i?: number) => void;
  registerListeners: () => void;
  unregisterListeners: () => void;
  getResource: () => string;
  getVersion: () => string;
  getDuration: () => number;
  getPlayhead: () => number;
  getTitle: () => string;
  getBitrate: () => number;
  getPlayerName: () => string;
  getPlayerVersion: () => string;
};

type YouboraAdapterContentClass = YouboraAdapterBaseClass & {
  fireSeekBegin: () => void;
  fireSeekEnd: () => void;
  fireEvent: (eventName: string, dimensions?: Record<string, string | number>, values?: Record<string, string | number>, topLevelDimensions?: Record<string, string | number | Record<string, string | number>>) => void;
  getThroughput: () => number;
  getRendition: () => string;
  getIsLive: () => boolean;
};

export type CustomYouboraAdapterSharedClass = {
  listenerMap?: {
    [PLAYER_EVENTS.play]?: (...args: any[]) => void,
    [PLAYER_EVENTS.pause]?: (...args: any[]) => void,
    [PLAYER_EVENTS.time]?: (...args: any[]) => void,
    [PLAYER_EVENTS.seek]?: (...args: any[]) => void,
    [PLAYER_EVENTS.seeked]?: (...args: any[]) => void,
    [PLAYER_EVENTS.complete]?: (...args: any[]) => void,
    [PLAYER_EVENTS.error]?: (...args: any[]) => void,
    [PLAYER_EVENTS.adStart]?: (...args: any[]) => void
    [PLAYER_EVENTS.adPlay]?: (...args: any[]) => void
    [PLAYER_EVENTS.adPause]?: (...args: any[]) => void
    [PLAYER_EVENTS.adTime]?: (...args: any[]) => void
    [PLAYER_EVENTS.adComplete]?: (...args: any[]) => void
    [PLAYER_EVENTS.adPodComplete]?: (...args: any[]) => void
    [PLAYER_EVENTS.adError]?: (...args: any[]) => void
    [PLAYER_EVENTS.adClick]?: (...args: any[]) => void
    [PLAYER_EVENTS.adBufferStart]?: (...args: any[]) => void
    [PLAYER_EVENTS.adBufferEnd]?: (...args: any[]) => void
  }
};

type CustomYouboraAdapterContentClass = YouboraAdapterContentClass & CustomYouboraAdapterSharedClass & {
  bufferEndListener: () => void;
  bufferStartListener: () => void;
  completeListener: () => void;
  errorListener: (error: ErrorEventData) => void;
  bindedOfflineListener?: () => void;
  offlineListener: () => void;
  seekedListener: () => void;
  seekListener: () => void;
  timeListener: () => void;
  pauseListener: () => void;
  playListener: () => void;
  hasSetCdn?: boolean;
};

// Disable youbora log on Comcast's production, as we suspected it cause a false error report on Comcast side.
/* istanbul ignore next */
if (__IS_COMCAST_PLATFORM_FAMILY__ && __PRODUCTION__) {
  youbora.Log.logLevel = 6;
}

/**
 * Youbora adapter for tubi player.
 * In this adapter, we use our defined player events rather than html5 video element events
 * in order to apply it on other player wrappers like Samsuang/etc.
 * Most of code borrow from:
 * - hlsjs-adapter: https://bitbucket.org/npaw/hlsjs-adapter-js/src/master/src/adapter.js
 * - html5-adapter: https://bitbucket.org/npaw/html5-adapter-js/src/master/src/adapter.js
 */
const YouboraAdapter: new (player: Player | LivePlayerWrapper) => CustomYouboraAdapterContentClass = youbora.Adapter.extend({
  // assume these types come from base class
  ...{} as unknown as YouboraAdapterContentClass,
  fireBufferEnd(params?: YouboraEventParam | null, triggeredEvent?: string) {
    if (this.flags.isJoined && this.flags.isBuffering) {
      if (this.plugin.options.ignoreShortBuffering && this._getDeltaBufferTime() <= VIDEO_BUFFERING_THRESHOLD) {
        this.cancelBuffer();
      } else {
        youbora.Adapter.prototype.fireBufferEnd.call(this, params, triggeredEvent);
      }
    }
  },
  getVersion(): string {
    return `${youbora.VERSION}-youbora-${platform}${isLivePlayer(this.player) ? '-live' : ''}-adapter`;
  },
  getPlayhead(): number {
    // this is an edge case We remove the player instance but the time event handle again
    if (!this.player) {
      return -1;
    }
    return this.player.getPosition();
  },
  getDuration(): number {
    return this.player.getDuration();
  },
  getResource(): string {
    return this.player.getResource();
  },
  getTitle(): string {
    return getLivePlayerWrapperFromYoubora(this)?.getTitle() ?? '';
  },
  getIsLive(): boolean {
    return isLivePlayer(this.player);
  },
  getPlayerName(): string {
    // The old player has no player name
    return [
      YouboraPlayerNameMap[this.player.playerName] || 'tubi-web',
      platform,
    ].filter(Boolean).join('-');
  },
  getPlayerVersion(): string {
    const experimentName = this.plugin.options['tubi.experimentName'];
    const experimentTreatmentName = this.plugin.options['tubi.experimentTreatmentName'];
    // Suffix the player version with optional experiment options
    return [PLAYER_VERSION, experimentName, experimentTreatmentName].filter(Boolean).join('-');
  },
  getBitrate(): number {
    return this.player.getBitrate?.() ?? -1;
  },
  getThroughput(): number {
    return this.player.getBandwidthEstimate?.() ?? -1;
  },
  getRendition(): string {
    return this.player.getRendition?.() ?? '';
  },
  registerListeners() {
    // Enable playhead monitor
    let bufferEnable = true;

    if (__SHOULD_DISABLE_YOUBORA_BUFFER_MONITOR__ && !isLivePlayer(this.player)) {
      bufferEnable = false;
    }

    this.monitorPlayhead(bufferEnable, false);

    const listenerMap = this.listenerMap = {
      [PLAYER_EVENTS.play]: this.playListener.bind(this),
      [PLAYER_EVENTS.pause]: this.pauseListener.bind(this),
      [PLAYER_EVENTS.time]: this.timeListener.bind(this),
      [PLAYER_EVENTS.seek]: this.seekListener.bind(this),
      [PLAYER_EVENTS.seeked]: this.seekedListener.bind(this),
      [PLAYER_EVENTS.complete]: this.completeListener.bind(this),
      [PLAYER_EVENTS.error]: this.errorListener.bind(this),
    };
    if (!bufferEnable) {
      listenerMap[PLAYER_EVENTS.bufferStart] = this.bufferStartListener.bind(this);
      listenerMap[PLAYER_EVENTS.bufferEnd] = this.bufferEndListener.bind(this);
    }
    for (const key of Object.keys(listenerMap)) {
      this.player.on(key as PLAYER_EVENTS, listenerMap[key]);
    }

    // NOTE we handle offine in OTTPlayer with no error event, so we manually process it here
    this.bindedOfflineListener = this.offlineListener.bind(this);
    window.addEventListener('offline', this.bindedOfflineListener);
  },
  bufferStartListener() {
    if (!this.getIsLive() && VODPlaybackSession.getVODPlaybackInfo().isRetrying) {
      return;
    }
    this.fireBufferBegin();
  },
  bufferEndListener() {
    if (!this.getIsLive() && VODPlaybackSession.getVODPlaybackInfo().isRetrying) {
      return;
    }
    this.fireBufferEnd();
  },
  playListener() {
    // Try to get the real cdn resource of current playback
    // The getResourcesRealhost() must be called after playback start
    if (!this.hasSetCdn) {
      this.hasSetCdn = true;
      const cdn = this.player.getCDN?.();
      if (cdn) {
        let realhost = 'UNKNOWN';
        for (const key in CDN_LIST) {
          if (cdn.indexOf(key) >= 0) {
            realhost = CDN_LIST[key as keyof typeof CDN_LIST];
            break;
          }
        }
        this.plugin.setOptions({
          'content.cdn': realhost,
        });
      }
    }
    // call `fireResume` only if it's from a paused state
    if (this.flags.isPaused) {
      this.fireResume();
    // Fatal error will clear stop Youbora
    // We need to restart it
    } else if (!this.flags.isStarted) {
      this.fireStart();
    }
  },
  timeListener() {
    if (this.getPlayhead() > 1) {
      this.fireJoin();
    }
  },
  pauseListener() {
    this.firePause();
  },
  seekListener() {
    if (!this.getIsLive() && VODPlaybackSession.getVODPlaybackInfo().isRetrying) {
      return;
    }
    this.fireSeekBegin();
  },
  seekedListener() {
    if (!this.getIsLive() && VODPlaybackSession.getVODPlaybackInfo().isRetrying) {
      return;
    }
    this.fireSeekEnd();
  },
  completeListener() {
    this.fireStop();
  },
  errorListener(error: ErrorEventData) {
    const info = convertErrorEventDataIntoErrorClientLog(error);
    /* istanbul ignore next */
    if (!info.fatal && info.error_message === PLAYER_ERROR_DETAILS.BUFFER_STALLED_ERROR) return;

    // DOM abort error does not impact user experience, this error info is not important to us, so we do not report to youbora.
    if (!isLivePlayer(this.player) && isDomExceptionAbortError(error)) return;

    if (isLivePlayer(this.player)) {
      if (this.player.isRetrying) {
        return;
      }
      if (this.player.isFrozen && !info.fatal) {
        return;
      }
    }

    this.fireError(info.error_code, info.error_message, info, info.fatal ? 'fatal' : 'error');
  },
  offlineListener() {
    this.errorListener({ message: 'Network offline' } as ErrorEventData);
  },
  unregisterListeners() {
    // Disable playhead monitoring
    if (this.monitor) {
      this.monitor.stop();
    }

    if (this.listenerMap) {
      // unregister listeners
      for (const key of Object.keys(this.listenerMap)) {
        this.player.removeListener(key as PLAYER_EVENTS, this.listenerMap[key]);
      }
      this.listenerMap = undefined;
    }

    if (this.bindedOfflineListener) {
      window.removeEventListener('offline', this.bindedOfflineListener);
      this.bindedOfflineListener = undefined;
    }
  },
  getFramesPerSecond(): number {
    return getLivePlayerWrapperFromYoubora(this)?.getFramesPerSecond() || 0;
  },
  getDroppedFrames(): number {
    return this.player.getTotalDroppedFrames() || 0;
  },
} as CustomYouboraAdapterContentClass);

export default YouboraAdapter;
