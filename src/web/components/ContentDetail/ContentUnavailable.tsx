import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './ContentUnavailable.scss';

const messages = defineMessages({
  contentUnavailable: {
    description: 'label for unavailable content',
    defaultMessage: 'content unavailable',
  },
});

const ContentUnavailable = ({ cls }: { cls?: string }) => {
  const intl = useIntl();
  return (
    <div className={classNames(styles.unavailable, cls)}>
      <div className={styles.text}>
        {intl.formatMessage(messages.contentUnavailable)}
      </div>
    </div>
  );
};

export default ContentUnavailable;
