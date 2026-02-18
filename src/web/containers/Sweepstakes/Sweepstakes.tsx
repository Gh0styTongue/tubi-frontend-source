import React from 'react';
import { useIntl } from 'react-intl';

import Footer from 'web/components/Footer/Footer';

import messages from './messages';
import styles from './Sweepstakes.scss';

const Sweepstakes = () => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.baner}>
          <div className={styles.image}>
            <div className={styles.mugs} />
          </div>
          <div className={styles.main}>
            <div className={styles.title}>{formatMessage(messages.title)}</div>
            <div className={styles.description}>{formatMessage(messages.description)}</div>
          </div>
        </div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default Sweepstakes;
