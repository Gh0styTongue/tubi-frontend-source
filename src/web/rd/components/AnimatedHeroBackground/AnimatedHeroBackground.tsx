import { useRefMap } from '@adrise/utils/lib/useRefMap';
import { EnterExitTransition, HeroBackground } from '@tubitv/web-ui';
import React, { memo } from 'react';
import { TransitionGroup } from 'react-transition-group';

import styles from './AnimatedHeroBackground.scss';

interface Props {
  videoKey?: string;
  backgroundSrc?: string;
  entranceTransition?: string;
  entranceStagger?: number;
  exitTransition?: string;
  exitStagger?: number;
  isFullScreen?: boolean;
  customClass?: string;
}

function AnimatedHeroBackground({ videoKey, backgroundSrc, customClass, entranceTransition, entranceStagger, exitTransition, exitStagger, isFullScreen }: Props) {
  const [getBackgroundRef] = useRefMap<HTMLDivElement | null>(null);

  return (
    <TransitionGroup className={styles.animatedHeroBackground}>
      <EnterExitTransition
        key={videoKey}
        entranceTransition={entranceTransition ?? 'scaleInDown'}
        exitTransition={exitTransition ?? 'scaleOutUp'}
        entranceStagger={entranceStagger ?? 0}
        exitStagger={exitStagger ?? 0}
        nodeRef={getBackgroundRef(videoKey)}
      >
        <div ref={getBackgroundRef(videoKey)} className={styles.background}>
          <HeroBackground
            src={backgroundSrc}
            isFullScreen={isFullScreen}
            customClass={customClass}
          />
        </div>
      </EnterExitTransition>
    </TransitionGroup>
  );
}

export default memo(AnimatedHeroBackground);
