import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';

import styles from './Tabs.scss';

interface TabsProps {
  activeTabIndex: number;
  className?: string;
  headerClick: (index: number) => void;
  tabMeta: string[];
}

interface TabProps {
  header: string;
  idx: number;
  activeTabIndex: number;
  headerClick: TabsProps['headerClick'];
  tabRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

const Tab: React.FC<TabProps> = ({
  header,
  idx,
  activeTabIndex,
  headerClick,
  tabRefs,
}) => {
  const headerButtonCls = classNames(styles.headerButton, {
    [styles.active]: idx === activeTabIndex,
  });

  const onClick = useCallback(() => headerClick(idx), [headerClick, idx]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      // Get the total number of tabs from the parent
      const totalTabs = tabRefs.current.length;
      // Wrap around if user is at the first or last tab
      const nextIdx = e.key === 'ArrowLeft'
        ? (idx - 1 + totalTabs) % totalTabs
        : (idx + 1) % totalTabs;

      // Navigate to the next tab
      headerClick(nextIdx);
    }
  }, [headerClick, idx, tabRefs]);

  const accessibilityProps = {
    'role': 'tab',
    'aria-selected': idx === activeTabIndex,
    'aria-posinset': idx + 1,
    'aria-setsize': tabRefs.current.length,
    'tabIndex': idx === activeTabIndex ? 0 : -1,
    'onKeyDown': handleKeyDown,
  };

  const getRef = useCallback((el: HTMLButtonElement | null) => {
    tabRefs.current[idx] = el;
  }, [idx, tabRefs]);

  return (
    <div
      data-index={idx}
      className={styles.tabHeader}
    >
      <Button
        ref={getRef}
        className={headerButtonCls}
        onClick={onClick}
        {...accessibilityProps}
      >
        {header}
      </Button>
    </div>
  );
};

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
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus the active tab when it changes
  useEffect(() => {
    tabRefs.current[activeTabIndex]?.focus();
  }, [activeTabIndex]);

  return (
    <div role="tablist" className={classNames(styles.tabsMain, className)}>
      <nav
        className={styles.tabs}
      >
        {
          tabMeta.map((tabHeader: string, idx: number) => {
            return (
              <Tab
                key={idx}
                header={tabHeader}
                headerClick={headerClick}
                activeTabIndex={activeTabIndex}
                idx={idx}
                tabRefs={tabRefs}
              />
            );
          })
        }
      </nav>
      <div
        className={styles.panelContainer}
      >
        {children}
      </div>
    </div>
  );
};

export default Tabs;
