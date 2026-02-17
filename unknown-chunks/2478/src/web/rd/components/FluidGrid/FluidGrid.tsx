import type { TileOrientation, BreakpointProps } from '@tubitv/web-ui';
import { Grid } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useMemo, memo } from 'react';

import { isLinear } from 'client/features/playback/predicates/isLinear';
import WebSmallerPosters, { WEB_SMALLER_POSTER_VALUE } from 'common/experiments/config/webSmallerPosters';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { viewportTypeSelector } from 'common/selectors/ui';
import LinearTile from 'web/rd/containers/LinearTile/LinearTile';
import MovieOrSeriesTile from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

import styles from './FluidGrid.scss';

interface Props {
  breakpoints?: BreakpointProps;
  className?: string;
  containerId?: string;
  contentIds: string[];
  highFetchPriorityRange?: [number, number];
  preloadRange?: [number, number];
  lazyLoadStartIndex?: number;
  showProgress?: boolean;
  tileOrientation?: TileOrientation;
  trackCb?: (index: number, contentId: string) => void;
  isLikedSelectableTile?: boolean;
  handleLikeClick?: (contentId: string | undefined, liked: boolean) => void;
  hideMetadata?: boolean;
}

const FLUID_GRID_COLS: Record<string, BreakpointProps> = {
  landscape: {
    xs: '6',
    xxl: '4',
  },
  portrait: {
    xs: '4',
    lg: '3',
    xl: '1-5',
    xxl: '2',
  },
} as const;

const SMALLER_FLUID_GRID_COLS: Record<string, BreakpointProps> = {
  landscape: {
    xs: '6',
    xxl: '1-5',
  },
  portrait: {
    xs: '4',
    lg: '1-5',
    xl: '2',
    xxl: '1-7',
  },
} as const;

export const getFetchPriority = (index: number, highFetchPriorityRange?: [number, number]) => {
  if (highFetchPriorityRange && index >= highFetchPriorityRange[0] && index <= highFetchPriorityRange[1]) {
    return 'high' as const;
  }
};

export const getLazyLoad = (index: number, lazyLoadStartIndex?: number) =>
  lazyLoadStartIndex === undefined ? false : index >= lazyLoadStartIndex;

export const getPreload = (index: number, preloadRange?: [number, number]) => {
  if (preloadRange && index >= preloadRange[0] && index <= preloadRange[1]) {
    return true;
  }
};

const FluidGrid: FC<Props> = ({
  breakpoints,
  className,
  containerId,
  contentIds,
  highFetchPriorityRange,
  lazyLoadStartIndex,
  preloadRange,
  showProgress = false,
  tileOrientation = 'portrait',
  trackCb,
  isLikedSelectableTile,
  handleLikeClick,
}) => {
  const viewportType = useAppSelector(viewportTypeSelector);
  const isDesktop = viewportType === 'desktop';
  const webSmallerPosters = useExperiment(WebSmallerPosters);
  const hideMetadata = isDesktop && webSmallerPosters.getValue() !== WEB_SMALLER_POSTER_VALUE.CONTROL;
  const isSmallerPosters = isDesktop && webSmallerPosters.getValue() === WEB_SMALLER_POSTER_VALUE.NO_DIVIDERS_7_POSTERS;
  const gridCols = isSmallerPosters ? /* istanbul ignore next */ SMALLER_FLUID_GRID_COLS : FLUID_GRID_COLS;

  const handleTileNavigation = useCallback(
    ({ contentId, index }: { contentId: string; index: number }) => {
      trackCb?.(index, contentId);
    },
    [trackCb]
  );

  const contents = useAppSelector((state) => state.video.byId);

  const gridClass = classNames(styles.gridItem, {
    [styles.noMetadata]: hideMetadata,
  });

  const items = useMemo(
    () =>
      contentIds.map((id, index) => {
        const commonTileProps = {
          fetchPriority: getFetchPriority(index, highFetchPriorityRange),
          id,
          indexInContainer: index,
          lazyLoad: getLazyLoad(index, lazyLoadStartIndex),
          onNavigation: handleTileNavigation,
          preload: getPreload(index, preloadRange),
          tileOrientation,
          hideMetadata,
        };

        return (
          <Grid.Item {...(breakpoints || gridCols[tileOrientation])} key={id} className={gridClass}>
            {isLinear(contents[id]) ? (
              <LinearTile {...commonTileProps} showLiveBadge />
            ) : (
              <MovieOrSeriesTile
                isLikedSelectableTile={isLikedSelectableTile}
                handleLikeClick={handleLikeClick}
                {...commonTileProps}
                showProgress={showProgress}
                containerId={containerId}
              />
            )}
          </Grid.Item>
        );
      }),
    [
      breakpoints,
      containerId,
      contentIds,
      contents,
      handleTileNavigation,
      highFetchPriorityRange,
      lazyLoadStartIndex,
      preloadRange,
      showProgress,
      tileOrientation,
      isLikedSelectableTile,
      handleLikeClick,
      hideMetadata,
      gridCols,
      gridClass,
    ]
  );

  return (
    <Grid.Container className={className} includeMargin={false}>
      {items}
    </Grid.Container>
  );
};

export default memo(FluidGrid);
