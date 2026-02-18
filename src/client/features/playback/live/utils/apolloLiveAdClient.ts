import type Hls from '@adrise/hls.js';
import type { Events, FragParsingMetadataData, MetadataSample } from '@adrise/hls.js';
import { getUrlForUnusedActions, PLAYER_EVENTS } from '@adrise/player';
import { VAST_AD_NOT_USED } from '@adrise/player/lib/constants/error';
import { PlayerEventEmitter } from '@adrise/player/lib/utils/PlayerEventEmitter';
import { debug, sendBeaconRequest } from '@adrise/player/lib/utils/tools';

import type { LiveAdPlayerWithApolloListeners } from '../types';
import { EmsgParser } from './EmsgParser';
export interface LiveAdClientOptions {
  player?: Hls;
  eventName: Events;
  videoElement: HTMLVideoElement;
  debug?: boolean;
}

type PixelTrackingPercentageList = {
  [key in QuartilePercent]?: string[];
} & { notUsed?: string[] };

interface AdPixelMap {
  trackings: PixelTrackingPercentageList;
  impressions: string[];
}

interface ProgressTrackingPointMap {
  adId: string;
  progress: QuartilePercent;
}

type QuartilePercent = 0 | 25 | 50 | 75 | 100;

const QuartileMap: Record<string, keyof PixelTrackingPercentageList> = {
  start: 0,
  firstQuartile: 25,
  midpoint: 50,
  thirdQuartile: 75,
  complete: 100,
  notUsed: 'notUsed',
};

export default class ApolloLiveAdClient extends PlayerEventEmitter<LiveAdPlayerWithApolloListeners> {
  private eventName: Events;

  private detachEvents?: VoidFunction;

  private videoElement: HTMLVideoElement;

  private player?: Hls;

  private log: (...args: any[]) => void = () => {};

  private adPixelMap: Record<string, AdPixelMap> = {};

  private progressTrackingPoints: Record<number, ProgressTrackingPointMap[]> = {};

  private nearestProgressTrackingPoint: number = Infinity;

  private adDurationOffset?: number;

  private adIndex: number = 0;

  isPlayingAd: boolean = false;

  adPodDuration: number = 0;

  adPlayedDuration: number = 0;

  adId?: string;

  constructor(options: LiveAdClientOptions) {
    super();

    this.player = options.player;
    this.videoElement = options.videoElement;
    this.eventName = options.eventName;
    if (options.debug) {
      this.log = debug('ApolloLiveAdClient');
    }
    this.setup();
  }

  private setup() {
    this.detachEvents = this.attachEvents();
  }

  private attachEvents() {
    this.player?.on(this.eventName, this.handleFragMetadata);
    this.videoElement.addEventListener('timeupdate', this.onTimeupdate);
    return () => {
      this.player?.off(this.eventName, this.handleFragMetadata);
      this.videoElement.removeEventListener('timeupdate', this.onTimeupdate);
    };
  }

  private parseAdInfoFromTagList = (tagsArray: string[][]): string | undefined => {
    let adId: string | undefined;
    const impressions: string[] = [];
    const pixels: PixelTrackingPercentageList = {};

    for (const tags of tagsArray) {
      if (tags.length !== 2) continue;

      switch (tags[0]) {
        case 'EXT-X-APOLLO-AD-INF':
          // adTag is ['EXT-X-APOLLO-AD-INF', 'AD-ID="xxxx"']
          adId = tags[1].match(/^AD-ID="([^"]+)/)?.[1];
          break;
        case 'EXT-X-APOLLO-AD-IMPRESSION':
          // impression is ['EXT-X-APOLLO-AD-IMPRESSION', 'URI="https://sssssss"']
          const impressionUri = tags[1].match(/^URI="([^"]+)/)?.[1];
          if (impressionUri) {
            impressions.push(impressionUri);
          }
          break;
        case 'EXT-X-APOLLO-AD-PIXEL':
          // pixel is ['EXT-X-APOLLO-AD-PIXEL', 'EVENT=notUsed,URI="https://ssssss"']
          const event = tags[1].match(/^EVENT=(\w+)/)?.[1];
          const pixelUri = tags[1].match(/URI="([^"]+)/)?.[1];
          if (event && pixelUri && QuartileMap[event] !== undefined) {
            const pixelKey = QuartileMap[event];
            if (!pixels[pixelKey]) {
              pixels[pixelKey] = [];
            }
            pixels[pixelKey]!.push(pixelUri);
          }
          break;
        default:
          break;
      }
    }
    if (!adId) {
      return;
    }

    // create pixel map for adId if not exists
    if (!this.adPixelMap[adId]) {
      this.adPixelMap[adId] = {
        impressions: [],
        trackings: {},
      };
    }

    const pixelMap = this.adPixelMap[adId];
    pixelMap.impressions = Array.from(new Set(pixelMap.impressions.concat(impressions)));

    for (const key in pixels) {
      /* istanbul ignore else */
      if (pixels.hasOwnProperty(key)) {
        if (!pixelMap.trackings[key as keyof typeof pixelMap.trackings]) {
          pixelMap.trackings[key as keyof typeof pixelMap.trackings] = [];
        }
        // We should prevent pixel url be saved twice
        pixelMap.trackings[key as keyof typeof pixelMap.trackings] = Array.from(new Set(pixelMap.trackings[key as keyof typeof pixelMap.trackings]!.concat(pixels[key as keyof typeof pixels]!)));
      }
    }

    return adId;
  };

  private parseTPOS = (data: Uint8Array): string => {
    const frames = EmsgParser.parseID3Frames(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
    for (const frame of frames) {
      if (frame.type === 'TPOS') {
        return frame.data as string; // We know the data is a string
      }
    }
    return '';
  };

  private parseSamples = (samples: MetadataSample[], adId: string): void => {
    for (const current of samples) {
      const tpos = this.parseTPOS(current.data);

      if (tpos && current.pts) {
        const position = current.pts;
        const progress = parseInt(tpos, 10) as QuartilePercent;

        this.queueTrackingPoints(position, adId, progress);
      }
    }
  };

  private handleFragMetadata = (event: Events, data: FragParsingMetadataData) => {
    // This event fires when id3 tag being detected
    const adId = this.parseAdInfoFromTagList(data.frag.tagList);
    if (!adId) {
      this.log('Skipping fragments since no ad id found');
      return;
    }

    if (!data.samples || data.samples.length <= 0) {
      this.log('data.sample is not exists');
      return;
    }

    this.parseSamples(data.samples, adId);

    this.nearestProgressTrackingPoint = this.findNearestProgressTrackingPoint();
  };

  private queueTrackingPoints = (position: number, adId: string, progress: QuartilePercent) => {
    // There might be two ads using the same ad point (such as ad.A progress = 100 and ad.B progress = 0)
    /* istanbul ignore else */
    if (!this.progressTrackingPoints[position]) {
      this.progressTrackingPoints[position] = [];
    }

    for (const trackingList of this.progressTrackingPoints[position]) {
      const { adId: curAdId, progress: curProgress } = trackingList;
      if (curAdId === adId && curProgress === progress) {
        return;
      }
    }
    this.progressTrackingPoints[position].push({
      adId,
      progress,
    });

    // Descending sort the array to ensure progress 100 could be sent before progress 0
    this.progressTrackingPoints[position].sort(/* istanbul ignore next */(a, b) => b.progress - a.progress);
    this.log(`Pixel progress ${progress} of adId ${adId} for position ${position} recorded.`);
  };

  private findNearestProgressTrackingPoint = () => {
    const position = Math.min(...Object.keys(this.progressTrackingPoints).map(timePoint => parseFloat(timePoint)));
    this.log(`Nearest ad point is ${position}`);
    return position;
  };

  private firePixel = (adPixels: AdPixelMap, pos: QuartilePercent) => {
    this.log(adPixels);
    const pixels = adPixels.trackings[pos];
    if (pixels) {
      this.trackPixels(pixels);
      this.emit(PLAYER_EVENTS.adQuartile, (pos * 4) / 100);
      this.log(`[Pixel sent]: progress ${pos}`);
    }

    if (pos === 0 && adPixels.impressions) {
      this.trackPixels(adPixels.impressions);
      this.log('[Pixel sent]: impressions');
    }
  };

  private trackPixels = (trackingList: string[], errorType: 'impression' | 'notUsed' = 'impression') => {
    sendBeaconRequest(trackingList, (err) => {
      this.emit(PLAYER_EVENTS.adBeaconFail, err, {
        id: this.adId,
        type: errorType,
      });
    });
  };

  private onTimeupdate = () => {
    const { currentTime } = this.videoElement;
    this.trackAd(currentTime);
    if (this.isPlayingAd) {
      /* istanbul ignore else */
      if (typeof this.adDurationOffset === 'undefined') {
        this.adDurationOffset = currentTime;
      }
      this.adPlayedDuration = currentTime - this.adDurationOffset;
      /* istanbul ignore if */
      if (!this.adId) return;
      this.emit(PLAYER_EVENTS.adTime, {
        adId: this.adId,
        position: this.adPlayedDuration,
        adIndex: this.adIndex,
      });
    }
  };

  getCurrentAd = () => {
    return {
      adId: this.adId || '',
      adIndex: this.adIndex,
      position: this.videoElement.currentTime,
    };
  };

  private trackAd = (currentTime: number) => {
    if (currentTime < this.nearestProgressTrackingPoint) {
      return;
    }

    // Handle all pixel tracks in this ad point
    const progressTrackingPoints = this.progressTrackingPoints[this.nearestProgressTrackingPoint];
    if (!progressTrackingPoints) return;

    for (const progressTrackingPoint of progressTrackingPoints) {
      const { adId, progress: pos } = progressTrackingPoint;
      if (pos === 0) {
        this.isPlayingAd = true;
        this.adId = adId;
        this.adIndex++;
        this.log(`[ad Start] adId: ${adId} position: ${currentTime} adSequence: ${this.adIndex}`);
        this.emit(PLAYER_EVENTS.adStart, {
          adId,
          position: currentTime,
          adIndex: this.adIndex,
        });
      } else if (pos === 100) {
        this.adPodDuration += this.adPlayedDuration;
        this.log(`[ad complete] adId: ${adId} position: ${currentTime} adSequence: ${this.adIndex} duration: ${this.adPlayedDuration}`);
        this.emit(PLAYER_EVENTS.adComplete, {
          adId,
          position: currentTime,
          adIndex: this.adIndex,
          adPlayedDuration: this.adPlayedDuration,
        });
        this.reset();
      }
      const pixelMap = this.adPixelMap[adId];
      if (!pixelMap) continue;

      this.firePixel(pixelMap, pos);
      // Check if the last track has been sent
      if (pos === 100) {
        this.log(`ad ${adId} finished, pixel map deleted`);
        delete this.adPixelMap[adId];
      }
    }

    // Delete the ad point so that we can get new nearest ad point
    delete this.progressTrackingPoints[this.nearestProgressTrackingPoint];
    this.nearestProgressTrackingPoint = this.findNearestProgressTrackingPoint();

    // Check if an ad pod is finished.
    // 1. isPlayingAd is true, which ensures there was an ad playing
    // 2. adId is undefined, which means an ad just finished
    // 3. progressTrackingPoints is empty, which means no ads after this point
    if (this.isPlayingAd && !this.adId && Object.keys(this.progressTrackingPoints).length === 0) {
      this.isPlayingAd = false;
      this.log(`[adPod Complete] adsCount: ${this.adIndex} podDuration: ${this.adPodDuration}`);
      this.emit(PLAYER_EVENTS.adPodComplete, {
        adsCount: this.adIndex,
        position: currentTime,
        podDuration: this.adPodDuration,
      });
      this.adPodDuration = 0;
      this.adIndex = 0;
    }
  };

  private reset = () => {
    this.adDurationOffset = undefined;
    this.adPlayedDuration = 0;
    this.adId = undefined;
  };

  remove() {
    if (Object.keys(this.adPixelMap).length > 0) {
      for (const adId in this.adPixelMap) {
        /* istanbul ignore else */
        if (this.adPixelMap.hasOwnProperty(adId)) {
          const action = this.adId === adId ? VAST_AD_NOT_USED.EXIT_MID_POD : VAST_AD_NOT_USED.EXIT_PRE_POD;
          this.trackPixels((this.adPixelMap[adId]?.trackings?.notUsed || []).map(url => {
            return getUrlForUnusedActions(url, action);
          }), 'notUsed');
        }
      }
      this.adPixelMap = {};
    }
    this.detachEvents?.();
  }
}
