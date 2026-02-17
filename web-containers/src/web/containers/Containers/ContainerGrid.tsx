import type { TileOrientation } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useMemo, memo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { SET_CATEGORIES_EXPANDED } from 'common/constants/action-types';
import useAppSelector from 'common/hooks/useAppSelector';
import type { Container } from 'common/types/container';
import { actionWrapper } from 'common/utils/action';
import Button from 'web/components/Button/Button';

import styles from './ContainerGrid.scss';
import type { ContainerTileType } from './ContainerTile';
import ContainerTile from './ContainerTile';

interface ContainerGridProps {
  title?: string;
  containers: Container[];
  className: string;
  tileOrientation?: TileOrientation;
  isPlainTile?: boolean; // a plain container box without posters.
  firstShowCount?: number;
  tileType?: ContainerTileType;
  centerTitle?: boolean;
  categoryName?: string;
}

const messages = defineMessages({
  seeAllButton: {
    description: 'see all containers button',
    defaultMessage: 'See All {currentGroup}',
  },
});

const ContainerGrid: FC<ContainerGridProps> = ({ title, containers, className, tileOrientation, isPlainTile, centerTitle, categoryName, tileType, firstShowCount = 8 }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const isExpanded = useAppSelector(state => !!state.webUI.categoriesPage[`${categoryName}Expanded`]);
  const shouldSeeAllButton = !isExpanded && firstShowCount < containers.length;
  const items = useMemo(
    () =>
      containers.map((container, index) => {
        return (
          <ContainerTile
            invisible={shouldSeeAllButton ? index >= firstShowCount : false}
            key={container.id}
            isPlainTile={isPlainTile}
            centerTitle={centerTitle}
            container={container}
            tileOrientation={tileOrientation}
            tileType={tileType}
          />
        );
      }),
    [centerTitle, containers, firstShowCount, isPlainTile, shouldSeeAllButton, tileOrientation, tileType]
  );

  const handleClickSeeAllButton = useCallback(() => {
    dispatch(actionWrapper(SET_CATEGORIES_EXPANDED, { payload: { [`${categoryName}Expanded`]: true } }));
  }, [categoryName, dispatch]);

  const gridContainerClasses = classNames(styles.gridContainer, {
    [styles.plainTileContainer]: isPlainTile,
  });

  if (!containers.length) return null;

  return (
    <div className={className} data-test-id="web-container-grid">
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={gridContainerClasses}>{items}</div>
      {shouldSeeAllButton ? (
        <div className={styles.seeAllButtonWrapper}>
          <Button onClick={handleClickSeeAllButton} size="normal" color="rgba(150, 153, 163, 0.16)">
            {intl.formatMessage(messages.seeAllButton, { currentGroup: title })}
          </Button>{' '}
        </div>
      ) : null}
    </div>
  );
};

export default memo(ContainerGrid);
