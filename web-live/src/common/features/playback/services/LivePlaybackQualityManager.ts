import type Hls from '@adrise/hls.js';
import type { PerformanceCollector } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';
import omit from 'lodash/omit';

import type { BufferEndEvent, LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { BasePlayerManager } from 'client/features/playback/services/BasePlayerManager';
import type { VideoResource } from 'common/types/video';
import { toFixed2 } from 'common/utils/format';

const removeHlsPrefix = (eventName: string) => eventName.replace('hls', '');

export enum LivePlayerState {
  CREATED = 0,
  MANIFEST_START_LOAD = 5,
  MANIFEST_LOADED = 10,
  LEVEL_START_LOAD = 15,
  LEVEL_LOADED = 20,
  FIRST_FRAG_START_LOAD = 25,
  FIRST_FRAG_LOADED = 30,
  FIRST_FRAG_BUFFERED = 35,
  FIRST_FRAME_VIEWED = 40,
  PLAYING = 45,
  BUFFERING = 60,
}

const irreversibleStateList: readonly LivePlayerState[] = [
  LivePlayerState.CREATED,
  LivePlayerState.MANIFEST_START_LOAD,
  LivePlayerState.MANIFEST_LOADED,
  LivePlayerState.LEVEL_START_LOAD,
  LivePlayerState.LEVEL_LOADED,
  LivePlayerState.FIRST_FRAG_START_LOAD,
  LivePlayerState.FIRST_FRAG_LOADED,
  LivePlayerState.FIRST_FRAG_BUFFERED,
  LivePlayerState.FIRST_FRAME_VIEWED,
];

const getStateKey = (value: LivePlayerState): keyof typeof LivePlayerState => {
  return Object.keys(LivePlayerState).find((key) => LivePlayerState[key] === value) as keyof typeof LivePlayerState;
};

interface LivePlaybackQualityCommon {
  created: number;
  /* startup metrics */
  firstFrameViewed: number;
  /* midstream metrics */
  totalBufferTime: number;
  totalBufferCount: number;
  bufferRatio: number;
  bufferRecords: number[][];
  totalViewTime: number;
  manifestRetryCount: number;
  firstLevelRetryCount: number;
  firstFragRetryCount: number;
}

interface LivePlaybackQualityOriginal extends LivePlaybackQualityCommon {
  state: LivePlayerState;
}

export interface LivePlaybackQualityResult extends LivePlaybackQualityCommon {
  stateNum: LivePlayerState;
  state: keyof typeof LivePlayerState;
  manifestStartLoad: number;
  manifestLoaded: number;
  manifestLoadTime: number;
  levelStartLoad: number;
  levelLoaded: number;
  levelLoadTime: number;
  fragStartLoad: number;
  fragLoaded: number;
  fragLoadTime: number;
  fragBuffered: number;
  fragBufferedTime: number;
}

const getDefaultLivePlaybackQuality = (): LivePlaybackQualityOriginal => ({
  state: LivePlayerState.CREATED,
  created: -1,
  firstFrameViewed: -1,
  totalBufferTime: 0,
  totalBufferCount: 0,
  bufferRatio: 0,
  bufferRecords: [],
  totalViewTime: 0,
  manifestRetryCount: 0,
  firstLevelRetryCount: 0,
  firstFragRetryCount: 0,
});

interface LivePlaybackQualityManagerParams {
  player: LivePlayerWrapper;
  baseTime?: number;
  externalHls?: typeof Hls;
  videoResource?: VideoResource;
}

export class LivePlaybackQualityManager extends BasePlayerManager<LivePlayerWrapper> {
  quality: LivePlaybackQualityOriginal = getDefaultLivePlaybackQuality();

  performanceCollector?: PerformanceCollector;

  destroyed: boolean = false;

  externalHls?: typeof Hls;

  videoResource?: VideoResource;

  constructor({ player, baseTime, externalHls, videoResource }: LivePlaybackQualityManagerParams) {
    super({ player });
    this.performanceCollector = player.performanceCollector;
    this.externalHls = externalHls;
    this.playerCreated(baseTime);
    this.attachListeners();
    this.videoResource = videoResource;
  }

  private attachListeners() {
    /* istanbul ignore if */
    if (!this.player || !this.performanceCollector || !this.externalHls) {
      return;
    }
    const { Events } = this.externalHls;
    this.player.once(PLAYER_EVENTS.firstFrame, this.handleFirstFrameViewed);
    this.player.on(PLAYER_EVENTS.bufferStart, this.handleBufferStart);
    this.player.on(PLAYER_EVENTS.bufferEnd, this.handleBufferEnd);
    this.performanceCollector.on(Events.MANIFEST_LOADING, this.handleManifestLoading);
    this.performanceCollector.on(Events.FRAG_LOADING, this.handleFragLoading);
    this.performanceCollector.on(Events.LEVEL_LOADING, this.handleLevelLoading);
    this.performanceCollector.once(Events.MANIFEST_LOADED, this.handleManifestLoaded);
    this.performanceCollector.once(Events.FRAG_LOADED, this.handleFragLoaded);
    this.performanceCollector.once(Events.FRAG_BUFFERED, this.handleFragBuffered);
    this.performanceCollector.once(Events.LEVEL_LOADED, this.handleLevelLoaded);
  }

  private detachListeners() {
    /* istanbul ignore if */
    if (!this.player || !this.performanceCollector || !this.externalHls) {
      return;
    }
    const { Events } = this.externalHls;
    this.player.off(PLAYER_EVENTS.firstFrame, this.handleFirstFrameViewed);
    this.player.off(PLAYER_EVENTS.bufferStart, this.handleBufferStart);
    this.player.off(PLAYER_EVENTS.bufferEnd, this.handleBufferEnd);
    this.player.off(PLAYER_EVENTS.time, this.handlePlaying);
    this.performanceCollector.off(Events.MANIFEST_LOADING, this.handleManifestLoading);
    this.performanceCollector.off(Events.FRAG_LOADING, this.handleFragLoading);
    this.performanceCollector.off(Events.LEVEL_LOADING, this.handleLevelLoading);
    this.performanceCollector.off(Events.MANIFEST_LOADED, this.handleManifestLoaded);
    this.performanceCollector.off(Events.FRAG_LOADED, this.handleFragLoaded);
    this.performanceCollector.off(Events.FRAG_BUFFERED, this.handleFragBuffered);
    this.performanceCollector.off(Events.LEVEL_LOADED, this.handleLevelLoaded);
  }

  private playerCreated(baseTime?: number) {
    if (baseTime) {
      this.quality.created = toFixed2(baseTime);
      return;
    }
    this.quality.created = toFixed2(this.performanceCollector ? this.performanceCollector.getBaseTime() : now());
  }

  private handleManifestLoaded = () => {
    this.updateState(LivePlayerState.MANIFEST_LOADED);
  };

  private handleFragLoaded = () => {
    this.updateState(LivePlayerState.FIRST_FRAG_LOADED);
  };

  private handleFirstFrameViewed = () => {
    this.quality.firstFrameViewed = this.timeFromCreated();
    /* istanbul ignore next */
    this.player?.on(PLAYER_EVENTS.time, this.handlePlaying);
    this.updateState(LivePlayerState.FIRST_FRAME_VIEWED);
  };

  private handleBufferStart = () => {
    if (this.quality.state < LivePlayerState.FIRST_FRAME_VIEWED) {
      return;
    }
    if (this.quality.state === LivePlayerState.BUFFERING) {
      return;
    }

    this.updateState(LivePlayerState.BUFFERING);
  };

  private handlePlaying = () => {
    this.updateState(LivePlayerState.PLAYING);
  };

  private handleBufferEnd = (event: BufferEndEvent) => {
    if (this.quality.state < LivePlayerState.FIRST_FRAME_VIEWED) {
      return;
    }
    const { bufferingDuration } = event;
    const start = Math.max(now() - bufferingDuration, this.quality.created);
    const end = now();

    this.quality.bufferRecords.push([Math.round(start), Math.round(end)]);
    this.quality.totalBufferTime += Math.round(bufferingDuration);
    this.quality.totalBufferCount++;

    this.updateState(LivePlayerState.PLAYING);
  };

  private timeFromCreated() {
    return Math.round(now() - this.quality.created);
  }

  private updateState(newState: LivePlayerState) {
    const irreversible = irreversibleStateList.includes(this.quality.state);
    const reverting = newState <= this.quality.state;
    /* istanbul ignore if */
    if (reverting && irreversible) {
      return;
    }

    this.quality.state = newState;
  }

  private getBufferRatio() {
    if (this.quality.state < LivePlayerState.FIRST_FRAME_VIEWED) {
      return 0;
    }

    // align the condition with the bufferRatio definition with the Youbora
    const effectiveViewTime = this.quality.totalViewTime - this.quality.firstFrameViewed;

    if (effectiveViewTime <= 0) {
      return 0;
    }

    return toFixed2(Math.min(this.quality.totalBufferTime / this.quality.totalViewTime, 1));
  }

  getQuality(): LivePlaybackQualityResult | undefined {
    if (!this.externalHls) {
      return;
    }
    if (this.destroyed) {
      this.log('you are trying to get quality result from a destroyed quality manager, the result might be outdated');
    }
    const { Events } = this.externalHls;
    this.quality.totalViewTime = this.timeFromCreated();
    this.quality.bufferRatio = this.getBufferRatio();

    /**
     * limit to last 20 records to save space, the capacity for message field is 2048 chars
     * @see https://github.com/adRise/www/pull/15585#discussion_r1402164529
     */
    this.quality.bufferRecords = this.quality.bufferRecords.slice(-20);

    const metricsFromCollector = {
      manifestStartLoad: this.getValueFromTimeMap(Events.MANIFEST_LOADING),
      manifestLoaded: this.getValueFromTimeMap(Events.MANIFEST_LOADED),
      levelStartLoad: this.getValueFromTimeMap(Events.LEVEL_LOADING),
      levelLoaded: this.getValueFromTimeMap(Events.LEVEL_LOADED),
      fragStartLoad: this.getValueFromTimeMap(Events.FRAG_LOADING),
      fragLoaded: this.getValueFromTimeMap(Events.FRAG_LOADED),
      fragBuffered: this.getValueFromTimeMap(Events.FRAG_BUFFERED),
    };
    return {
      ...omit(this.quality, 'state'),
      state: getStateKey(this.quality.state),
      stateNum: this.quality.state,
      ...metricsFromCollector,
      manifestLoadTime: this.timeBetween(metricsFromCollector.manifestStartLoad, metricsFromCollector.manifestLoaded),
      levelLoadTime: this.timeBetween(metricsFromCollector.levelStartLoad, metricsFromCollector.levelLoaded),
      fragLoadTime: this.timeBetween(metricsFromCollector.fragStartLoad, metricsFromCollector.fragLoaded),
      fragBufferedTime: this.timeBetween(metricsFromCollector.fragLoaded, metricsFromCollector.fragBuffered),
    };
  }

  destroy() {
    this.detachListeners();
    this.destroyed = true;

    super.destroy();
  }

  private handleManifestLoading = () => {
    if (this.quality.state === LivePlayerState.CREATED) {
      this.updateState(LivePlayerState.MANIFEST_START_LOAD);
    } else if (this.quality.state === LivePlayerState.MANIFEST_START_LOAD) {
      // retry
      this.quality.manifestRetryCount++;
    }
  };

  private handleFragLoading = () => {
    if (this.quality.state <= LivePlayerState.LEVEL_LOADED) {
      this.updateState(LivePlayerState.FIRST_FRAG_START_LOAD);
    } else if (this.quality.state === LivePlayerState.FIRST_FRAG_START_LOAD) {
      this.quality.firstFragRetryCount++;
    }
  };

  private handleFragBuffered = () => {
    if (this.quality.state >= LivePlayerState.FIRST_FRAME_VIEWED) {
      return;
    }
    this.updateState(LivePlayerState.FIRST_FRAG_BUFFERED);
  };

  private handleLevelLoading = () => {
    if (this.quality.state >= LivePlayerState.LEVEL_LOADED) {
      return;
    }
    if (this.quality.state <= LivePlayerState.MANIFEST_LOADED) {
      this.updateState(LivePlayerState.LEVEL_START_LOAD);
    } else {
      this.quality.firstLevelRetryCount++;
    }
  };

  private handleLevelLoaded = () => {
    this.updateState(LivePlayerState.LEVEL_LOADED);
  };

  private getValueFromTimeMap = (key: string) => {
    if (!Object.hasOwnProperty.call(this.timeMap, removeHlsPrefix(key))) {
      return -1;
    }

    const original = this.timeMap[removeHlsPrefix(key)];

    // original value is based on the base time of the performance collector
    /* istanbul ignore next */
    const baseTimeDiff = toFixed2(this.performanceCollector?.getBaseTime() || this.quality.created) - this.quality.created;

    return toFixed2(original + baseTimeDiff);
  };

  private timeBetween(metricA: number, metricB: number) {
    if (metricA < 0 || metricB < 0 || metricB < metricA) {
      return -1;
    }

    return toFixed2(metricB - metricA);
  }

  get timeMap() {
    return this.performanceCollector?.timeMap || {};
  }
}
