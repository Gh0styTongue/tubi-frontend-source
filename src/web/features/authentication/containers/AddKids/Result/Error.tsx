import { Button } from '@tubitv/web-ui';
import React from 'react';
import { useIntl } from 'react-intl';
import { withRouter, Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from '../common.scss';
import { resultMessages as messages } from '../messages';

export const Error = () => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.main}>
      <h1>{formatMessage(messages.accountLimitTitle)}</h1>
      <p>{formatMessage(messages.accountLimitDesc)}</p>
      <div className={styles.button}>
        <Link to={WEB_ROUTES.home}>
          <Button
            appearance="primary"
            width="theme"
          >{formatMessage(messages.button)}</Button>
        </Link>
      </div>
    </div>
  );
};

export default withRouter(Error);
