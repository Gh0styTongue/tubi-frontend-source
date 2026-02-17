import { Mute, VolumeUp } from '@tubitv/icons';
import { IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import InputRange from 'web/components/InputRange/InputRange';

import styles from './Volume.scss';

interface VolumeProps {
  id: string;
  onClick?: (e: React.MouseEvent) => void;
  customClass?: string;
  iconClass?: string;
  show: boolean;
  min: number;
  max: number;
  value: number;
  onChanging?: (value: number) => void;
  onChanged?: (value: number) => void;
  onMouseEnter?: React.HTMLAttributes<HTMLSpanElement>['onMouseEnter'];
  onMouseLeave?: React.HTMLAttributes<HTMLSpanElement>['onMouseLeave'];
  isMuted?: boolean;
  isLive?: boolean;
  isEPG?: boolean;
}

const fadeInTransition = {
  enter: styles.fadeEnter,
  enterActive: styles.fadeEnterActive,
  exit: styles.fadeLeave,
  exitActive: styles.fadeLeaveActive,
};

const Volume = ({
  id,
  onClick,
  customClass,
  iconClass,
  show,
  min,
  max,
  value,
  onChanging,
  onChanged,
  onMouseEnter,
  onMouseLeave,
  isMuted,
  isLive,
  isEPG,
}: VolumeProps) => {
  const volumeRangeRef = useRef<HTMLDivElement>(null);

  const volumeContainerClass = classNames(styles.volumeContainer, customClass, { [styles.isEPG]: isEPG, [styles.isLive]: isLive });
  const volumeBarClassname = classNames(styles.volumeRange);

  return (
    <span id={id} className={volumeContainerClass} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <IconButton
        data-test-id={id}
        icon={isMuted ? <Mute className={iconClass} /> : <VolumeUp className={iconClass} />}
        onClick={onClick}
      />
      {show ? (
        <CSSTransition key="volumeRange" classNames={fadeInTransition} timeout={300} nodeRef={volumeRangeRef.current}>
          <div ref={volumeRangeRef} className={volumeBarClassname}>
            <InputRange
              min={min}
              max={max}
              value={value}
              onChanging={onChanging}
              onChanged={onChanged}
              isLive={isEPG}
            />
          </div>
        </CSSTransition>
      ) : null}
    </span>
  );
};

export default Volume;
