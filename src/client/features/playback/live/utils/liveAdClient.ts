import type { AdClientState } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { PlayerEventEmitter } from '@adrise/player/lib/utils/PlayerEventEmitter';
import { ExitType } from '@tubitv/analytics/lib/adEvent';

import type { LivePlayerListeners } from '../types';

export interface LiveAdClientOptions {
  videoElement: HTMLVideoElement;
  debug?: boolean;
}

/**
 * Yospace ensures all ad .ts segments carry the following tags
 * YMID - The Yospace Media ID (each transcoded ad asset has a unique ID) - eg "525123456"
 * YTYP - The "type" of ID3 packet - Values will be a single-character string "S", "M" or "E" (for "Start", "Middle" and "End" respectively)
 * YSEQ - The sequence number of the segment - This will be a string in the form "X:Y" where X is the segment number, and Y the total number of segments (eg "1:3" indicates segment 1 of 3)
 * YDUR - The approximate offset of the tag within its segment (in seconds) - eg "04.5" indicates a tag 4.5 seconds from the start of the segment
 * YCSP - This frame is reserved for "Customer Specific Parameters", but when not in use, will contain a copy of the Yospace Media ID. It's not required by our SDK.
 */
interface YospaceTextTrackCue extends TextTrackCue {
  value: { key: string, data: string };
  YMID: string;
  YDUR:string;
  YSEQ: string;
  YTYP: string;
}

export interface LiveAdEventData {
  adId?: string;
  adIndex: number;
  adPlayedDuration: number;
  totalAdPlayedDuration: number;
  exitType: ExitType;
}

export default class LiveAdClient extends PlayerEventEmitter<LivePlayerListeners> {
  private state: AdClientState = 'idle';

  private detachEvents?: VoidFunction;

  private detachCueChangeEvent?: VoidFunction;

  private setState(state: AdClientState) {
    this.state = state;
  }

  private videoElement: HTMLVideoElement;

  private adDurationOffset?: number;

  private adIndex: number = 0;

  isPlayingAd: boolean = false;

  totalAdPlayedDuration: number = 0;

  adPlayedDuration: number = 0;

  adId?: string;

  constructor(options: LiveAdClientOptions) {
    super();

    this.videoElement = options.videoElement;
    this.setup();
  }

  get metrics(): LiveAdEventData {
    return {
      adId: this.adId,
      adIndex: this.adIndex,
      adPlayedDuration: this.adPlayedDuration,
      totalAdPlayedDuration: this.totalAdPlayedDuration,
      exitType: ExitType.AUTO,
    };
  }

  private setup() {
    const { textTracks } = this.videoElement;

    // Check if videoElement has already added the metadata track
    // Used in scenario when switching between channels
    const track = Array.from(textTracks).filter(track => track.kind === 'metadata')[0];
    if (track) {
      this.textTrackListChangeHandler({ track } as TrackEvent);
    }
    this.detachEvents = this.attachEvents();
    this.setState('inited');
  }

  private attachEvents() {
    const { textTracks } = this.videoElement;
    textTracks.addEventListener('addtrack', this.textTrackListChangeHandler);
    this.videoElement.addEventListener('timeupdate', this.onTimeupdate);

    return () => {
      textTracks.removeEventListener('addtrack', this.textTrackListChangeHandler);
      this.videoElement.removeEventListener('timeupdate', this.onTimeupdate);
      this.detachCueChangeEvent?.();
    };
  }

  private textTrackListChangeHandler = (event: TrackEvent) => {
    const { track } = event;

    if (track?.kind === 'metadata') {
      this.detachCueChangeEvent?.();
      track.mode = 'hidden';
      const cueChangeHandler = this.cueChangeHandler;
      track.addEventListener('cuechange', cueChangeHandler);
      this.detachCueChangeEvent = () => {
        track.removeEventListener('cuechange', cueChangeHandler);
      };
    }
  };

  private cueChangeHandler = (event: Event) => {
    const { activeCues } = event.target as TextTrack;
    // Only handle if there is at least 5 cues available
    // Yospace ID3 tags only have 5 fields
    if (activeCues && activeCues.length === 5) {
      const cue = Array.from(activeCues).reduce((obj, cue) => {
        const { value: { key, data } } = cue as YospaceTextTrackCue;
        return Object.assign(obj, { [key]: data });
      }, {}) as YospaceTextTrackCue;

      const { YMID: id, YSEQ: sequence, YTYP: type } = cue;

      if (!id || !sequence || !type) return;

      if (type === 'S') {
        this.isPlayingAd = true;
        this.adId = id;
        this.adIndex = parseInt(sequence.split(':')[0], 10);
        this.emit(PLAYER_EVENTS.adStart, this.metrics);
      } else if (type === 'E') {
        // Stop the ad count down when we have met the 'E' type. We may join the ad in the middle.
        this.totalAdPlayedDuration += this.adPlayedDuration;
        this.emit(PLAYER_EVENTS.adComplete, this.metrics);
        this.reset();
      }
    }
  };

  private onTimeupdate = () => {
    if (!this.isPlayingAd) return;

    const { currentTime } = this.videoElement;
    if (typeof this.adDurationOffset === 'undefined') {
      this.adDurationOffset = currentTime;
    }
    this.adPlayedDuration = currentTime - this.adDurationOffset;
    this.emit(PLAYER_EVENTS.adTime, this.metrics);
  };

  private reset = () => {
    this.isPlayingAd = false;
    this.adDurationOffset = undefined;
    this.adPlayedDuration = 0;
    this.adId = undefined;
  };

  remove() {
    if (this.state === 'destroyed') return;
    if (this.isPlayingAd) {
      this.emit(PLAYER_EVENTS.adComplete, {
        ...this.metrics,
        exitType: ExitType.DELIBERATE,
      });
    }
    this.setState('destroyed');
    this.detachEvents?.();
  }
}
