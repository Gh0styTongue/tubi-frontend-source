import {
  PLAYER_EVENTS,
} from '@adrise/player';
import type {
  Player,
  BufferStartEventData,
  BufferEndEventData,
  BufferDataState,
  StartLoadEventData,
  SeekEventData,
  BufferingType,
  FragDownloadInfo,
} from '@adrise/player';
import { getClosestBufferedRanges, getBufferedInfo } from '@adrise/player/lib/utils/tools';
import { toFixed2 } from '@adrise/utils/lib/tools';

import { VODPlaybackSession, VODPlaybackEvents } from 'client/features/playback/session/VODPlaybackSession';
import type { VideoResource } from 'common/types/video';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

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
  let closestVideoBufferedArray: [number, number][] | undefined;
  let closestAudioBufferedArray: [number, number][] | undefined;
  let videoBufferLength: number | undefined;
  let audioBufferLength: number | undefined;
  let bufferingType: BufferingType | undefined;
  let decodedFramesAtStart: number | undefined;
  let contentBwEstimateAtStart: number | undefined;
  let fragDownloadInfoAtStart: FragDownloadInfo | undefined;
  let videoBufferHole: number | undefined;
  let audioBufferHole: number | undefined;
  let showingUIComponentsAtStart: string[] | undefined;

  const playerType = getPlayerTypeFromPlayerName(player.playerName);

  const onBufferingStart = (data: BufferStartEventData) => {
    const videoPos = toFixed2(player.getPrecisePosition());
    const videoBufferedInfo = getBufferedInfo(player.getBufferedVideoRange(), videoPos, 0);
    const audioBufferedInfo = getBufferedInfo(player.getBufferedAudioRange(), videoPos, 0);
    startBufferReason = data?.reason;
    elBufferStartTime = data?.currentTime !== undefined ? toFixed2(data.currentTime) : undefined;
    wasVideoBufferedAtStart = player.getIsCurrentTimeVideoBuffered();
    wasAudioBufferedAtStart = player.getIsCurrentTimeAudioBuffered();
    elReadyStateAtStart = player.getContentVideoElement()?.readyState;
    bufferingStartBitrate = toFixed2(player.getBitrate() / 1000); // kbps
    bufferingStartRendition = player.getRendition().split('@')[0].split('x').map(Number) as [number, number];
    closestVideoBufferedArray = getClosestBufferedRanges(player.getBufferedVideoRange(), videoPos);
    closestAudioBufferedArray = getClosestBufferedRanges(player.getBufferedAudioRange(), videoPos);
    if (wasVideoBufferedAtStart && wasAudioBufferedAtStart) {
      videoBufferLength = toFixed2(videoBufferedInfo.len);
      audioBufferLength = toFixed2(audioBufferedInfo.len);
    }
    videoBufferHole = videoBufferedInfo.bufferHole !== undefined
      ? toFixed2(videoBufferedInfo.bufferHole)
      : undefined;
    audioBufferHole = audioBufferedInfo.bufferHole !== undefined
      ? toFixed2(audioBufferedInfo.bufferHole)
      : undefined;
    bufferingType = nullishCoalescingWrapper(data.bufferingType, 'network');
    decodedFramesAtStart = data.decodedFrames;
    contentBwEstimateAtStart = toFixed2(player.getBandwidthEstimate() / 1000); // kbps
    fragDownloadInfoAtStart = player.getFragDownloadInfo();
    showingUIComponentsAtStart = VODPlaybackSession.getVODPlaybackInfo().showingUIComponents;
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
    const videoPos = toFixed2(player.getPrecisePosition());
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
      elBufferEndTime: data?.currentTime !== undefined ? toFixed2(data.currentTime) : undefined,
      bufferingStartBitrate,
      bufferingStartRendition,
      bufferDataState: VODPlaybackSession.getVODPlaybackInfo().bufferingDataState,
      nearestVideoBufferRanges: closestVideoBufferedArray,
      nearestAudioBufferRanges: closestAudioBufferedArray,
      videoBufferLength,
      audioBufferLength,
      videoBufferHole,
      audioBufferHole,
      bufferingType,
      nearestVideoBufferRangesAtEnd: getClosestBufferedRanges(player.getBufferedVideoRange(), videoPos),
      nearestAudioBufferRangesAtEnd: getClosestBufferedRanges(player.getBufferedAudioRange(), videoPos),
      decodedFramesAtStart,
      contentBwEstimateAtStart,
      fragDownloadInfoAtStart,
      showingUIComponentsAtStart,
    };
    trackRebufferTime(bufferingEndMetrics);
    startBufferReason = undefined;
    elReadyStateAtStart = undefined;
    wasAudioBufferedAtStart = undefined;
    wasVideoBufferedAtStart = undefined;
    closestVideoBufferedArray = undefined;
    closestAudioBufferedArray = undefined;
    videoBufferLength = undefined;
    audioBufferLength = undefined;
    videoBufferHole = undefined;
    audioBufferHole = undefined;
    bufferingType = undefined;
    decodedFramesAtStart = undefined;
    contentBwEstimateAtStart = undefined;
    fragDownloadInfoAtStart = undefined;
    showingUIComponentsAtStart = undefined;
  };

  const onStartLoad = (data: StartLoadEventData) => {
    if (data.startLoadType === 'startup') {
      setBufferDataState('afterStartup');
    } else if (data.startLoadType === 'resumeFromMidroll') {
      setBufferDataState('afterResumeFromMidroll');
    }
  };

  const onSeek = (data: SeekEventData) => {
    if (data.seekActionType === 'userAction') {
      setBufferDataState('afterSeek');
    }
  };

  const onBufferDataEnough = () => {
    setBufferDataState('inPlaying');
  };

  const onQualityChange = () => {
    setBufferDataState('afterQualityChange');
  };

  const setBufferDataState = (dataState: BufferDataState) => {
    VODPlaybackSession.getInstance().setBufferingDataState(dataState);
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
