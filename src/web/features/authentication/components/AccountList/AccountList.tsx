import React, { useCallback } from 'react';

import type { User } from 'common/features/authentication/types/auth';
import UserItem from 'web/features/authentication/components/UserItem/UserItem';
import type { UserItemProps } from 'web/features/authentication/components/UserItem/UserItem';

import styles from './AccountList.scss';

type AccountItemProps = {
  user: User;
  onSelect: (user: User) => void;
} & Pick<UserItemProps, 'layout'>;

type AccountListProps = {
  userList: User[];
} & Pick<AccountItemProps, 'onSelect' | 'layout'>;

const AccountItem = ({ user, onSelect, layout }: AccountItemProps) => {
  const handleClickItem = useCallback(() => {
    onSelect(user);
  }, [onSelect, user]);

  return (
    <li onClick={handleClickItem}>
      <UserItem user={user} avatarSize="s" layout={layout} />
    </li>
  );
};

const AccountList = ({ userList, onSelect, layout = 'horizontal' }: AccountListProps) => {
  const listClass = layout === 'horizontal' ? styles.accountListHorizontal : styles.accountListVertical;
  const itemLayout = layout === 'horizontal' ? 'vertical' : 'horizontal';

  return (
    <ul className={listClass}>
      {userList.map((user) => {
        return (
          <AccountItem key={user.userId} user={user} onSelect={onSelect} layout={itemLayout} />
        );
      })}
    </ul>
  );
};

export default AccountList;

