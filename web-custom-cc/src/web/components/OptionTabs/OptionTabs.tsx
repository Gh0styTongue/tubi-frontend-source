import classNames from 'classnames';
import React from 'react';

import type { StyleOption } from 'common/types/captionSettings';
import { findIndex } from 'common/utils/collection';

import styles from './OptionTabs.scss';

export type Props = {
  options: StyleOption[];
  activeLabel: string;
  onOptionSelect?: (idx: number) => void;
  extraClass?: string;
};

const getActiveIdx = (label: string, arr: StyleOption[]): number => {
  return findIndex(arr, (item: StyleOption) => {
    return item.label === label;
  });
};

const OptionTabs: React.FunctionComponent<Props> = ({ options, activeLabel, onOptionSelect, extraClass }) => {
  const activeIdx = getActiveIdx(activeLabel, options);
  const handleClick = (idx: number): void => {
    if (idx === activeIdx) return;
    if (onOptionSelect) onOptionSelect(idx);
  };

  return (
    <div className={classNames(styles.tabWrapper, extraClass)}>
      {
        options.map((option: StyleOption, idx: number) => {
          const tabClasses = classNames(styles.tab, {
            [styles.active]: activeIdx === idx,
          });
          return (
            <div className={tabClasses} key={option.label} onClick={() => handleClick(idx)}>{option.label}</div>
          );
        })
      }
    </div>
  );
};

export default React.memo(OptionTabs);
