import classNames from 'classnames';
import React from 'react';

import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { ImpressionTile } from 'common/services/ImpressionsManager';
import { AUTO_PLAY_CONTAINER_ID_IMPRESSION } from 'common/services/ImpressionsManager/ImpressionsManager';
import type { Video } from 'common/types/video';

import styles from './AutoPlayContents.scss';
import AutoPlayDetail from './AutoPlayDetail/AutoPlayDetail';
import { AutoPlayTile } from './AutoPlayTile/AutoPlayTile';

export interface AutoPlayContentsProps {
  className?: string;
  isEpisode?: boolean;
  contents: Video[];
  activeIndex: number;
  toUrl: string;
  counter?: number;
  onTileClick: (index: number) => void;
  onLinkClick: (e?: React.MouseEvent) => void;
  personalizationId?: string;
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
  personalizationId,
}) => {
  return (
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

          const autoPlayTile = (<AutoPlayTile
            content={content}
            active={active}
            index={index}
            isEpisode={isEpisode}
            onTileClick={onTileClick}
          />);

          const shouldRenderImpressionTile = !!personalizationId;
          const tile = shouldRenderImpressionTile ? (
            <ImpressionTile
              key={content.id}
              contentId={content.id}
              containerId={AUTO_PLAY_CONTAINER_ID_IMPRESSION}
              row={1}
              col={index + 1}
              personalizationId={personalizationId}
              className={tileColumnClass}
              isSeries={content.type === SERIES_CONTENT_TYPE}
            >{autoPlayTile}</ImpressionTile>
          ) : (
            <div className={tileColumnClass}>
              {autoPlayTile}
            </div>
          );

          return (
            <div className={contentClass} key={content.id}>
              {tile}
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
};

export default AutoPlayContents;
