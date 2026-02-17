import Carousel from '@adrise/web-ui/lib/Carousel/Carousel';
import React, { PureComponent } from 'react';

import { CONTAINER_TYPES, LIVE_NEWS_CONTAINER_ID } from 'common/constants/constants';
import { NEWS_TILE_SIZE } from 'common/constants/style-constants';
import { getLazyLoadRootMargin } from 'common/utils/containerTools';
import type { StoreContainerParams, TrackTriggerClickParams } from 'web/components/Containers/Containers';
import { LiveNewsFluidGrid } from 'web/components/FluidGrids';
import LazyItem from 'web/components/LazyItem/LazyItem';

interface TileGroupProps {
  id: string;
  contents: string[];
  displayAs?: 'carousel' | 'grid',
  loadMoreItems?: () => void;
  trackTriggerClick?: (params: TrackTriggerClickParams) => void;
  storeContainerPosition?: (params: StoreContainerParams) => void;
  // trackCb is an analytics event related to an actual tile being clicked
  trackCb: (index: number, id: string) => void;
  containerId?: string;
  overflowHidden?: boolean;
  // useful for situations such as initial in view of current episode in episodes Carousel
  initialIndex?: number
  // custom className for carousel
  carouselClassName?: string;
  // Col size for each Tile
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
  isMobile: boolean;
  type: string;
  idx?: number;
  forwardedRef?: any;
  lazyActive?: boolean;
}

/**
 * Higher order component that returns a Carousel component with a specific Tile
 * @param Tile
 * @param extraProps
 * @constructor
 * @note - the Tile component must set its own aspect ratio, likely using padding-top
 * TileGroup will define the Tile's width using the xs, sm, etc props
 */
export default function TileGroup(Tile: React.FC<TileGroupProps>) {
  const ForwardRefTile = React.forwardRef<HTMLDivElement, TileGroupProps>((props, ref) => {
    return <Tile {...props} forwardedRef={ref} />;
  });
  return class extends PureComponent<TileGroupProps> {
    private startItemIndex: number;

    static defaultProps = {
      displayAs: 'carousel',
      overflowHidden: false,
    };

    constructor(props: TileGroupProps) {
      super(props);
      this.onTriggerClick = this.onTriggerClick.bind(this);
      this.startItemIndex = props.initialIndex || 0;
    }

    onTriggerClick({ itemIndex }: { itemIndex: number }) {
      const { trackTriggerClick, storeContainerPosition, containerId, contents, idx = 0 } = this.props;
      if (trackTriggerClick) trackTriggerClick({ startX: this.startItemIndex, endX: itemIndex, contentId: contents[this.startItemIndex], containerId: containerId ?? '', rowIndex: idx + 1 });
      if (storeContainerPosition) storeContainerPosition({ index: itemIndex, containerId: containerId ?? '' });
      this.startItemIndex = itemIndex;
    }

    render() {
      const {
        carouselClassName, contents, displayAs, initialIndex, loadMoreItems, overflowHidden, trackCb, type, isMobile,
        // grid
        xs, sm, md, lg, xl, xxl,
        // for new design
        // rest props
        ...others
      } = this.props;
      const rootMarginVerticalNumber = getLazyLoadRootMargin(isMobile);

      const tilesComponent = contents.map((id, idx) => {
        const restProps = { ...others, trackCb: trackCb.bind(null, idx, id) };

        const tileSize = { xs, sm, md, lg, xl, xxl };

        return (
          <LazyItem key={id} rootMargin={`${rootMarginVerticalNumber}px 0px`} minVisibilityRatio={0}>
            {({ active, ref }) => (
              <ForwardRefTile
                lazyActive={active}
                ref={ref}
                type={type}
                isMobile={isMobile}
                contents={contents}
                {...tileSize}
                {...restProps}
              />
            )}
          </LazyItem>
        );
      });

      if (displayAs === 'carousel') {
        return (
          <Carousel
            loadMoreItems={loadMoreItems}
            onTriggerClick={this.onTriggerClick}
            noMask={overflowHidden}
            advance={!loadMoreItems}
            initialIndex={initialIndex}
            theme={type === CONTAINER_TYPES.CHANNEL ? 'light' : 'steel-grey'}
            className={carouselClassName}
          >
            {tilesComponent}
          </Carousel>
        );
      }
      const fluidGridProps = {
        containerId: LIVE_NEWS_CONTAINER_ID,
        items: contents,
        trackCb,
        lazy: true,
      };
      return (
        <LiveNewsFluidGrid
          {...this.props}
          {...fluidGridProps}
          {...NEWS_TILE_SIZE}
          idx={this.props.idx ?? 0}
        />
      );
    }
  };
}
