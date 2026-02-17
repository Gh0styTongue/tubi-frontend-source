import { Row } from '@tubitv/web-ui';
import React, { Component } from 'react';

import { HISTORY_CONTAINER_ID } from 'common/constants/constants';
import { getLazyLoadRootMargin } from 'common/utils/containerTools';
import LazyItem from 'web/components/LazyItem/LazyItem';

import styles from './FluidGrid.scss';

interface TileProps {
  hostCls?: string;
  id: string;
  trackCb: (index: number, id: string) => void | VoidFunction;
  showProgress?: boolean;
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
  lazyActive?: boolean;
  showPlayButton?: boolean;
  className?: string;
  idx?: number;
}

interface OwnProps extends TileProps {
  items: string[];
  lazy: boolean;
  contentsMap: { [key: string]: any };
  containerId: string;
  isMobile: boolean;
}

function idIndex(id: string, index: number): string {
  return `${id}_${index}`;
}

function itemsArraysAreEqual(itemsA: string[], itemsB: string[]) {
  // since they are just string arrays, it should be safe to just join them together as a string to compare
  return itemsA.join(',') === itemsB.join(',');
}

function getFluidGrid(Tile: React.FC<TileProps>) {
  const ForwardedRefTile = React.forwardRef<HTMLDivElement, TileProps>((props, ref) => {
    return <Tile {...props} ref={ref} />;
  });
  return class extends Component<OwnProps> {
    static defaultProps = {
      lazy: true,
      contentsMap: {},
      trackCb: null,
    };

    private trackingCallbacks: { [key: string]: (index: number, id: string) => void };

    constructor(props: OwnProps) {
      super(props);

      this.trackingCallbacks = {};
    }

    componentDidMount() {
      this._createTrackingCallbacks();
    }

    componentDidUpdate(prevProps: OwnProps) {
      if (!itemsArraysAreEqual(prevProps.items, this.props.items)) {
        this._createTrackingCallbacks();
      }
    }

    _createTrackingCallbacks() {
      const { trackCb } = this.props;
      this.trackingCallbacks = this.props.items.reduce((callbacks, id, idx) => {
        callbacks[idIndex(id, idx)] = trackCb ? trackCb.bind(null, idx, id) : null;
        return callbacks;
      }, {});
    }

    render() {
      const { className, items, lazy, containerId, xs, sm, md, lg, xl, xxl, isMobile, idx: index } = this.props;
      const rootMarginVerticalNumber = getLazyLoadRootMargin(isMobile);
      return (
        <Row className={className}>
          {
            items.map((id, idx) => {
              const tileProps = {
                key: id,
                hostCls: styles.tile,
                id,
                trackCb: this.trackingCallbacks[idIndex(id, idx)],
                showProgress: containerId === HISTORY_CONTAINER_ID,
                xs,
                sm,
                md,
                lg,
                xl,
                xxl,
              };
              return (
                <LazyItem rootMargin={`${rootMarginVerticalNumber}px 0px`} lazy={lazy} key={id}>
                  {({ active, ref }) => (
                    <ForwardedRefTile {...tileProps} lazyActive={active} ref={ref} idx={index} />
                  )}
                </LazyItem>
              );
            })
          }
        </Row>
      );
    }
  };
}

export default getFluidGrid;
