import type { RefObject } from 'react';
import React from 'react';

import { secondsToHMS } from 'common/utils/timeFormatting';

import styles from '../ThumbnailPreview.scss';

interface TimeTextProps {
  indicatorPosition: number;
  left?: string | number;
  nodeRef?: RefObject<HTMLDivElement>;
}

const TimeText = ({ indicatorPosition, left, nodeRef }: TimeTextProps) => {
  const indicatorTimeText = indicatorPosition ? secondsToHMS(indicatorPosition) : '00:00';
  return (
    <span
      ref={nodeRef}
      className={styles.timeText}
      style={left !== undefined ? { left } : undefined}
    >
      {indicatorTimeText}
    </span>
  );
};

export default TimeText;

