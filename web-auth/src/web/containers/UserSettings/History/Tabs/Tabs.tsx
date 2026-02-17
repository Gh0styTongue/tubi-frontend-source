import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';
import React from 'react';

import styles from './Tabs.scss';

interface TabsProps {
  activeTabIndex: number;
  className?: string;
  headerClick: (index: number) => void;
  tabMeta: string[];
}

/**
 * @params
 * component used to build a switchable tab interface; displays tab headers and the active content
 * tabMeta is array of objects, each of which have a tabHeader and tabType property
 * headerClick is function for header clicking
 *
 * This component lets active content be dictated by props.children;
 * parent component responsible for defining active tab
 */
const Tabs: React.FC<PropsWithChildren<TabsProps>> = ({
  activeTabIndex,
  children,
  className,
  headerClick,
  tabMeta,
}) => (
  <div className={classNames(styles.tabsMain, className)}>
    <ul className={styles.tabs}>
      {
        tabMeta.map((tabHeader: string, idx: number) => {
          const headerButtonCls = classNames(styles.headerButton, {
            [styles.active]: idx === activeTabIndex,
          });
          return (
            <li
              key={idx}
              data-index={idx}
              className={styles.tabHeader}
            >
              <Button className={headerButtonCls} onClick={() => headerClick(idx)}>{tabHeader}</Button>
            </li>
          );
        })
      }
    </ul>
    <div className={styles.panelContainer}>
      {children}
    </div>
  </div>
);

export default Tabs;
