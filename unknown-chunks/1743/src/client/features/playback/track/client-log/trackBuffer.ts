import type {
  Player,
  BufferDataState,
} from '@adrise/player';
import { extractLiveStreamToken, trimQueryString } from '@adrise/utils/lib/url';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { PlayerType } from 'client/features/playback/track/client-log';
import {
  getClientLogInfoForVideoDetail,
} from 'client/features/playback/track/client-log/utils/getClientLogInfoForVideoDetail';
import type { BUFFER_END_OPERATION } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import type { ArrayedTimeRange } from 'common/features/playback/utils/getLivePlayerBufferStatus';
import type { VideoResource } from 'common/types/video';
import { toFixed2 } from 'common/utils/format';
import { getLinearPageType } from 'common/utils/linearPageType';
import { trackLogging } from 'common/utils/track';

// export for test only
export function getParamsFromPlayer(player: InstanceType<typeof Player> | InstanceType<typeof LivePlayerWrapper>,) {
  const isLivePlayer = (p: any): p is InstanceType<typeof LivePlayerWrapper> => p.isLivePlayer;
  let url:string;
  let sdkVersion: string | undefined;
  let isAd:boolean = false;

  if (isLivePlayer(player)) {
    url = player.url;
  } else {
    url = player.getMediaUrl();
    sdkVersion = player.SDKVersion;
    isAd = player.isAd();
  }
  return {
    url,
    sdkVersion,
    isAd,
    contentBwEstimate: toFixed2(player.getBandwidthEstimate() / 1024), // kbps
    elReadyState: player.getCurrentVideoElement()?.readyState,
  };
}

const getLiveParams = (url: string) => {
  return {
    streamToken: extractLiveStreamToken(url),
    pageType: getLinearPageType(),
    sessionStartTs: toFixed2(getLiveVideoSession().startTimestamp),
  };
};
/**
 * report player metrics
 * @link https://docs.google.com/document/d/1vV7W_ksTkZEEiVn04tU5anZPrBjUbYBNMUPNTnaICX0/edit#heading=h.9p1saoqxqwka
 */
export function trackBufferStart({
  player,
  startBufferReason,
  elBufferStartTime,
  playerType,
  isAudioBuffered,
  isVideoBuffered,
  videoResource,
  nearestVideoBufferRanges,
  nearestAudioBufferRanges,
}: {
    player: InstanceType<typeof Player> | InstanceType<typeof LivePlayerWrapper>,
    startBufferReason?: string,
    elBufferStartTime?: number,
    playerType: PlayerType,
    isAudioBuffered: boolean | undefined,
    isVideoBuffered: boolean | undefined,
    videoResource?: VideoResource,
    nearestVideoBufferRanges?: ArrayedTimeRange[]
    nearestAudioBufferRanges?: ArrayedTimeRange[]
  }) {
  const { url, contentBwEstimate, elReadyState, sdkVersion, isAd } = getParamsFromPlayer(player);
  const isLive = playerType === PlayerType.Linear;

  trackLogging({
    type: isAd ? TRACK_LOGGING.adInfo : TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.BUFFER_START,
    message: {
      startBufferReason,
      startPosition: elBufferStartTime,
      media: trimQueryString(url),
      contentBwEstimate,
      elReadyState,
      player: playerType,
      SDKVersion: sdkVersion,
      isAudioBuffered,
      isVideoBuffered,
      nearestVideoBufferRanges,
      nearestAudioBufferRanges,
      ...(isLive ? getLiveParams(url) : {}),
      ...getClientLogInfoForVideoDetail({
        videoResource,
        player,
      }),
    },
  });
}

export function trackRebufferTime({
  player,
  bufferingDuration,
  startBufferReason,
  stopBufferReason,
  elBufferStartTime,
  elBufferEndTime,
  bufferingStartTimeFromViewed,
  intervalFromLastBuffering,
  bufferingStartBitrate,
  bufferingStartRendition,
  playerType,
  wasAudioBufferedAtStart,
  wasVideoBufferedAtStart,
  nearestVideoBufferRanges,
  nearestAudioBufferRanges,
  bufferEndOperation,
  elReadyStateAtStart,
  bufferDataState,
  videoResource,
}: {
    player: InstanceType<typeof Player> | InstanceType<typeof LivePlayerWrapper>,
    bufferingDuration?: number,
    startBufferReason?: string,
    stopBufferReason?: string,
    elBufferStartTime?: number,
    elBufferEndTime?: number,
    bufferingStartTimeFromViewed?: number,
    intervalFromLastBuffering?: number,
    bufferingStartBitrate?: number,
    bufferingStartRendition?: [number, number],
    playerType: PlayerType,
    wasAudioBufferedAtStart: boolean | undefined,
    wasVideoBufferedAtStart: boolean | undefined,
    nearestVideoBufferRanges?: ArrayedTimeRange[],
    nearestAudioBufferRanges?: ArrayedTimeRange[],
    bufferEndOperation?: BUFFER_END_OPERATION,
    elReadyStateAtStart: number | undefined,
    bufferDataState?: BufferDataState,
    videoResource?: VideoResource,
  }) {
  if (bufferingDuration === undefined) {
    return;
  }
  const { url, contentBwEstimate, elReadyState, sdkVersion, isAd } = getParamsFromPlayer(player);
  const isLive = playerType === PlayerType.Linear;

  trackLogging({
    type: isAd ? TRACK_LOGGING.adInfo : TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.BUFFER_END,
    message: {
      bufferingDuration, // milliseconds
      startBufferReason,
      stopBufferReason,
      startPosition: elBufferStartTime,
      endPosition: elBufferEndTime,
      bufferingStartTimeFromViewed, // seconds
      intervalFromLastBuffering, // seconds
      media: trimQueryString(url),
      contentBwEstimate, // kbps
      elReadyState,
      player: playerType,
      SDKVersion: sdkVersion,
      wasAudioBufferedAtStart,
      wasVideoBufferedAtStart,
      nearestVideoBufferRanges,
      nearestAudioBufferRanges,
      bufferEndOperation,
      elReadyStateAtStart,
      bufferingStartVideoWidth: bufferingStartRendition?.[0],
      bufferingStartVideoHeight: bufferingStartRendition?.[1],
      bufferingStartBitrate, // kbps
      bufferDataState,
      ...getClientLogInfoForVideoDetail({
        videoResource,
        player,
      }),
      ...(isLive ? getLiveParams(url) : {}),
      ...(isLive ? {} : {
        track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
      }),
    },
  });
}
