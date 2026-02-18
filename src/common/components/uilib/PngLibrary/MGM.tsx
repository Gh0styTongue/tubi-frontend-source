import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';

import styles from './iconPng.scss';

interface IconPngProps {
  cls?: string;
  white?: boolean;
}

const IconPng: FC<IconPngProps> = ({ cls = '', white }) => {
  const src = white ? require('./mgm-white.png') : require('./mgm-black.png');
  const imgCls = classNames(styles.iconPng, { [cls]: cls });
  return <img src={src} alt="MGM logo" className={imgCls} />;
};

export default IconPng;
