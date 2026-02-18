import classNames from 'classnames';
import React from 'react';

import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import Avatar from 'common/features/authentication/components/Avatar/Avatar';
import type { AvatarProps } from 'common/features/authentication/components/Avatar/Avatar';
import type { User } from 'common/features/authentication/types/auth';

import styles from './UserItem.scss';

export interface UserItemProps {
  user: User;
  avatarSize?: AvatarProps['size'];
  layout?: 'horizontal' | 'vertical';
}

const UserItem = ({ user, avatarSize = 'm', layout = 'vertical' }: UserItemProps) => {
  if (!user.name) {
    return null;
  }
  return (
    <div className={classNames(styles.item, { [styles.horizontal]: layout === 'horizontal' })}>
      <Avatar name={user.name} size={avatarSize} avatarUrl={user.avatarUrl} />
      <div>
        <div className={styles.name}>{user.name}</div>
        {user.parentTubiId ? <Tubi className={styles.kidsLogo} isKidsModeEnabled /> : null}
      </div>
    </div>
  );
};

export default UserItem;
