import classNames from 'classnames';
import React, { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import { RatingWithDescriptor } from 'common/components/VideoComponents/VideoComponents';
import type { VideoRating } from 'common/types/video';

import styles from './RatingOverlay.scss';

const messages = defineMessages({
  rated: {
    description: 'rated, as in "Rated PG-13"',
    defaultMessage: 'Rated',
  },
});

type Props = {
  active?: boolean;
  ratings?: VideoRating[];
  className?: string;
  ratingClassName?: string;
  ratingValueClassName?: string;
  leftBannerClassName?: string;
  ratedClassName?: string;
  descriptorsClassName?: string;
};

const LEFT_BAR_SLIDE_MILLISECONDS = 500;
const MAIN_CONTAINER_SLIDE_MILLISECONDS = 1000;
const DESCRIPTOR_JOINER = ', ';
const slidedown = {
  enter: styles.slideDownEnter,
  enterActive: styles.slideDownEnterActive,
  exit: styles.slideDownLeave,
  exitActive: styles.slideDownLeaveActive,
};
const heightdown = {
  enter: styles.heightDownEnter,
  enterActive: styles.heightDownEnterActive,
  exit: styles.heightDownLeave,
  exitActive: styles.heightDownLeaveActive,
};
const RatingOverlay: React.FunctionComponent<Props> = ({
  active,
  ratings,
  className,
  ratingClassName,
  ratingValueClassName,
  leftBannerClassName,
  ratedClassName,
  descriptorsClassName,
}) => {
  const intl = useIntl();
  const leftBannerNodeRef = useRef<HTMLDivElement>(null);
  const ratingOverlayNodeRef = useRef<HTMLDivElement>(null);

  if (!ratings || ratings.length <= 0) return null;

  const ratingBadges = (
    <RatingWithDescriptor
      rating={ratings}
      cls={classNames(styles.rateBlock, styles.rating, ratingClassName)}
      descriptorCls={classNames(ratingValueClassName)}
    />
  );

  const descriptorsText = ratings[0].descriptors?.map(descriptor => descriptor.description).join(DESCRIPTOR_JOINER);

  return (
    <div className={classNames(styles.ratingOverlay, className)}>
      <CSSTransition
        in={active}
        key="leftBanner"
        timeout={LEFT_BAR_SLIDE_MILLISECONDS}
        classNames={heightdown}
        unmountOnExit
        nodeRef={leftBannerNodeRef}
      >
        <div
          ref={leftBannerNodeRef}
          className={classNames(styles.leftBanner, leftBannerClassName)}
        />
      </CSSTransition>

      <CSSTransition
        in={active}
        timeout={MAIN_CONTAINER_SLIDE_MILLISECONDS}
        classNames={slidedown}
        unmountOnExit
        nodeRef={ratingOverlayNodeRef}
      >
        <div
          ref={ratingOverlayNodeRef}
          data-test-id="ratingOverlay"
          data-active={active}
        >
          <div>
            <div className={classNames(styles.rateBlock, styles.rated, ratedClassName)}>{intl.formatMessage(messages.rated)}</div>
            {ratingBadges}
          </div>
          {descriptorsText ? <div className={classNames(styles.descriptors, descriptorsClassName)}>{descriptorsText}</div> : null}
        </div>
      </CSSTransition>
    </div>
  );
};

export default RatingOverlay;
