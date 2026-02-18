import { Button } from '@tubitv/web-ui';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from './ResponsiveContent.scss';
import messages from '../brandingMessages';

const ResponsiveContent = () => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <Link to={WEB_ROUTES.home}>
          <Button className={styles.button}>{formatMessage(messages.startExploring)}</Button>
        </Link>
      </div>

      <div className={styles.imgWrapper}>
        <div className={styles.img} />
      </div>
    </div>
  );
};

export default ResponsiveContent;
