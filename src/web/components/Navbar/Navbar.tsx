import classNames from 'classnames';
import React from 'react';

import { KEYBOARD } from 'common/constants/key-map';

import styles from './Navbar.scss';

type Route = {
  key: string;
  element: React.ReactNode;
};

export interface NavbarProps {
  className?: string;
  routes: Route[];
  activeIdx: number;
  onClick: (index: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ className, routes, activeIdx, onClick }) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      const idx = parseInt(e.currentTarget.dataset.index!, 10);
      onClick(idx);
    }
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === KEYBOARD.enter) {
      const idx = parseInt(e.currentTarget.dataset.index!, 10);
      onClick(idx);
    }
  };

  const mainCls = classNames(styles.navbar, className);
  return (
    <div className={mainCls}>
      {routes.map(({ element, key }, idx) => {
        const itemCls = classNames(styles.item, { [styles.active]: idx === activeIdx });
        return (
          <div
            key={key}
            className={itemCls}
            onClick={handleClick}
            onKeyDown={handleKeydown}
            data-index={idx}
            tabIndex={0}
            role="button"
            aria-label={key}
          >
            {element}
          </div>
        );
      })}
    </div>
  );
};

export default Navbar;
