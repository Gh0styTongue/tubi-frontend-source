import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { BreakpointProps, CarouselProps } from '@tubitv/web-ui';
import { Carousel, TilePlaceholder, useInView } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, memo, useState, useEffect } from 'react';
import { defineMessages } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import { relatedContentsPersonalizationIdSelector } from 'common/selectors/video';
import { RELATED_CONTENTS_CONTAINER_ID_IMPRESSION } from 'common/services/ImpressionsManager/ImpressionsManager';
import trackingManager from 'common/services/TrackingManager';
import type { TrackCarouselTriggerParams, SendNavigateWithinPageOptions } from 'common/services/TrackingManager/type';
import { useIntl } from 'i18n/intl';
import { useHeading } from 'web/features/seo/contexts/HeadingContext';
import RefreshFluidGrid from 'web/rd/components/FluidGrid/FluidGrid';
import MovieOrSeriesTile, { type NavigationParams } from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

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
  isNewDesign?: boolean;
  isPlaceholder?: boolean;
}

const PLACEHOLDER_CONTENT_IDS = ['placeholder-1', 'placeholder-2', 'placeholder-3', 'placeholder-4', 'placeholder-5', 'placeholder-6'];

const RelatedContentsRow: FC<RelatedContentsRowProps> = ({ breakpoints, contentId, isVertical, title, contentIds, containerSlug, isNewDesign, isPlaceholder }) => {
  const { formatMessage } = useIntl();
  const { headingLevel } = useHeading();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { refCallback, isInView } = useInView();
  const personalizationId = useAppSelector(state => relatedContentsPersonalizationIdSelector(state, contentId));

  const handleNavigation = useCallback(({ index, contentId }: NavigationParams) => {
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug,
      contentId,
      componentType: ANALYTICS_COMPONENTS.relatedComponent,
    });
  }, [containerSlug]);

  const trackCarouselEvent = useCallback(({ startX, endX, meansOfNavigation }: Pick<TrackCarouselTriggerParams, 'startX' | 'endX' | 'meansOfNavigation'>, options?: SendNavigateWithinPageOptions) => {
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
        trackCarouselEvent({
          startX: prevIndex,
          endX: itemIndex,
        });
        return itemIndex;
      });
    },
    [trackCarouselEvent]
  );

  const renderItem = useCallback(
    (id: string, index: number) => {
      if (isPlaceholder) {
        return <TilePlaceholder />;
      }

      return (
        <MovieOrSeriesTile
          id={id}
          containerId={RELATED_CONTENTS_CONTAINER_ID_IMPRESSION}
          // @note It is unclear whether we need both indexInContainer, colInContainer, or both. Passing both. If you know, please add comments to the props.
          indexInContainer={index}
          colInContainer={index}
          containerPosition={0}
          tileOrientation="portrait"
          showProgress
          onNavigation={handleNavigation}
          hideMetadata={isNewDesign}
          previewDisabled={isNewDesign}
          personalizationId={personalizationId}
        />
      );
    },
    [handleNavigation, isNewDesign, isPlaceholder, personalizationId]
  );

  useEffect(() => {
    // when content row is visible to user, send analytics events with `horizontal_location: 1`
    // we don't want debounce for the first event, as multiple rows may appear together
    if (isInView) {
      trackCarouselEvent({
        startX: 0,
        endX: 0,
        meansOfNavigation: 'SCROLL',
      }, { debounce: false });
    }
  }, [isInView, trackCarouselEvent]);

  useEffect(() => {
    if (isNewDesign) {
      setCarouselIndex(0);
    }
  }, [contentId, isNewDesign]);

  const Heading = headingLevel;
  const carouselProps = {
    showItemOverflow: isNewDesign,
    containerClassName: styles.container,
    prevNextClassName: styles.prevNext,
    shouldAlwaysShowIcons: isNewDesign,
  };

  if (isPlaceholder) {
    return (
      <div key={contentId} className={classnames(styles.row, { [styles.newDesign]: isNewDesign })}>
        <Heading className={styles.title}>{title || formatMessage(messages.youMayAlsoLike)}</Heading>
        <div ref={refCallback}>
          <Carousel<string>
            className={styles.carousel}
            data={PLACEHOLDER_CONTENT_IDS}
            renderItem={renderItem}
            adjustPrevNextForContentTile={!isNewDesign}
            breakpoints={breakpoints}
            isPlaceholder
            {...carouselProps}
          />
        </div>
      </div>
    );
  }

  /* istanbul ignore next */
  if (!contentIds.length) {
    return null;
  }

  return (
    <div key={contentId} className={classnames(styles.row, { [styles.newDesign]: isNewDesign })}>
      <Heading className={styles.title}>{title || formatMessage(messages.youMayAlsoLike)}</Heading>
      {isVertical ? (
        <RefreshFluidGrid contentIds={contentIds} breakpoints={breakpoints} className={styles.fluidGrid} />
      ) : (
        <div ref={refCallback}>
          <Carousel<string>
            index={carouselIndex}
            onIndexChange={onIndexChange}
            className={styles.carousel}
            data={contentIds}
            renderItem={renderItem}
            adjustPrevNextForContentTile={!isNewDesign}
            breakpoints={breakpoints}
            {...carouselProps}
          />
        </div>
      )}
    </div>
  );
};

export default memo(RelatedContentsRow);
