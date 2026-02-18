import { CustomPlaybackHandler } from '@adrise/player';
import Html5Adapter from '@adrise/player/lib/adapters/html5';

import { trackHlsJSInfo } from 'client/features/playback/track/client-log';

const LIMIT_LOG_LENGTH = 30;

class CustomHLSLogger extends CustomPlaybackHandler {

  private isReady = false;

  private hlsStack = ['setup'];

  private _onloadedData: (() => void) | undefined;

  private _onloadedMetaData: (() => void) | undefined;

  setup() {
    /* istanbul ignore if */
    if (!this.adapter) {
      return;
    }
    const { adapter } = this;
    const videoElement = adapter.getContentVideoElement();
    /* istanbul ignore if */
    if (!videoElement) {
      return;
    }
    this._onloadedData = this.onloadedData.bind(this);
    this._onloadedMetaData = this.onloadedMetaData.bind(this);
    videoElement.addEventListener('loadeddata', this._onloadedData);
    videoElement.addEventListener('loadedmetadata', this._onloadedMetaData);
    this.addHLSEventsListener();
  }

  private addHLSEventsListener() {
    const hlsInstance = this.coreInstance;
    const ExternalHls = Html5Adapter.Hls;
    /* istanbul ignore if */
    if (!ExternalHls) {
      return;
    }
    const HLS_BASIC_EVENTS = [
      ExternalHls.Events.MANIFEST_LOADED,
      ExternalHls.Events.MANIFEST_PARSED,
      ExternalHls.Events.LEVEL_LOADING,
      ExternalHls.Events.LEVEL_LOADED,
      ExternalHls.Events.KEY_LOADING,
      ExternalHls.Events.KEY_LOADED,
      ExternalHls.Events.AUDIO_TRACK_LOADED,
      ExternalHls.Events.EME_SESSION_UPDATE,
      ExternalHls.Events.EME_DESTROYED,
      ExternalHls.Events.MEDIA_ATTACHING,
      ExternalHls.Events.MEDIA_DETACHED,
      ExternalHls.Events.MEDIA_DETACHING,
      ExternalHls.Events.DESTROYING,
      ExternalHls.Events.ERROR,
    ];
    HLS_BASIC_EVENTS.forEach((item) => {
      hlsInstance?.on(item, () => {
        if (this.hlsStack.length <= LIMIT_LOG_LENGTH) {
          this.hlsStack.push(item);
        }
      });
    });
  }

  private onloadedData() {
    if (!this.isReady) {
      this.isReady = true;
      this.hlsStack.push('ready');
    }
  }

  private onloadedMetaData() {
    this.hlsStack.push('loadedMetaData');
  }

  private removeListeners(videoElement: HTMLVideoElement) {
    this._onloadedData && videoElement.removeEventListener('loadeddata', this._onloadedData);
    this._onloadedMetaData && videoElement.removeEventListener('loadedmetadata', this._onloadedMetaData);
  }

  destroy = () => {
    /* istanbul ignore if */
    if (!this.adapter) {
      return;
    }
    const { adapter } = this;
    const videoElement = adapter.getContentVideoElement();
    /* istanbul ignore if */
    if (!videoElement) {
      return;
    }
    this.removeListeners(videoElement);
    trackHlsJSInfo({
      hlsLog: this.hlsStack.join(','),
    });
  };

}

export default CustomHLSLogger;
