import { PlusStroke, Minus } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import type { ReactNode } from 'react';

import styles from './Collapse.scss';

type CollapseProps = Readonly<{
  list: Item[];
  selectedIdx: number;
  onClick: (idx: number) => void;
  className?: string;
}>;

type Item = {
  title: string;
  detail: string | ReactNode;
};

const Collapse = ({ list, selectedIdx, onClick, className }: CollapseProps) => {
  const classes = classNames(styles.collapse, className);

  return (
    <div className={classes}>
      <ul>
        {list.map(({ title, detail }, index) => {
          const isSelected = selectedIdx === index;
          const Icon = isSelected ? Minus : PlusStroke;
          return (
            <li key={index}>
              <div className={styles.title} onClick={() => onClick(index)}>
                <Icon className={styles.icon} />
                <span>{title}</span>
              </div>
              {isSelected ? <div className={styles.detail}>
                {detail}
              </div> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Collapse;
