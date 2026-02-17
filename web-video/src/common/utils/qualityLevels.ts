import type { QualityLevel } from '@adrise/player';
import { AUTOMATIC_QUALITY_LABEL } from '@adrise/player';
import { VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';

import { MAX_LEVEL_RESOLUTION } from 'common/experiments/config/ottFireTVGate1080pResolution';

export function getHighestLevelIndex(qualityLevels: QualityLevel[], isFullHD = true): number {
  let highestIndex: number = -1;
  let highestBitrate: number = -1;

  for (let i = 0; i < qualityLevels.length; i++) {
    const level = qualityLevels[i];
    if (isFullHD) {
      if (level.height > MAX_LEVEL_RESOLUTION && level.bitrate > highestBitrate) {
        highestBitrate = level.bitrate;
        highestIndex = i;
      }
    } else {
      if (level.height <= MAX_LEVEL_RESOLUTION && level.bitrate > highestBitrate) {
        highestBitrate = level.bitrate;
        highestIndex = i;
      }
    }
  }

  if (qualityLevels[highestIndex]?.label === AUTOMATIC_QUALITY_LABEL) return -1;

  return highestIndex;
}

const resolutionToHeight: {[x in VideoResolutionType]: number } = {
  [VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN]: -1,
  [VideoResolutionType.VIDEO_RESOLUTION_AUTO]: 0,
  [VideoResolutionType.VIDEO_RESOLUTION_240P]: 240,
  [VideoResolutionType.VIDEO_RESOLUTION_360P]: 360,
  [VideoResolutionType.VIDEO_RESOLUTION_480P]: 480,
  [VideoResolutionType.VIDEO_RESOLUTION_576P]: 576,
  [VideoResolutionType.VIDEO_RESOLUTION_720P]: 720,
  [VideoResolutionType.VIDEO_RESOLUTION_1080P]: 1080,
  [VideoResolutionType.VIDEO_RESOLUTION_2160P]: 2160,
};

export function getVideoResolutionType(level?: QualityLevel): VideoResolutionType {
  if (!level) return VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN;
  if (level.label === AUTOMATIC_QUALITY_LABEL) return VideoResolutionType.VIDEO_RESOLUTION_AUTO;
  const height = level.height;
  for (const key in resolutionToHeight) {
    if (resolutionToHeight[key] === height) {
      return key as VideoResolutionType;
    }
  }
  return VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN;
}
