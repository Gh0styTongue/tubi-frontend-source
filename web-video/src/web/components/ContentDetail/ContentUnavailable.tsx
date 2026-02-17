import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './ContentUnavailable.scss';

const messages = defineMessages({
  contentUnavailable: {
    description: 'label for unavailable content',
    defaultMessage: 'content unavailable',
  },
});

const ContentUnavailable = () => {
  const intl = useIntl();
  return (
    <div className={styles.unavailable}>
      <div className={styles.text}>
        {intl.formatMessage(messages.contentUnavailable)}
      </div>
    </div>
  );
};

export default ContentUnavailable;
