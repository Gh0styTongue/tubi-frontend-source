import { TilePlaceholder } from '@tubitv/web-ui';
import React, { memo } from 'react';

import styles from './ContentDetailSkeleton.scss';

export interface ContentDetailSkeletonProps {
  className?: string;
  _isMobileRedesign?: boolean;
}

const ContentDetailSkeleton = memo(({ className, _isMobileRedesign }: ContentDetailSkeletonProps) => {
  return (
    <div className={className}>
      <div className={styles.contentDetailSkeleton}>
        <div className={styles.mainContent}>
          <div className={styles.posterArea}>
            <TilePlaceholder tileOrientation="portrait" />
          </div>

          <div className={styles.contentInfo}>
            <div>
              <div style={{ height: '1.2em', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '40ch' }} />
            </div>

            <div>
              <div style={{ height: '1.2em', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '25ch' }} />
            </div>

            <div>
              <div style={{ height: '1.2em', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '100%', marginBottom: '0.5em' }} />
              <div style={{ height: '1.2em', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '80%', marginBottom: '0.5em' }} />
              <div style={{ height: '1.2em', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '60%' }} />
            </div>

            <div className={styles.buttonGroup}>
              <div style={{ width: '120px', height: '48px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <div style={{ width: '100px', height: '48px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ContentDetailSkeleton.displayName = 'ContentDetailSkeleton';

export default ContentDetailSkeleton;
