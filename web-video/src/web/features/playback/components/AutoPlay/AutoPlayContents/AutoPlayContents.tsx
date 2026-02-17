import classNames from 'classnames';
import React from 'react';

import type { autoPlayContentsSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';

import styles from './AutoPlayContents.scss';
import AutoPlayDetail from './AutoPlayDetail/AutoPlayDetail';
import AutoPlayTile from './AutoPlayTile/AutoPlayTile';

export interface AutoPlayContentsProps {
  className?: string,
  isEpisode?: boolean,
  contents: ReturnType<typeof autoPlayContentsSelector>,
  activeIndex: number,
  toUrl: string,
  counter?: number,
  onTileClick: (index: number) => void,
  onLinkClick: (e?: React.MouseEvent) => void,
}

const AutoPlayContents: React.FunctionComponent<AutoPlayContentsProps> = ({
  contents,
  isEpisode,
  toUrl,
  activeIndex,
  counter,
  className,
  onTileClick,
  onLinkClick,
}) => (
  <div className={classNames(styles.autoplayContents, className)}>
    <div className={styles.contentsRow}>
      {contents.map((content: Video, index: number) => {
        const active = activeIndex === index;
        const contentClass = classNames(styles.content, {
          [styles.active]: active,
        });
        const tileColumnClass = classNames(styles.tileCol, {
          [styles.episode]: isEpisode,
          [styles.active]: active,
        });
        const detailColumnClass = classNames(styles.detailCol, {
          [styles.episode]: isEpisode,
        });
        return (
          <div className={contentClass} key={content.id}>
            <div className={tileColumnClass}>
              <AutoPlayTile
                content={content}
                active={active}
                index={index}
                isEpisode={isEpisode}
                onTileClick={onTileClick}
              />
            </div>
            {active ? (
              <div className={detailColumnClass}>
                <AutoPlayDetail
                  className={styles.detail}
                  content={content}
                  counter={counter}
                  toUrl={toUrl}
                  onLinkClick={onLinkClick}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  </div>
);

export default AutoPlayContents;
