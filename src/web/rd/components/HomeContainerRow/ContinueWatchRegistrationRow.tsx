import { Account, Locked } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { registrationRequireMessages as messages } from 'common/constants/constants-message';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';

import styles from './ContinueWatchRegistrationRow.scss';

export const ContinueWatchRegistrationRow = () => {
  const intl = useIntl();
  const handleButtonClick = useCallback(() => {
    tubiHistory.push(WEB_ROUTES.register);
  }, []);

  return (
    <div className={styles.ContinueWatchRegistrationContainer}>
      <div className={styles.fixedRatioWrapper}>
        <div className={styles.content}>
          <Locked />
          <div className={styles.title}>{intl.formatMessage(messages.registrationTitle)}</div>
          <div className={styles.buttonWrapper}>
            <Button
              size="small"
              icon={Account}
              iconSize="large"
              tag={intl.formatMessage(messages.free)}
              onClick={handleButtonClick}
            >
              {intl.formatMessage(messages.action)}
            </Button>
          </div>
          <div className={styles.desc}>{intl.formatMessage(messages.desc)}</div>
        </div>
      </div>
    </div>
  );
};
