import type { TileOrientation, BreakpointProps, ColumnProps } from '@tubitv/web-ui';
import { Grid, useBreakpoint } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useMemo, memo } from 'react';

import { isLinear } from 'client/features/playback/predicates/isLinear';
import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import { shouldHideMetadataSelector } from 'common/selectors/ui';
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
  personalizationId?: string;
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

const bpKeys = ['xs', 'sm', 'sMd', 'md', 'lg', 'xl', 'xxl'];

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

function useFluidGridColumns(breakpoints: BreakpointProps) {
  const bp = useBreakpoint();
  return useMemo(() => {
    let previousCols: ColumnProps = '1';
    const bpKeysMapping = bpKeys.map((key, index, bpKeyList) => {
      const cols = breakpoints[key as keyof typeof breakpoints] ?? breakpoints[bpKeyList[index - 1] as keyof typeof breakpoints] ?? previousCols;
      previousCols = cols;
      return {
        key,
        value: bp[key as keyof typeof bp],
        cols,
      };
    }).reverse();
    const selectedBreakpoint = bpKeysMapping.find(key => key.value);
    if (selectedBreakpoint) {
      if (selectedBreakpoint.cols === '1-5') return 5;
      if (selectedBreakpoint.cols === '1-7') return 7;
      const cols = typeof selectedBreakpoint.cols === 'object' ? selectedBreakpoint.cols.size : selectedBreakpoint.cols;
      const parsedCols = typeof cols === 'string' ? parseInt(cols, 10) : cols;
      if (typeof parsedCols === 'number' && !isNaN(parsedCols)) {
        return 12 / parsedCols;
      }
    }
    return 1;
  }, [bp, breakpoints]);
}

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
  personalizationId,
}) => {
  const location = useLocation();
  const hideMetadata = useAppSelector(state => shouldHideMetadataSelector(state, location.pathname));

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

  const numColumns = useFluidGridColumns(breakpoints || FLUID_GRID_COLS[tileOrientation]);

  const items = useMemo(
    () => {
      return contentIds.map((id, index) => {
        const row = Math.floor(index / numColumns);
        const col = index % numColumns;
        const commonTileProps = {
          fetchPriority: getFetchPriority(index, highFetchPriorityRange),
          id,
          indexInContainer: index,
          lazyLoad: getLazyLoad(index, lazyLoadStartIndex),
          onNavigation: handleTileNavigation,
          preload: getPreload(index, preloadRange),
          tileOrientation,
          hideMetadata,
          personalizationId,
          containerPosition: row,
          colInContainer: col,
          containerId,
        };
        return (
          <Grid.Item {...(breakpoints || FLUID_GRID_COLS[tileOrientation])} key={id} className={gridClass}>
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
      });
    },
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
      gridClass,
      personalizationId,
      numColumns,
    ]
  );

  return (
    <Grid.Container className={className} includeMargin={false}>
      {items}
    </Grid.Container>
  );
};

export default memo(FluidGrid);
