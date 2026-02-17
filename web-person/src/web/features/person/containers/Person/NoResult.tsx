import React from 'react';
import { useIntl } from 'react-intl';

import FeaturedRow from './FeaturedRow';
import styles from './Person.scss';
import messages from './personMessages';

const NoResult = () => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.noResult}>
      <p>{formatMessage(messages.noResult)}</p>
      <FeaturedRow />
    </div>
  );
};

export default NoResult;
