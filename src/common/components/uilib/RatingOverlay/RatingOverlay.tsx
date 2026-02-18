import classNames from 'classnames';
import React, { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import { RatingWithDescriptor } from 'common/components/VideoComponents/VideoComponents';
import { MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE, type TreatmentValue as SimplifyPlayerUIMode } from 'common/experiments/config/ottMajorPlatformsSimplifyPlayerUI';
import { getExperiment } from 'common/experimentV2';
import { webottMajorPlatformsPlayerBranding } from 'common/experimentV2/configs/webottMajorPlatformsPlayerBranding';
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
  simplifyPlayerUIMode?: SimplifyPlayerUIMode;
  showLogoInPlayerExperiment?: boolean;
};

const LEFT_BAR_SLIDE_MILLISECONDS = 500;
const MAIN_CONTAINER_SLIDE_MILLISECONDS = 1000;
const DESCRIPTOR_JOINER = ', ';

const RatingOverlay: React.FunctionComponent<Props> = ({
  active,
  ratings,
  className,
  ratingClassName,
  ratingValueClassName,
  leftBannerClassName,
  ratedClassName,
  descriptorsClassName,
  simplifyPlayerUIMode,
}) => {
  const intl = useIntl();
  const leftBannerNodeRef = useRef<HTMLDivElement>(null);
  const ratingOverlayNodeRef = useRef<HTMLDivElement>(null);
  const simplifyPlayerUIDisableTransition = simplifyPlayerUIMode === MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSITION;

  const statsigExperiment = getExperiment(webottMajorPlatformsPlayerBranding);
  const showLogoInPlayerExperiment = statsigExperiment.get('show_logo_in_player');

  if (!ratings || ratings.length <= 0) return null;

  const ratingBadges = (
    <RatingWithDescriptor
      rating={ratings}
      cls={classNames(styles.rateBlock, styles.rating, ratingClassName)}
      descriptorCls={classNames(ratingValueClassName)}
    />
  );

  // Create transition objects inside the component to avoid shared mutation
  const heightdown = {
    enter: styles.heightDownEnter,
    enterActive: classNames(styles.heightDownEnterActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
    }),
    exit: styles.heightDownLeave,
    exitActive: classNames(styles.heightDownLeaveActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
    }),
  };

  const slidedown = {
    enter: styles.slideDownEnter,
    enterActive: classNames(styles.slideDownEnterActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
    }),
    exit: styles.slideDownLeave,
    exitActive: classNames(styles.slideDownLeaveActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
      [styles.noDelayOnExit]: !showLogoInPlayerExperiment,
    }),
  };

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
          <div className={styles.ratingContainer}>
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
