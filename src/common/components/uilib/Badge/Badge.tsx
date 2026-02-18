import classNames from 'classnames';
import React from 'react';

import styles from './Badge.scss';

type Props = {
  text?: React.ReactNode;
  round?: boolean;
  className?: string;
};

const Badge: React.FunctionComponent<Props> = (props) => {
  const {
    className,
    round,
    text,
  } = props;

  const badgeClassName = classNames(
    styles.badge,
    {
      [styles.round]: round,
    },
    className,
  );

  return (
    <div className={badgeClassName}>
      {text}
    </div>
  );
};

export default Badge;
