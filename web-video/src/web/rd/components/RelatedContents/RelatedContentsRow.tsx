import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { BreakpointProps, CarouselProps } from '@tubitv/web-ui';
import { Carousel, useInView } from '@tubitv/web-ui';
import type { FC } from 'react';
import React, { useCallback, memo, useState, useEffect } from 'react';
import { defineMessages } from 'react-intl';

import trackingManager from 'common/services/TrackingManager';
import type { TrackCarouselTriggerParams, SendNavigateWithinPageOptions } from 'common/services/TrackingManager/type';
import { useIntl } from 'i18n/intl';
import RefreshFluidGrid from 'web/rd/components/FluidGrid/FluidGrid';
import type { NavigationParams } from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';
import MovieOrSeriesTile from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

import styles from './RelatedContents.scss';

export const messages = defineMessages({
  youMayAlsoLike: {
    description: 'you may also like heading',
    defaultMessage: 'You May Also Like',
  },
  addToMyList: {
    description: 'Add to My List button label',
    defaultMessage: 'Add to My List',
  },
  removeFromMyList: {
    description: 'Remove from My List button label',
    defaultMessage: 'Remove from My List',
  },
});

export interface RelatedContentsRowProps {
  breakpoints?: BreakpointProps,
  contentId: string;
  contentIds: string[];
  isVertical?: boolean;
  title?: string;
  limit?: number;
  containerSlug: string;
}

const RelatedContentsRow: FC<RelatedContentsRowProps> = ({ breakpoints, contentId, isVertical, title, contentIds, containerSlug }) => {
  const intl = useIntl();

  const [carouselIndex, setCarouselIndex] = useState(0);

  const { refCallback, isInView } = useInView();

  const handleNavigation = useCallback(({ index, contentId }: NavigationParams) => {
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug,
      contentId,
      componentType: ANALYTICS_COMPONENTS.relatedComponent,
    });
  }, [containerSlug]);

  const trackCarouseEvent = useCallback(({ startX, endX, meansOfNavigation }: Pick<TrackCarouselTriggerParams, 'startX' | 'endX' | 'meansOfNavigation'>, options?: SendNavigateWithinPageOptions) => {
    trackingManager.trackCarouselTrigger({
      startX,
      endX,
      contentId,
      slug: containerSlug,
      componentType: ANALYTICS_COMPONENTS.relatedComponent,
      meansOfNavigation,
    }, options);
  }, [contentId, containerSlug]);

  const onIndexChange = useCallback<NonNullable<CarouselProps<string>['onIndexChange']>>(
    ({ itemIndex }) => {
      setCarouselIndex((prevIndex) => {
        trackCarouseEvent({
          startX: prevIndex,
          endX: itemIndex,
        });
        return itemIndex;
      });
    },
    [trackCarouseEvent]
  );

  const renderItem = useCallback(
    (id: string, index: number) => (
      <MovieOrSeriesTile
        id={id}
        indexInContainer={index}
        tileOrientation="portrait"
        showProgress
        onNavigation={handleNavigation}
      />
    ),
    [handleNavigation]
  );

  useEffect(() => {
    // when content row is visible to user, send analytics events with `horizontal_location: 1`
    // we don't want debounce for the first event, as multiple rows may appear together
    if (isInView) {
      trackCarouseEvent({
        startX: 0,
        endX: 0,
        meansOfNavigation: 'SCROLL',
      }, { debounce: false });
    }
  }, [isInView, trackCarouseEvent]);

  /* istanbul ignore next */
  if (!contentIds.length) {
    return null;
  }

  return (
    <div className={styles.row}>
      <h2 className={styles.title}>{title || intl.formatMessage(messages.youMayAlsoLike)}</h2>
      {isVertical ? (
        <RefreshFluidGrid contentIds={contentIds} breakpoints={breakpoints} />
      ) : (
        <div ref={refCallback}>
          <Carousel<string>
            index={carouselIndex}
            onIndexChange={onIndexChange}
            className={styles.carousel}
            data={contentIds}
            renderItem={renderItem}
            adjustPrevNextForContentTile
            breakpoints={breakpoints}
          />
        </div>
      )}
    </div>
  );
};

export default memo(RelatedContentsRow);
