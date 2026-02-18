import { ArrowheadDown } from '@tubitv/icons';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import type { Container } from 'common/types/container';
import { getContainerUrl } from 'common/utils/urlConstruction';
import { TopNavContext } from 'web/components/TopNav/context';

import styles from './BrowseCascaderMenu.scss';
import { useMenuItemEvents } from './BrowseMenu.hook';

const messages = defineMessages({
  allCategories: {
    description: 'go to All Categories page',
    defaultMessage: 'All Categories',
  },
});

export interface BrowserCascaderMenuProps {
  className?: string;
  inverted?: boolean;
  cascaderMenu: CascaderMenu[];
}

export interface CascaderMenu {
  title: string;
  id: string;
  children?: Container[];
  container?: Container;
}

interface CascaderMenuGroupsProps {
  cascaderMenu: CascaderMenu[];
  activeGroupId: string;
  onHoverMenuItem?: (groupId: string) => void;
}

interface CascaderMenuContainersProps {
  containers: Container[];
}

const EMPTY_CONTAINERS: Container[] = [];

const CascaderMenuGroups: FC<CascaderMenuGroupsProps> = ({ cascaderMenu, onHoverMenuItem, activeGroupId }) => {
  const handleMouseOver = useCallback(
    (
      event: React.FocusEvent<HTMLDivElement, Element> | React.MouseEvent<HTMLDivElement, MouseEvent>,
      activeGroup: CascaderMenu
    ) => {
      event.stopPropagation();
      event.preventDefault();
      onHoverMenuItem?.(activeGroup.id);
    },
    [onHoverMenuItem]
  );
  const intl = useIntl();
  const allCategories = intl.formatMessage(messages.allCategories);
  const { onClickItem } = useMenuItemEvents();
  const { setShowBrowseMenu, setHoverOnBrowseText, setHoverOnBrowseMenu, setShowMobileMenu } =
    useContext(TopNavContext);
  const handleClickAllCategories = useCallback(() => {
    tubiHistory.push(WEB_ROUTES.categories);
    // for touch device, like surface pro. click the button also will turn the isHovered to be true
    // so we need to postpone the update async
    setTimeout(() => {
      setHoverOnBrowseText(false);
      setHoverOnBrowseMenu(false);
      setShowBrowseMenu(false);
      setShowMobileMenu(false);
    }, 0);
  }, [setHoverOnBrowseMenu, setHoverOnBrowseText, setShowBrowseMenu, setShowMobileMenu]);

  return (
    <div className={styles.cascaderMenuGroups}>
      <div className={styles.cascaderMenuGroupsTopBox}>
        {cascaderMenu
          .filter((menu) => menu.children?.length || menu.container)
          .map((menu) => {
            const hasChildren = menu.children?.length;
            const classNames = classnames(styles.cascaderMenuGroupsItem, {
              [styles.cascaderMenuGroupsItemActive]: activeGroupId === menu.id,
            });

            return (
              <div
                key={menu.id}
                className={classNames}
                onFocus={(event) => handleMouseOver(event, menu)}
                onMouseOver={(event) => handleMouseOver(event, menu)}
              >
                {hasChildren ? (
                  <>
                    {menu.title}
                    <div className={styles.cascaderMenuGroupsItemArrow}>
                      <ArrowheadDown />
                    </div>
                  </>
                ) : (
                  <Link
                    className={styles.cascaderMenuGroupsItem}
                    onClick={(e) => onClickItem(e, menu.container!.slug)}
                    key={menu.container!.id}
                    to={getContainerUrl(menu.container!.id, { type: menu.container!.type })}
                    title={menu.container!.title}
                  >
                    <span className={styles.cascaderMenuContainersTitle}>{menu.container!.title}</span>
                  </Link>
                )}
              </div>
            );
          })}
      </div>
      <div className={styles.cascaderMenuGroupsBottomBox}>
        <Link
          onClick={handleClickAllCategories}
          to={WEB_ROUTES.categories}
          title={allCategories}
          className={styles.bottomItemLink}
        >
          {allCategories}
        </Link>
      </div>
    </div>
  );
};

const CascaderMenuContainers: FC<CascaderMenuContainersProps> = ({ containers }) => {
  const { onClickItem } = useMenuItemEvents();

  return (
    <div className={styles.cascaderMenuContainers}>
      {containers.sort().map(({ id, title, type, slug }) => {
        const url = getContainerUrl(id, { type });
        return (
          <Link
            className={styles.cascaderMenuContainersItem}
            onClick={(e) => onClickItem(e, slug)}
            key={id}
            to={url}
            title={title}
          >
            <span className={styles.cascaderMenuContainersTitle}>{title}</span>
          </Link>
        );
      })}
    </div>
  );
};

const BrowserCascaderMenu: FC<BrowserCascaderMenuProps> = ({ cascaderMenu }) => {
  const defaultActiveGroupId = cascaderMenu[0]?.id;
  const [activeGroupId, setActiveGroupId] = useState(defaultActiveGroupId);
  const activeGroup = useMemo(() => {
    return cascaderMenu.find((menu) => menu.id === activeGroupId);
  }, [activeGroupId, cascaderMenu]);
  const activeContainers = activeGroup?.children || EMPTY_CONTAINERS;
  const onHoverMenuItem = useCallback((currentActiveGroupId: string) => {
    setActiveGroupId(currentActiveGroupId);
  }, []);

  return (
    <div className={styles.cascaderMenuWrapper} data-test-id="cascader-menu-wrapper">
      <CascaderMenuGroups cascaderMenu={cascaderMenu} onHoverMenuItem={onHoverMenuItem} activeGroupId={activeGroupId} />
      {activeContainers.length ? <CascaderMenuContainers containers={activeContainers} /> : null}
    </div>
  );
};

export default BrowserCascaderMenu;
