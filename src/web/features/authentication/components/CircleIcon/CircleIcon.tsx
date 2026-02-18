import React from 'react';

import styles from './CircleIcon.scss';

interface Props {
  iconComponent: React.ComponentType<any>;
}

const CircleIcon = ({ iconComponent: Icon }: Props) => {
  return (
    <div className={styles.circle}>
      <Icon />
    </div>
  );
};

export default CircleIcon;
