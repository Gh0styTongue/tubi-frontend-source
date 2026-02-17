import type { Player, ErrorEventData, SDKInfo } from '@adrise/player';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { VODStage } from 'client/features/playback/session/VODPageSession';
import type { FeatureInfo } from 'client/features/playback/session/VODPlaybackSession';
import type { LivePlaybackQualityManager, LivePlayerState } from 'common/features/playback/services/LivePlaybackQualityManager';
import type { VideoResourceType, HDCPVersion, VideoType, VideoResource } from 'common/types/video';
import type { LinearPageTypes } from 'common/utils/linearPageType';

export enum PlayerType {
  VOD = 'v',
  Linear = 'l',
  Preview = 'p',
  Trailer = 't',
}

export const UNKNOWN_ERROR = 'unknown error';

export const PLAYER_ANALYTICS_EVENT_VERSION = '1.0';

interface HlsFragLoadErrorInfo {
  fragUrl: string;
  levelLoadTimes: number; // In hls.js, it means how many redundant resources we have tried in current level
  fragmentRetryTimes: number; // In hls.js, it means how many frag load retries has occurred in current level
  response: Partial<ErrorEventData['response']>;
}

interface ErrorClientLogBaseInfo {
  error_code: string;
  error_message: string;
  fatal: boolean;
  reason?: string;
  // We need this property for internal error on Hls.js
  sub_error?: string;
}

export interface ErrorClientLogInfo extends ErrorClientLogBaseInfo, Partial<HlsFragLoadErrorInfo> {
  flushArea?: ErrorEventData['flushArea'];
  stage?: VODStage;
  features?: FeatureInfo;
  batchedErrorCount?: number;
  tvt?: number;
  track_id?: string;
  event?: string;
  originalMessage?: string;
  levelUrl?: string;
  hasMediaKeys?: boolean;
  qos_error_type?: unknown;
  qos_error_code?: unknown;
}

export interface AdClientLogBaseInfo {
  content_id: string;
  isPreroll?: boolean;
  count?: number;
  index?: number;
  duration?: number;
  position: number;
  adPosition: number | undefined;
  url?: string;
  id?: string;
  player: PlayerType;
  release?: string;
  lagTime?: number;
  retry?: number;
}

export interface VideoErrorParamsBase {
  isAd?: boolean;
  videoUrl?: string;
  position?: number;
  contentId?: string;
  reportTimestamp?: number;
  duration?: number;
  playerStatus?: Record<string, unknown> | string;
  playerState?: string;
  isUsingWebWorker?: boolean;
}

export interface TrackVideoErrorParam extends VideoErrorParamsBase {
  err: ErrorEventData;
  adVideoId?: string;
  adRequestId?: string;
  fatal?: boolean;
  videoResourceType?: VideoResourceType;
  hdcp?: HDCPVersion;
  bitrate?: number;
  isLive?: boolean;
  player?: VideoType,
  pageReloadRetryCount?: number;
}

export interface VODClientLogBaseInfo {
  content_id: string;
  cdn?: string;
  hdcp?: HDCPVersion;
  isAd?: boolean;
  contentPos?: number;
  position?: number;
  duration?: number;
  playerType?: PlayerType;
  release?: string;
  seeking?: boolean;
  buffering?: boolean;
  bufferLength?: number;
  bitrate?: number;
  contentBwEstimate?: number;
  isUsingWebWorker?: boolean;
  closestVideoBufferedArray?: [number, number][];
  closestAudioBufferedArray?: [number, number][];
  sdk?: SDKInfo;
}

export type VODClientLogBaseParams = {
  contentId: string;
  videoResource?: VideoResource;
  playerInstance?: Player;
  cdn?: string;
};

export interface VideoResourceFallbackParams {
  contentId: string;
  reason?: string;
  failedVideoResource?: VideoResource;
  fallbackVideoResource: VideoResource;
}

export interface PauseAdBaseLogContext {
  // ms since we started the pause break
  timeInPauseBreak: number;
  // content ID if known
  contentId: string,
  // resolution we passed to rainmaker endpoint
  resolution: number,
  // position in the content, seconds
  now_pos: number,
  // url of image if known; may be empty if not known yet
  imageUrl: string,
  // how many times the timer has been reset so far
  timerResetCount: number,
  // is the pause explicit? i.e. user-initiated
  isPauseExplicit: boolean,
  // is the document hidden? i.e. app in background mode
  isDocumentHidden: boolean,
  // is HDMI connected?
  isHDMIConnected: boolean,
}

export type LiveClientLogBaseParams = {
  contentId: string;
  streamUrl?: string;
  wrapper?: LivePlayerWrapper | null;
  qualityManager?: LivePlaybackQualityManager;
};

export interface LiveClientLogBaseInfo {
  is_live: boolean;
  content_id: string;
  position?: number;
  pageType: LinearPageTypes;
  bufferLength?: number;
  contentBwEstimate?: number;
  streamToken: string;
  sessionStartTs: number;
  state?: keyof typeof LivePlayerState | 'unknown';
  stateNum?: number;
  elReadyState?: number;
  playbackId?: string;
  usingApollo?: boolean;
  isAppHidden?: boolean;
  bitrate?: number;
  playback_codec_detail?: unknown;
  cdn?: string;
  isUsingWebWorker?: boolean;
  resolution?: unknown;
  screenResolution?: unknown;
}

export interface ThumbnailLogBaseContext {
  contentId: string;
  temporalResolutions: string[];
}
