import {
  PLAYER_EVENTS,
} from '@adrise/player';
import type {
  Player,
  BufferStartEventData,
  BufferEndEventData,
  BufferDataState,
  ResumeFromAdData,
  SeekEventData,
} from '@adrise/player';

import { VODPlaybackSession, VODPlaybackEvents } from 'client/features/playback/session/VODPlaybackSession';
import type { VideoResource } from 'common/types/video';
import { toFixed2 } from 'common/utils/format';

import { getPlayerTypeFromPlayerName } from '../track/client-log';
import { trackRebufferTime } from '../track/client-log/trackBuffer';

export function attachBufferTracking(
  player: InstanceType<typeof Player>,
  getVideoResource: () => VideoResource | undefined,
) {
  let startBufferReason: string | undefined;
  let elBufferStartTime: number | undefined;
  let wasVideoBufferedAtStart: boolean | undefined;
  let wasAudioBufferedAtStart: boolean | undefined;
  let elReadyStateAtStart: number | undefined;
  let bufferingStartBitrate: number | undefined;
  let bufferingStartRendition: [number, number] | undefined;
  let bufferDataState: BufferDataState = 'afterStartup';

  const playerType = getPlayerTypeFromPlayerName(player.playerName);

  const onBufferingStart = (data: BufferStartEventData) => {
    startBufferReason = data?.reason;
    elBufferStartTime = data?.currentTime;
    wasVideoBufferedAtStart = player.getIsCurrentTimeVideoBuffered();
    wasAudioBufferedAtStart = player.getIsCurrentTimeAudioBuffered();
    elReadyStateAtStart = player.getVideoElement()?.readyState;
    bufferingStartBitrate = toFixed2(player.getBitrate() / 1024); // kbps
    bufferingStartRendition = player.getRendition().split('@')[0].split('x').map(Number) as [number, number];
  };

  const onBufferingEnd = (data: BufferEndEventData, stats: {
    bufferingDuration: number;
    bufferingStartTimeFromViewed: number;
    intervalFromLastBuffering?: number;
  }) => {
    const {
      bufferingDuration,
      bufferingStartTimeFromViewed,
      intervalFromLastBuffering,
    } = stats;
    const videoResource = getVideoResource();
    const bufferingEndMetrics: Parameters<typeof trackRebufferTime>[0] = {
      videoResource,
      player,
      playerType,
      wasVideoBufferedAtStart,
      wasAudioBufferedAtStart,
      elReadyStateAtStart,
      bufferingStartTimeFromViewed,
      intervalFromLastBuffering,
      bufferingDuration,
      startBufferReason,
      stopBufferReason: data?.reason,
      elBufferStartTime,
      elBufferEndTime: data?.currentTime,
      bufferingStartBitrate,
      bufferingStartRendition,
      bufferDataState,
    };
    trackRebufferTime(bufferingEndMetrics);
    startBufferReason = undefined;
    elReadyStateAtStart = undefined;
    wasAudioBufferedAtStart = undefined;
    wasVideoBufferedAtStart = undefined;
  };

  const onStartLoad = (data: ResumeFromAdData) => {
    bufferDataState = !data.isResumeFromAd || data.isResumeFromPreroll ? 'afterStartup' : 'afterResume';
  };

  const onSeek = (data: SeekEventData) => {
    if (data.seekActionType === 'userAction') {
      bufferDataState = 'afterSeek';
    }
  };

  const onBufferDataEnough = () => {
    bufferDataState = 'inPlaying';
  };

  const onQualityChange = () => {
    bufferDataState = 'afterQualityChange';
  };

  const emitter = VODPlaybackSession.getInstance().getEventEmitter();
  emitter.on(VODPlaybackEvents.bufferingStart, onBufferingStart);
  emitter.on(VODPlaybackEvents.bufferingEnd, onBufferingEnd);
  player.on(PLAYER_EVENTS.startLoad, onStartLoad);
  player.on(PLAYER_EVENTS.seek, onSeek);
  player.on(PLAYER_EVENTS.bufferDataEnough, onBufferDataEnough);
  player.on(PLAYER_EVENTS.qualityChange, onQualityChange);
  return () => {
    player.off(PLAYER_EVENTS.startLoad, onStartLoad);
    player.off(PLAYER_EVENTS.seek, onSeek);
    player.off(PLAYER_EVENTS.bufferDataEnough, onBufferDataEnough);
    player.off(PLAYER_EVENTS.qualityChange, onQualityChange);
    emitter.off(VODPlaybackEvents.bufferingStart, onBufferingStart);
    emitter.off(VODPlaybackEvents.bufferingEnd, onBufferingEnd);
  };
}
