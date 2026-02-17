import { PlayButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { PureComponent } from 'react';

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

export default class AutoPlayTile extends PureComponent<AutoPlayTileProps> {
  getSrcImg = () => {
    const { content, isEpisode } = this.props;
    const { posterarts: posters = [], thumbnails = [] } = content;
    return isEpisode ? thumbnails[0] : posters[0];
  };

  handleClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const { index, onTileClick } = this.props;
    onTileClick(index);
  };

  render() {
    const { active, isEpisode } = this.props;
    const tileClass = classNames(styles.tile, {
      [styles.activeTile]: active,
      [styles.episode]: isEpisode,
    });
    const src = this.getSrcImg();
    return (
      <div className={tileClass} onClick={this.handleClick}>
        <BackgroundImage className={styles.backgroundImage} url={src}>
          {active ? (
            <PlayButton className={styles.play} onClick={this.handleClick} />
          ) : null}
        </BackgroundImage>
      </div>
    );
  }
}
