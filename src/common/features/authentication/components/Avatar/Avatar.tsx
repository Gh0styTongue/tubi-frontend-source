import classNames from 'classnames';
import React from 'react';

import type { AvatarUrl } from 'common/features/authentication/types/auth';

import styles from './Avatar.scss';

export interface AvatarProps {
  avatarClass?: string;
  avatarUrl?: AvatarUrl;
  name: string;
  size: 'xl' | 'l' | 'm' | 's' | 'xs';
}

const getAvatarBackgroundUrl = ({ avatarUrl, size }: {
  avatarUrl?: AvatarUrl;
  size: AvatarProps['size'];
}) => {
  if (!avatarUrl) {
    return 'https://mcdn.tubitv.com/tubitv-assets/img/account/avatars/gradient/contrast/purple/lg.png';
  }

  if (typeof avatarUrl === 'string') {
    return avatarUrl;
  }

  switch (size) {
    case 'xs':
    case 's':
      return avatarUrl.small['1x'];
    case 'm':
    case 'l':
      return avatarUrl.medium['1x'];
    default:
      return avatarUrl.large['1x'];
  }
};

const getAvatarSrcSet = ({ avatarUrl, size }: {
  avatarUrl?: AvatarUrl;
  size: AvatarProps['size'];
}) => {
  if (!avatarUrl || typeof avatarUrl === 'string') {
    return undefined;
  }

  switch (size) {
    case 'xs':
    case 's':
      return `${avatarUrl.small['1x']} 1x, ${avatarUrl.small['2x']} 2x`;
    case 'm':
    case 'l':
      return `${avatarUrl.medium['1x']} 1x, ${avatarUrl.medium['2x']} 2x`;
    default:
      return `${avatarUrl.large['1x']} 1x, ${avatarUrl.large['2x']} 2x`;
  }
};

const Avatar: React.FC<AvatarProps> = ({ avatarClass, avatarUrl, name, size }) => {
  const platformClass = __ISOTT__ ? styles.avatarOTT : styles.avatarWeb;
  return (
    <div className={classNames(styles.avatarBase, platformClass, styles[`size-${size}`], avatarClass)}>
      <img
        className={styles.background}
        src={getAvatarBackgroundUrl({ avatarUrl, size })}
        srcSet={getAvatarSrcSet({ avatarUrl, size })}
        alt="Avatar"
      />
      <div className={styles.letter}>{name.charAt(0)}</div>
    </div>
  );
};

export default Avatar;
