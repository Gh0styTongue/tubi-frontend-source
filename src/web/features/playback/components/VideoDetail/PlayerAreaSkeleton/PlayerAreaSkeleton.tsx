import React, { memo } from 'react';

import styles from './PlayerAreaSkeleton.scss';

export interface PlayerAreaSkeletonProps {
  className?: string;
}

const PlayerAreaSkeleton = memo(({ className: _className }: PlayerAreaSkeletonProps) => {

  return (
    <section className={styles.playerArea}>
      <div className={styles.playerPlaceholder}>
        <div className={styles.playIconPlaceholder}>
          <div className={styles.playIcon} />
        </div>
      </div>
    </section>
  );
});

PlayerAreaSkeleton.displayName = 'PlayerAreaSkeleton';

export default PlayerAreaSkeleton;
