/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */

import { Help } from '@tubitv/icons';
import { useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { memo, useCallback, useContext, useRef, useEffect } from 'react';

import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import LegalSupportDropdown from 'web/components/TopNav/Account/AccountDropdown/LegalSupportDropdown';
import { TopNavContext } from 'web/components/TopNav/context';

import styles from './LegalSupport.scss';

interface Props {
  inverted?: boolean;
}

const LegalSupport = ({ inverted }: Props) => {
  const { viewportType } = useAppSelector((state) => state.ui);
  const isDesktop = viewportType === 'desktop';
  const isMobile = !isDesktop;
  const { showMobileAccountMenu, setShowMobileAccountMenu } = useContext(TopNavContext);

  const location = useLocation();

  const ref = useRef<HTMLDivElement | null>(null);
  const [hoverRef, isHovered] = useHover({
    delay: 200,
    skip: isMobile,
  });

  const combineRef = useCallback(
    (node: HTMLDivElement | null) => {
      hoverRef(node);
      ref.current = node;
    },
    [hoverRef],
  );
  const toggleDropdown = useCallback((e: MouseEvent) => {
    if (isMobile) {
      if (ref.current?.contains(e.target as Node)) {
        setShowMobileAccountMenu(!showMobileAccountMenu);
      } else {
        setShowMobileAccountMenu(false);
      }
    }
  }, [ref, setShowMobileAccountMenu, showMobileAccountMenu, isMobile]);

  useEffect(() => {
    document.addEventListener('click', toggleDropdown);
    return () => {
      document.removeEventListener('click', toggleDropdown);
    };
  }, [toggleDropdown]);

  useEffect(() => {
    setShowMobileAccountMenu(false);
  }, [location.pathname, setShowMobileAccountMenu]);

  return (
    <div
      className={classnames(styles.account, { [styles.opened]: showMobileAccountMenu, [styles.inverted]: inverted })}
      ref={combineRef}
    >
      <Help className={classnames(styles.helpIcon, { [styles.inverted]: inverted })} />
      <LegalSupportDropdown show={isHovered || showMobileAccountMenu} isMobile={isMobile} />
    </div>
  );
};

export default memo(LegalSupport);
