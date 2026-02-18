import React from 'react';

import type { User } from 'common/features/authentication/types/auth';
import UserItem from 'web/features/authentication/components/UserItem/UserItem';

import styles from './AccountList.scss';

interface AccountListProps {
  userList: User[];
}

const AccountList = ({ userList }: AccountListProps) => {
  return (
    <ul className={styles.accountList}>
      {userList.map((user) => {
        return (
          <li key={user.userId}>
            <UserItem user={user} />
          </li>
        );
      })}
    </ul>
  );
};

export default AccountList;

