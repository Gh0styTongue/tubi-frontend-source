import type {
  FragBufferedData,
  FragLoadedData,
} from '@adrise/hls.js';
import {
  CustomPlaybackHandler,
  PLAYER_EVENTS,
  ErrorType,
  ERROR_SOURCE,
  PLAYER_ERROR_DETAILS,
} from '@adrise/player';
import Html5Adapter from '@adrise/player/lib/adapters/html5';

const CONTENT_STARTUP_STALL_TIME = 5000;

class ContentStartupStallDetection extends CustomPlaybackHandler {

  private timer: ReturnType<typeof setTimeout> | undefined;

  private videoFragLoaded: boolean = false;

  private fragBuffered: {
    video: boolean;
    audio: boolean;
  } = {
      video: false,
      audio: false,
    };

  private _destroy: (() => void) | undefined;

  setup() {
    /* istanbul ignore if: safety check only */
    if (!this.adapter) {
      return;
    }
    const { adapter } = this;
    const videoElement = adapter.getContentVideoElement();
    /* istanbul ignore if: safety check only */
    if (!videoElement) {
      return;
    }
    const hlsInstance = this.coreInstance;
    const ExternalHls = Html5Adapter.Hls;
    /* istanbul ignore if: safety check only */
    if (!ExternalHls || !hlsInstance) {
      return;
    }
    if (__OTTPLATFORM__ === 'FIRETV_HYB') {
      hlsInstance.on(ExternalHls.Events.FRAG_LOADED, (eventName, data: FragLoadedData) => {
        if (!this.videoFragLoaded && data.frag.type === 'main') {
          this.videoFragLoaded = true;
          this.timer = setTimeout(() => {
            if (adapter.getIsCurrentTimeVideoBuffered?.()
              && adapter.getIsCurrentTimeAudioBuffered?.()
              && adapter.getVideoPlaybackQuality?.().totalVideoFrames === 1) {
              this.emitContentStartupStallError();
            }
          }, CONTENT_STARTUP_STALL_TIME);
        }
      });
    }
    if (__OTTPLATFORM__ === 'LGTV') {
      hlsInstance.on(ExternalHls.Events.FRAG_BUFFERED, (eventName, data: FragBufferedData) => {
        const isAVFragMixed = hlsInstance.audioTracks.length === 0;
        if (this.fragBuffered.video && (this.fragBuffered.audio || isAVFragMixed)) {
          return;
        }
        if (data.frag.type === 'main') {
          this.fragBuffered.video = true;
        }
        if (data.frag.type === 'audio') {
          this.fragBuffered.audio = true;
        }
        if (this.fragBuffered.video && (this.fragBuffered.audio || isAVFragMixed)) {
          this.timer = setTimeout(() => {
            this.emitContentStartupStallError();
          }, CONTENT_STARTUP_STALL_TIME);
        }
      });
    }

    this._destroy = () => {
      this.destroy();
    };
    videoElement.addEventListener('loadeddata', this._destroy);
  }

  private emitContentStartupStallError = () => {
    this.adapter?.emit(PLAYER_EVENTS.error, {
      type: ErrorType.MEDIA_ERROR,
      fatal: true,
      errorSource: ERROR_SOURCE.NATIVE_ERROR,
      details: PLAYER_ERROR_DETAILS.CONTENT_STARTUP_STALL,
      message: PLAYER_ERROR_DETAILS.CONTENT_STARTUP_STALL,
    });
  };

  destroy = () => {
    clearTimeout(this.timer);
    const videoElement = this.adapter?.getContentVideoElement();
    /* istanbul ignore if: safety check only */
    if (!videoElement || !this._destroy) {
      return;
    }
    videoElement.removeEventListener('loadeddata', this._destroy);
    this.adapter = undefined;
    this.coreInstance = undefined;
  };
}

export default ContentStartupStallDetection;
