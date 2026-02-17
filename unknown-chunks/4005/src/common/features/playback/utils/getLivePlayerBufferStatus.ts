import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { NO_BUFFER_THRESHOLD } from 'common/constants/constants';
import { toFixed2 } from 'common/utils/format';

export type ArrayedTimeRange = [number, number];

export interface LivePlayerBufferStatus {
  currentTime: number;
  isVideoBuffered: boolean;
  isAudioBuffered: boolean;
  nearestVideoBufferRanges: ArrayedTimeRange[];
  nearestAudioBufferRanges: ArrayedTimeRange[];
}

const isTimeInRange = (currentTime: number, ranges: TimeRanges): boolean => {
  for (let i = 0; i < ranges.length; i += 1) {
    if (currentTime >= ranges.start(i) && currentTime < ranges.end(i) - NO_BUFFER_THRESHOLD) {
      return true;
    }
  }
  return false;
};

const getNearestBufferedRange = (currentTime: number, ranges: TimeRanges): ArrayedTimeRange[] => {
  let lastRange: ArrayedTimeRange | undefined;
  let i = 0;
  for (; i < ranges.length; i += 1) {
    const start = toFixed2(ranges.start(i));
    const end = toFixed2(ranges.end(i));
    if (currentTime >= start && currentTime <= end - NO_BUFFER_THRESHOLD) {
      return [[start, end]];
    }
    if (start > currentTime) {
      // If the last range is close to the currentTime, means there might be a hole
      // e,g: buffered ranges [1, 16] [17, 23] and currentTime is 16.4
      return lastRange && currentTime - lastRange[1] < NO_BUFFER_THRESHOLD
        ? [lastRange, [start, end]]
        : [[start, end]];
    }
    lastRange = [start, end];
  }
  return lastRange ? [lastRange] : [];
};

export const getLivePlayerBufferStatus = (
  wrapper: LivePlayerWrapper
): LivePlayerBufferStatus => {
  const videoBufferedRanges: TimeRanges | undefined = wrapper.hls?.videoBuffered;
  const audioBufferedRanges: TimeRanges | undefined = wrapper.hls?.audioBuffered;
  const currentTime = wrapper.getPosition();

  if (currentTime === undefined) {
    return {
      currentTime: 0,
      isAudioBuffered: false,
      isVideoBuffered: false,
      nearestAudioBufferRanges: [],
      nearestVideoBufferRanges: [],
    };
  }

  const isVideoBuffered = videoBufferedRanges
    ? isTimeInRange(currentTime, videoBufferedRanges)
    : false;

  const isAudioBuffered = audioBufferedRanges
    ? isTimeInRange(currentTime, audioBufferedRanges)
    : false;

  const nearestVideoBufferedRanges = videoBufferedRanges ? getNearestBufferedRange(currentTime, videoBufferedRanges) : [];
  const nearestAudioBufferedRanges = audioBufferedRanges ? getNearestBufferedRange(currentTime, audioBufferedRanges) : [];

  return {
    currentTime,
    isAudioBuffered,
    isVideoBuffered,
    nearestVideoBufferRanges: nearestVideoBufferedRanges,
    nearestAudioBufferRanges: nearestAudioBufferedRanges,
  };
};
