import classNames from 'classnames';
import React from 'react';

import PlusIcon from 'common/components/uilib/SvgLibrary/PlusIcon';

import styles from './Collapse.scss';

type CollapseProps = Readonly<{
  list: Item[];
  selectedIdx: number;
  onClick: (idx: number) => void;
  className?: string;
}>;

type Item = {
  title: string;
  detail: string;
};

const Collapse = ({ list, selectedIdx, onClick, className }: CollapseProps) => {
  const classes = classNames(styles.collapse, className);

  return (
    <div className={classes}>
      <ul>
        {list.map(({ title, detail }, index) => (
          <li key={index} className={selectedIdx === index ? styles.show : styles.hide}>
            <div className={styles.title}>
              {title}
              <PlusIcon className={styles.icon} onClick={() => onClick(index)} />
            </div>
            <div className={styles.detail}>
              {detail}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Collapse;
