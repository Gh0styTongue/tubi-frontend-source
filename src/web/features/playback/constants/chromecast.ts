// For send custom message to chromecast receiver, must begin with `urn:x-cast:`
// see https://developers.google.com/cast/docs/web_receiver/core_features#custom_messages
export const CUSTOM_MESSAGE_NAMESPACE = 'urn:x-cast:com.tubitv.cast.message';

export enum ChromecastCustomMessageType {
  AUTOPLAY_SHOW = 'AUTOPLAY_SHOW',
  AUTOPLAY_PAUSE = 'AUTOPLAY_PAUSE',
  AUTOPLAY_RESUME = 'AUTOPLAY_RESUME',
  AUTOPLAY_START = 'AUTOPLAY_START',
  AUTOPLAY_CANCEL = 'AUTOPLAY_CANCEL',
}
