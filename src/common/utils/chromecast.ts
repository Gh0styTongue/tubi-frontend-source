import type { Video } from 'common/types/video';
import type { ChromecastCustomMessageType } from 'web/features/playback/constants/chromecast';
import { CUSTOM_MESSAGE_NAMESPACE } from 'web/features/playback/constants/chromecast';

export interface AutoplayMessageData {
  video: Partial<Video>,
  timeLeft: number;
}

export interface AutoplayShowMessage {
  type: ChromecastCustomMessageType.AUTOPLAY_SHOW,
  data: AutoplayMessageData
}

export interface AutoplayPauseMessage {
  type: ChromecastCustomMessageType.AUTOPLAY_PAUSE
}

export interface AutoplayResumeMessage {
  type: ChromecastCustomMessageType.AUTOPLAY_RESUME
}

export interface AutoplayStartMessage {
  type: ChromecastCustomMessageType.AUTOPLAY_START
}

export interface AutoplayCancelMessage {
  type: ChromecastCustomMessageType.AUTOPLAY_CANCEL
}

export type ChromecastCustomMessage =
  AutoplayShowMessage
  | AutoplayPauseMessage
  | AutoplayResumeMessage
  | AutoplayStartMessage
  | AutoplayCancelMessage;

export const sendChromecastCustomMessage = (params: ChromecastCustomMessage) => {
  const castContext = cast.framework.CastContext.getInstance();
  return castContext.getCurrentSession()?.sendMessage(CUSTOM_MESSAGE_NAMESPACE, params);
};
