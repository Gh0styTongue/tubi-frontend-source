import { clamp } from '@adrise/utils/lib/tools';
import { toCSSUrl } from '@adrise/utils/lib/url';
import classNames from 'classnames';
import throttle from 'lodash/throttle';
import type { RefObject } from 'react';
import React, { PureComponent } from 'react';

import { DEFAULT_THUMBNAIL_INTERVAL } from 'common/constants/player';
import type { ThumbnailSprites } from 'common/types/video';
import { secondsToHMS } from 'common/utils/timeFormatting';

import styles from './ThumbnailPreview.scss';

export interface ThumbnailPreviewProps {
  duration: number;
  handleClick?: (event: React.MouseEvent) => void;
  indicatorPosition: number;
  isAnimated?: boolean;
  isShowText?: boolean;
  positionOffset?: number[];
  positionWidth: number;
  thumbnailSprites: Partial<ThumbnailSprites>;
  nodeRef?: RefObject<HTMLDivElement>;
}

interface ThumbnailPreviewState {
  backgroundImage: string;
  backgroundPosition: string;
}

// TODO: Double-check this
const DEFAULT_COUNT_PER_SPRITE = 1;
const DEFAULT_THUMBNAIL_WIDTH_PX = 120;
// TODO: find a better value for this
const DEFAULT_THUMBNAIL_HEIGHT_PX = 0;

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
export const computeThumbnailSpriteIndices = ({ position, duration, countPerSprite, interval }: { position: number, duration: number, countPerSprite: number, interval: number }): {
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

export default class ThumbnailPreview extends PureComponent<ThumbnailPreviewProps, ThumbnailPreviewState> {
  state = {
    backgroundImage: 'none',
    backgroundPosition: '-1px bottom',
  };

  updateThumbnailBackground = throttle(() => {
    const {
      indicatorPosition,
      duration,
      thumbnailSprites,
    } = this.props;

    const {
      count_per_sprite: countPerSprite = DEFAULT_COUNT_PER_SPRITE,
      frame_width: thumbnailWidth = DEFAULT_THUMBNAIL_WIDTH_PX,
      sprites = [],
    } = thumbnailSprites[`${DEFAULT_THUMBNAIL_INTERVAL}x`] || {};
    // For web, we only use the 5x intervals for thumbnail sprites where 5 is the default interval.
    // In comparison, OTT uses 5x, 10x, 20x based on the seek rate to reduce the number of requests

    if (!this.isComponentMounted || sprites.length === 0) return;

    const { spriteIndex, thumbnailIndex } = computeThumbnailSpriteIndices({
      position: indicatorPosition,
      duration,
      countPerSprite,
      interval: 5,
    });

    this.setState({
      backgroundImage: toCSSUrl(sprites[spriteIndex]),
      // one more pixel left to hide the bold edge, cooperated with two pixels less width, will display a pretty thumbnail
      backgroundPosition: `-${thumbnailIndex * thumbnailWidth + 1}px bottom`,
    });
  }, 200);

  private isComponentMounted: boolean = false;

  componentDidMount() {
    this.isComponentMounted = true;
    this.updateThumbnailBackground();
  }

  componentDidUpdate(prevProps: ThumbnailPreviewProps) {
    if (prevProps.indicatorPosition !== this.props.indicatorPosition) {
      this.updateThumbnailBackground();
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const { handleClick } = this.props;
    handleClick?.(event);
  };

  render() {
    const {
      duration,
      indicatorPosition,
      isAnimated,
      isShowText,
      positionOffset,
      positionWidth,
      thumbnailSprites,
    } = this.props;

    const {
      frame_width: thumbnailWidth = DEFAULT_THUMBNAIL_WIDTH_PX,
      height: thumbnailHeight = DEFAULT_THUMBNAIL_HEIGHT_PX,
      sprites = [],
    } = thumbnailSprites[`${DEFAULT_THUMBNAIL_INTERVAL}x`] || {};

    const { backgroundImage, backgroundPosition } = this.state;

    // calculate boundary both sides
    // get the percentage of it
    const indicatorWidth = thumbnailWidth / 2;
    const defaultRangeStart = positionWidth > 0 ? indicatorWidth / positionWidth : 0;
    const rangeStart = defaultRangeStart;
    const rangeEnd = 1 - rangeStart;
    let indicatorPercentage = indicatorPosition / duration;
    indicatorPercentage = clamp(indicatorPercentage, rangeStart, rangeEnd);
    // adjust position with `positionOffset`
    if (Array.isArray(positionOffset)) {
      const [left, right] = positionOffset;
      const minPercentage = (left + indicatorWidth) / positionWidth;
      const maxPercentage = (right - indicatorWidth) / positionWidth;
      indicatorPercentage = clamp(
        indicatorPercentage,
        minPercentage,
        maxPercentage,
      );
    }

    const indicatorTimeLeft = duration > 0 ? `${indicatorPercentage * 100}%` : 0;
    const indicatorTimeText = indicatorPosition
      ? secondsToHMS(indicatorPosition)
      : '00:00';

    if (sprites.length === 0 && !isShowText) return null;
    // no thumbnail sprites
    if (sprites.length === 0) {
      return (
        <span
          ref={this.props.nodeRef}
          className={styles.timeText}
          style={{ left: indicatorTimeLeft }}
        >
          {indicatorTimeText}
        </span>
      );
    }

    return (
      <div
        ref={this.props.nodeRef}
        className={classNames(styles.container, {
          [styles.isAnimated]: isAnimated,
        })}
        onClick={this.handleClick}
        style={{
          height: `${thumbnailHeight + 2}px`,
          left: indicatorTimeLeft,
          width: `${thumbnailWidth}px`,
        }}
      >
        <div
          className={classNames(styles.thumbnail, {
            [styles.isAnimated]: isAnimated,
          })}
          style={{ backgroundImage, backgroundPosition }}
        />
        {isShowText ? (
          <span className={styles.timeText}>{indicatorTimeText}</span>
        ) : null}
      </div>
    );
  }
}
