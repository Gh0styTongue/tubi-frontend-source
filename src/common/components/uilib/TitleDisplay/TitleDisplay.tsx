import classNames from 'classnames';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import { MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE, type TreatmentValue as SimplifyPlayerUIMode } from 'common/experiments/config/ottMajorPlatformsSimplifyPlayerUI';

import styles from './TitleDisplay.scss';

type Props = {
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
  title?: string;
  titleClassName?: string;
  ratingOverlay?: ReactElement | null;
  logoOverlay?: ReactElement | null;
  showTitle?: boolean;
  simplifyPlayerUIMode?: SimplifyPlayerUIMode;
};

const DEFAULT_TITLE_FADEDOWN_DURATION = 800; // ms

const TitleDisplay: React.FunctionComponent<Props> = (props) => {
  const { className, subtitle, subtitleClassName, title, titleClassName, ratingOverlay, logoOverlay, showTitle, simplifyPlayerUIMode } = props;
  const ref = useRef<HTMLDivElement>(null);
  const simplifyPlayerUIDisableTransition = simplifyPlayerUIMode === MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSITION;

  const titleFadeDown = {
    enter: styles.titleFadeDownEnter,
    enterActive: classNames(styles.titleFadeDownEnterActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
    }),
    exit: styles.titleFadeDownLeave,
    exitActive: classNames(styles.titleFadeDownLeaveActive, {
      [styles.enableTransition]: !simplifyPlayerUIDisableTransition,
    }),
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const titleContent = (
    <div className={styles.titleColumn}>
      <div data-test-id="title-display-title" className={classNames(styles.title, titleClassName)}>
        {title}
      </div>
      {subtitle ? <div className={classNames(styles.subtitle, subtitleClassName)}>{subtitle}</div> : null}
    </div>
  );

  return (
    <div
      data-test-id="common-component-title-display"
      className={classNames(styles.main, className)}
      onClick={handleClick}
    >
      <div className={styles.overlayContainer}>
        <div className={styles.titleRatingStack}>
          <div className={styles.wrapper}>{ratingOverlay || null}</div>
          <CSSTransition
            in={showTitle}
            timeout={DEFAULT_TITLE_FADEDOWN_DURATION}
            classNames={titleFadeDown}
            unmountOnExit
            nodeRef={ref}
          >
            <div ref={ref} className={styles.wrapper}>{titleContent}</div>
          </CSSTransition>
        </div>
        {logoOverlay || null}
      </div>
    </div>
  );
};

export default TitleDisplay;
