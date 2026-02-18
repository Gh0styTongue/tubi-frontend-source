import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';

import { useLocation } from 'common/context/ReactRouterModernContext';
import { usePreviewPlayerContext } from 'common/features/playback/components/PreviewPlayer/PreviewPlayerContext';
import useAppSelector from 'common/hooks/useAppSelector';
import { isVideoTileRowSelector } from 'common/selectors/ottHomegridVideoTiles/isVideoTileRowSelector';

import styles from './VideoTileBackdrop.scss';

const VideoTileBackdrop: FC = () => {
  const location = useLocation();
  const isVideoTileActive = useAppSelector(state => isVideoTileRowSelector(state, { pathname: location.pathname }));
  const { position, showBackdrop } = usePreviewPlayerContext();

  if (!isVideoTileActive) {
    return null;
  }

  const { left, top, width, height } = position;

  return (
    <div
      className={classNames(styles.videoTileBackdrop, { [styles.hidden]: !showBackdrop })}
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
};

export default VideoTileBackdrop;
