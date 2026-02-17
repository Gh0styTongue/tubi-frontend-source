import classNames from 'classnames';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import styles from './TitleDisplay.scss';

type Props = {
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
  title?: string;
  titleClassName?: string;
  ratingOverlay?: ReactElement | null;
  showTitle?: boolean;
  fadeDownDuration?: number;
};

const DEFAULT_TITLE_FADEDOWN_DURATION = 800; // ms
const titleFadeDown = {
  enter: styles.titleFadeDownEnter,
  enterActive: styles.titleFadeDownEnterActive,
  exit: styles.titleFadeDownLeave,
  exitActive: styles.titleFadeDownLeaveActive,
};

const TitleDisplay: React.FunctionComponent<Props> = (props) => {
  const { className, subtitle, subtitleClassName, title, titleClassName, ratingOverlay, showTitle, fadeDownDuration = DEFAULT_TITLE_FADEDOWN_DURATION } = props;
  const ref = useRef<HTMLDivElement>(null);

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
      <CSSTransition
        in={showTitle}
        timeout={fadeDownDuration}
        classNames={titleFadeDown}
        unmountOnExit
        nodeRef={ref}
      >
        <div ref={ref} className={styles.wrapper}>{titleContent}</div>
      </CSSTransition>
      {ratingOverlay || null}
    </div>
  );
};

export default TitleDisplay;
