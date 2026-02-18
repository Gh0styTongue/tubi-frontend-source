import type { BreakpointProps } from '@tubitv/web-ui';
import { Carousel, RowHeader } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { useCallback, useState } from 'react';

import { ANALYTICS_COMPONENTS } from 'common/constants/constants';
import trackingManager from 'common/services/TrackingManager';

import styles from '../containers/CreatorLanding/CreatorLanding.scss';

interface CreatorRowProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number, trackClick: (contentId: string) => void, isFirstRow: boolean) => React.ReactNode;
  showChevron?: boolean;
  headerUrl?: string;
  onHeaderClick?: () => void;
  breakpoints?: BreakpointProps;
  containerSlug?: string;
  indexInContainer?: number;
  isFirstRow?: boolean;
  titleLineClamp?: number;
}

function CreatorRow<T extends { id: string }>({
  title,
  data,
  renderItem,
  showChevron = false,
  headerUrl,
  onHeaderClick,
  breakpoints,
  containerSlug,
  indexInContainer,
  isFirstRow = false,
  titleLineClamp,
}: CreatorRowProps<T>) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const onIndexChange = useCallback(({ itemIndex }: { colsPerPage: number; pageIndex: number; itemIndex: number }) => {
    setCarouselIndex(itemIndex);
  }, []);

  const createTrackClick = useCallback((itemIndex: number) => (contentId: string) => {
    if (containerSlug !== undefined && indexInContainer !== undefined) {
      trackingManager.createNavigateToPageComponent({
        startX: itemIndex,
        startY: indexInContainer,
        containerSlug,
        contentId,
        componentType: ANALYTICS_COMPONENTS.containerComponent,
      });
    }
  }, [containerSlug, indexInContainer]);

  const handleRenderItem = useCallback((item: T, itemIndex: number) => {
    return renderItem(item, itemIndex, createTrackClick(itemIndex), isFirstRow);
  }, [renderItem, createTrackClick, isFirstRow]);

  return (
    <div className={styles.creatorRow}>
      <RowHeader
        href={showChevron ? headerUrl : undefined}
        onLinkClick={onHeaderClick}
        titleLineClamp={titleLineClamp}
      >
        {title}
      </RowHeader>
      <Carousel<T>
        index={carouselIndex}
        onIndexChange={onIndexChange}
        data={data}
        renderItem={handleRenderItem}
        breakpoints={breakpoints}
        prevNextClassName={classnames(styles.prevNext, { [styles.noDescription]: carouselIndex === 0 })}
      />
    </div>
  );
}

export default CreatorRow;
