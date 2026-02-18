import { Info24 } from '@tubitv/icons';
import React, { memo } from 'react';
import type { FC } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ACCOUNT_PICKER_MAX_ACCOUNTS } from 'common/features/authentication/constants/multipleAccounts';

import styles from './AccountLimitInfo.scss';

const messages = defineMessages({
  accountLimitInfo: {
    id: 'web.topnav.account.accountLimitInfo',
    description: 'Information message shown when account limit is reached',
    defaultMessage: 'Maximum {maxAccounts} accounts on Tubi. To add a new one, sign out of an existing account in Settings.',
  },
});

const AccountLimitInfo: FC = () => {
  return (
    <div
      className={styles.accountLimitInfo}
      role="status"
      aria-live="polite"
      data-test-id="account-limit-info"
    >
      <Info24 className={styles.icon} aria-hidden="true" />
      <p className={styles.message}>
        <FormattedMessage
          {...messages.accountLimitInfo}
          values={{ maxAccounts: ACCOUNT_PICKER_MAX_ACCOUNTS }}
        />
      </p>
    </div>
  );
};

export default memo(AccountLimitInfo);
