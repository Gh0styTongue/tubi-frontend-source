import { IconButton } from '@tubitv/web-ui';
import React from 'react';

import Volume from 'web/features/playback/components/Volume/Volume';
import styles from 'web/features/playback/components/WebPlayerOverlay/WebPlayerOverlay.scss';

interface ButtonConfig {
  id: string;
  key: string;
  icon?: JSX.Element;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  volumeConfig?: {
    show: boolean;
    min: number;
    max: number;
    value: number;
    isMuted: boolean;
    onChanging: (value: number) => void;
    onChanged: (value: number) => void;
    onMouseEnter: React.HTMLAttributes<HTMLSpanElement>['onMouseEnter'];
    onMouseLeave: React.HTMLAttributes<HTMLSpanElement>['onMouseLeave'];
  },
  tooltip?: string;
}

export const PlaybackButton = React.memo((config: ButtonConfig) => {
  const {
    id,
    icon,
    onClick,
    className,
    volumeConfig,
    tooltip,
  } = config;

  if (volumeConfig) {
    return (
      <Volume
        id={id}
        onClick={onClick}
        customClass={className}
        iconClass={styles.icon}
        {...volumeConfig}
      />
    );
  }

  return (
    <span className={className}>
      <IconButton
        data-test-id={id}
        icon={icon}
        tooltip={tooltip}
        onClick={onClick}
      />
    </span>
  );
});

