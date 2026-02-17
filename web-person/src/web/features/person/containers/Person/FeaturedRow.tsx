import { Carousel } from '@tubitv/web-ui';
import type { CarouselProps } from '@tubitv/web-ui';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import { shouldHideMetadataSelector } from 'common/selectors/ui';
import { featuredContentIdsSelector } from 'web/features/person/selectors/person';
import MovieOrSeriesTile from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

import styles from './Person.scss';
import messages from './personMessages';

const FeaturedRow = () => {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const contentIds = useAppSelector(state => featuredContentIdsSelector(state, { pathname: location.pathname }));
  const [carouselIndex, setCarouselIndex] = useState(0);
  const hideMetadata = useAppSelector(state => shouldHideMetadataSelector(state, location.pathname));
  const tileOrientation = 'portrait';

  const renderItem = (id: string, index: number) => (
    <MovieOrSeriesTile id={id} indexInContainer={index} tileOrientation={tileOrientation} showProgress hideMetadata={hideMetadata} />
  );

  /* istanbul ignore next */
  const onIndexChange: CarouselProps<string>['onIndexChange'] = ({ itemIndex }) => {
    setCarouselIndex(itemIndex);
  };

  return (
    <div className={styles.section}>
      <h2>{formatMessage(messages.featuredTitle)}</h2>
      <Carousel<string>
        index={carouselIndex}
        onIndexChange={onIndexChange}
        data={contentIds}
        renderItem={renderItem}
        adjustPrevNextForContentTile
        tileOrientation={tileOrientation}
      />
    </div>
  );
};

export default FeaturedRow;
