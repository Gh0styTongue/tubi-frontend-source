import { Mute, VolumeUp } from '@tubitv/icons';
import { IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import InputRange from 'web/components/InputRange/InputRange';

import styles from './Volume.scss';

const messages = defineMessages({
  volume: {
    id: 'volume.volume',
    defaultMessage: 'Volume {volume} percent',
    description: 'Volume level announcement for screen readers',
  },
  muted: {
    id: 'volume.muted',
    defaultMessage: 'Muted',
    description: 'Muted state announcement for screen readers',
  },
  volumeButton: {
    id: 'volume.volumeButton',
    defaultMessage: 'Volume {volume} percent',
    description: 'Volume button label for screen readers',
  },
  mutedButton: {
    id: 'volume.mutedButton',
    defaultMessage: 'Muted',
    description: 'Muted volume button label for screen readers',
  },
});

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
  isMiniPlayer?: boolean;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom';
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
  isMiniPlayer,
  tooltip,
  tooltipPlacement,
}: VolumeProps) => {
  const intl = useIntl();
  const volumeRangeRef = useRef<HTMLDivElement>(null);

  const volumeContainerClass = classNames(styles.volumeContainer, customClass, { [styles.isMiniPlayer]: isMiniPlayer, [styles.isLive]: isLive });
  const volumeBarClassname = classNames(styles.volumeRange);

  const volumeAriaLabel = intl.formatMessage(messages.volumeButton, { volume: value });
  const mutedAriaLabel = intl.formatMessage(messages.mutedButton);
  const volumeAnnouncement = intl.formatMessage(messages.volume, { volume: value });
  const mutedAnnouncement = intl.formatMessage(messages.muted);

  return (
    <span id={id} className={volumeContainerClass} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <IconButton
        data-test-id={id}
        icon={isMuted ? <Mute className={iconClass} /> : <VolumeUp className={iconClass} />}
        onClick={onClick}
        tooltip={tooltip}
        tooltipPlacement={tooltipPlacement}
        aria-label={isMuted ? mutedAriaLabel : volumeAriaLabel}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
        role="status"
      >
        {isMuted ? mutedAnnouncement : volumeAnnouncement}
      </div>

      {show ? (
        <CSSTransition key="volumeRange" classNames={fadeInTransition} timeout={300} nodeRef={volumeRangeRef.current}>
          <div ref={volumeRangeRef} className={volumeBarClassname}>
            <InputRange
              min={min}
              max={max}
              value={value}
              onChanging={onChanging}
              onChanged={onChanged}
              isMiniPlayer={isMiniPlayer}
            />
          </div>
        </CSSTransition>
      ) : null}
    </span>
  );
};

export default Volume;
