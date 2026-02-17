import React from 'react';
import type { ReactNode } from 'react';

import Footer from 'web/components/Footer/Footer';

import styles from './HeroContainer.scss';

const HeroContainer = ({ children }: { children: ReactNode }) => (
  <div>
    <div>
      <div className={styles.topWrapper} />
      <div className={styles.contentWrapper}>
        {children}
      </div>
    </div>
    <Footer />
  </div>
);

export default HeroContainer;
