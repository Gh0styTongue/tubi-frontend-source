import classnames from 'classnames';
import type { FC, HTMLAttributes } from 'react';
import React from 'react';

import styles from './Filter.scss';

interface FilterItem {
  id: string;
  content: string;
}

export interface FilterProps extends HTMLAttributes<HTMLDivElement> {
  items: FilterItem[];
  onSelected?: (item: FilterItem) => void;
  selectedIds: string[];
}

const Filter: FC<FilterProps> = ({
  items,
  onSelected,
  selectedIds,
  className,
  ...otherProps
}) => {
  return (
    <div className={classnames(styles.filter, className)} {...otherProps}>
      {items.map((item) => (
        <span
          className={classnames(styles.item, {
            [styles.selected]: selectedIds.includes(item.id),
          })}
          key={item.id}
          onClick={() => onSelected?.(item)}
        >
          {item.content}
        </span>
      ))}
    </div>
  );
};

export default Filter;
