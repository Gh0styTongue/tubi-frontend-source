import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import styles from './OrDivider.scss';

const messages = defineMessages({
  or: {
    description: 'text or for divider line',
    defaultMessage: 'OR',
  },
});

const OrDivider = ({ className, inverted }: { className: string, inverted: boolean }) => {
  const cls = classNames(styles.orRow, className, {
    [styles.inverted]: inverted,
  });
  return (
    <div className={cls}>
      <div className={styles.line} />
      <div className={styles.orCircle}>
        <div className={styles.orText}>
          <FormattedMessage {...messages.or} />
        </div>
      </div>
      <div className={styles.line} />
    </div>
  );
};

export default OrDivider;
