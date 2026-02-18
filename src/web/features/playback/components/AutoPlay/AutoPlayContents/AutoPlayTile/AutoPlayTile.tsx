import { PlayButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback } from 'react';

import type { Video } from 'common/types/video';
import BackgroundImage from 'web/components/BackgroundImage/BackgroundImage';

import styles from './AutoPlayTile.scss';

export interface AutoPlayTileProps {
  content: Video,
  active: boolean,
  index: number,
  isEpisode?: boolean,
  onTileClick: (index: number) => void,
}

export const AutoPlayTile = ({
  content,
  active,
  isEpisode,
  onTileClick,
  index,
}: AutoPlayTileProps) => {
  const handleClick = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    onTileClick(index);
  }, [index, onTileClick]);

  const tileClass = classNames(styles.tile, {
    [styles.activeTile]: active,
    [styles.episode]: isEpisode,
  });

  const imageSrc = isEpisode ? content.thumbnails[0] : content.posterarts[0];

  return (
    <div className={tileClass} onClick={handleClick}>
      <BackgroundImage className={styles.backgroundImage} url={imageSrc}>
        {active ? (
          <PlayButton className={styles.play} onClick={handleClick} />
        ) : null}
      </BackgroundImage>
    </div>

  );
};
