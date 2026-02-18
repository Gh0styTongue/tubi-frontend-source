import { clamp } from '@adrise/utils/lib/tools';

interface CalculateIndicatorPositionParams {
  duration: number;
  indicatorPosition: number;
  positionOffset?: number[];
  positionWidth: number;
  thumbnailWidth: number;
}

export const calculateIndicatorPosition = ({
  duration,
  indicatorPosition,
  positionOffset,
  positionWidth,
  thumbnailWidth,
}: CalculateIndicatorPositionParams) => {
  const indicatorWidth = thumbnailWidth / 2;
  const defaultRangeStart = positionWidth > 0 ? indicatorWidth / positionWidth : 0;
  const rangeStart = defaultRangeStart;
  const rangeEnd = 1 - rangeStart;
  let indicatorPercentage = duration > 0 ? indicatorPosition / duration : 0;
  indicatorPercentage = clamp(indicatorPercentage, rangeStart, rangeEnd);

  if (Array.isArray(positionOffset)) {
    const [left, right] = positionOffset;
    const minPercentage = (left + indicatorWidth) / positionWidth;
    const maxPercentage = (right - indicatorWidth) / positionWidth;
    indicatorPercentage = clamp(indicatorPercentage, minPercentage, maxPercentage);
  }

  const indicatorTimeLeft = duration > 0 ? `${indicatorPercentage * 100}%` : 0;
  return indicatorTimeLeft;
};

/**
 * compute sprite index and thumbnail index by seeking position.
 * thumbnails are generated at 5s, 10s, etc when interval is 5s.
 * to make the user could see the preview thumbnail after seeking to it,
 * we take an approach like this:
 * - 0 ~ interval - 1: the first thumbnail
 * - interval ~ 2 * interval - 1: use the second thumbnail
 * - 2 * interval ~ 3 * interval - 1: use the third thumbnail
 * - ...
 * - n * interval ~ n * interval - 1: reuse previous thumbnail
 * @param {Object} ThumbnailSpriteIndices sprite index and thumbnail index
 * @param {Number} ThumbnailSpriteIndices.position seek position
 * @param {Number} ThumbnailSpriteIndices.duration content duration
 * @param {Number} ThumbnailSpriteIndices.countPerSprite thumbnail count per sprite
 * @param {Number} ThumbnailSpriteIndices.interval period of time that thumbnails are generated
 * @returns {Object} sprite index and the inside thumbnail index
 */
export const computeThumbnailSpriteIndices = ({
  position,
  duration,
  countPerSprite,
  interval,
}: {
  position: number;
  duration: number;
  countPerSprite: number;
  interval: number;
}): {
  spriteIndex: number;
  thumbnailIndex: number;
} => {
  const thumbnailMaxIndex = Math.floor(duration / interval) - 1;
  const thumbnailGlobalIndex = Math.min(Math.floor(position / interval), thumbnailMaxIndex);
  return {
    spriteIndex: Math.floor(thumbnailGlobalIndex / countPerSprite),
    thumbnailIndex: thumbnailGlobalIndex % countPerSprite,
  };
};

