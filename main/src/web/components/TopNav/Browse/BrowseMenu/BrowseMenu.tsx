import { Close } from '@tubitv/icons';
import { EnterExitTransition, useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC, CSSProperties, MouseEvent } from 'react';
import React, { useRef, useContext, useEffect, memo, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineMessages } from 'react-intl';
import { Link } from 'react-router';

import { CONTAINER_GROUPINGS } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { navigateToStubios } from 'common/features/authentication/api/seamless';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { containerMenuSelector, popularItemsSplitterSelector } from 'common/selectors/container';
import { webAllCategoriesExperimentSelector } from 'common/selectors/experiments/webAllCategories';
import { isStubiosNavEnabledSelector } from 'common/selectors/ui';
import { isMovieAndTVShowNavEnabledSelector } from 'common/selectors/webTopNav';
import StubiosLogo from 'common/theme/icons/stubios-logo.svg';
import type { Container, ContainerType } from 'common/types/container';
import { groupContainers } from 'common/utils/containerTools';
import { getRemoteDebuggerStatus } from 'common/utils/debug';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import { getContainerUrl } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import { TopNavContext } from 'web/components/TopNav/context';
import { topNavMessages } from 'web/components/TopNav/topNavMessages';
import { getStubiosLink } from 'web/features/authentication/utils/auth';
import useDisableBodyScroll from 'web/hooks/useDisableBodyScroll';

import type { CascaderMenu } from './BrowseCascaderMenu';
import BrowseCascaderMenu from './BrowseCascaderMenu';
import { useMenuItemEvents } from './BrowseMenu.hook';
import styles from './BrowseMenu.scss';

export const messages = defineMessages({
  popular: {
    description: 'text in navigation menu',
    defaultMessage: 'Popular',
  },
  genres: {
    description: 'text in navigation menu',
    defaultMessage: 'Genres',
  },
  collections: {
    description: 'text in navigation menu',
    defaultMessage: 'Collections',
  },
  // internally these are 'channel', externally to users they are 'networks' because 'channel' would be confusing with the Live content
  channels: {
    description: 'text in navigation menu',
    defaultMessage: 'Networks',
  },
  browse: {
    description: 'browse menu title',
    defaultMessage: 'Browse',
  },
  allCategories: {
    description: 'go to All Categories page',
    defaultMessage: 'All Categories',
  },
});

interface TagSectionsProps {
  tag: string;
  items: Container[];
  width: number;
  containerStyle?: CSSProperties;
  itemsStyle?: CSSProperties;
}

const BROWSER_MENU_COLUMN_WIDTHS = [300, 430, 230, 210];
const KIDS_MODE_BROWSER_MENU_COLUMN_WIDTHS = [220, 230, 230, 210];
const ESPANOL_MODE_BROWSER_MENU_COLUMN_WIDTHS = [220, 430, 230, 210];
const REMOTE_DEBUGGER_KEY = 'remote-debugger';
const FEATURE_SWITCH_KEY = 'feature-switch';
const STUBIOS_KEY = 'stubios';
const MAX_SECTION_TITLES = 23;
const TOP_NAV_HEIGHT = 96;
const MENU_TITLE_HEIGHT = 48;
const MENU_MARGIN = 48;
const MENU_ITEM_HEIGHT = 28;
const MENU_ITEM_GAP = 8;

const RawTagSections: FC<TagSectionsProps> = ({ tag, items, width, containerStyle, itemsStyle }) => {
  const dispatch = useAppDispatch();
  const { onClickItem } = useMenuItemEvents();
  const onClickStubiosItem = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      dispatch(
        navigateToStubios(
          getStubiosLink({
            queryParams: {
              utm_content: 'menu-link',
            },
          })
        )
      );
    },
    [dispatch]
  );

  if (items.length === 0) return null;

  return (
    <div className={styles.gridContainer} style={{ ...containerStyle, width }} data-test-id="top-nav-browse-menu">
      <div className={styles.containerTitle}>{tag}</div>
      <div className={styles.containerItems} style={itemsStyle}>
        {items.sort().map(({ id, title, type, slug }) => {
          const sharedLinkProps = {
            key: id,
            title,
            className: classnames(styles.containerLink, {
              // There would be 2 columns when the width of RawTagSections is 430 in BROWSER_MENU_COLUMN_WIDTHS and ESPANOL_MODE_BROWSER_MENU_COLUMN_WIDTHS
              // The 400 is a approximate threshold of assessment.
              [styles.halfWidth]: width > 400,
            }),
            onClick: (e: MouseEvent) => onClickItem(e, slug),
          };

          if (slug === STUBIOS_KEY) {
            return (
              <span {...sharedLinkProps} onClick={onClickStubiosItem}>
                <img src={StubiosLogo} alt="Stubios" height="14" />
              </span>
            );
          }

          const url = getContainerUrl(id, { type });

          return (
            <Link {...sharedLinkProps} to={url}>
              {title}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const TagSections = memo(RawTagSections);

const BrowseMenu: FC<{
  className?: string;
  inverted?: boolean;
}> = ({ className, inverted }) => {
  const { viewportType, twoDigitCountryCode, isKidsModeEnabled, isEspanolModeEnabled } = useAppSelector(
    (state) => state.ui
  );
  const intl = useIntl();
  const { formatMessage } = intl;

  const location = useLocation();
  const containerMenuItems = useAppSelector(state => containerMenuSelector(state, { pathname: location.pathname }));
  const isChannelsVisible = isFeatureAvailableInCountry('channels', twoDigitCountryCode);
  const isMovieAndTVShowNavEnabled = useAppSelector(isMovieAndTVShowNavEnabledSelector);
  const isNewFlyoverEnabled = useAppSelector(webAllCategoriesExperimentSelector);
  const isMobileViewport = viewportType === 'mobile';
  const isDesktopViewport = viewportType === 'desktop';
  const [hoverRef, isHovered] = useHover({
    delay: 200,
    skip: !isDesktopViewport,
  });
  const menuNodeRef = useRef<HTMLDivElement>();
  const combinedRef = useCallback(
    (node: HTMLDivElement | null): void => {
      hoverRef(node);
      menuNodeRef.current = node ?? undefined;
    },
    [hoverRef]
  );
  const groupings = groupContainers(containerMenuItems);
  const classname = classnames(styles.browseMenu, className, {
    [styles.inverted]: inverted,
    [styles.withMovieAndTVShow]: isMovieAndTVShowNavEnabled,
    [styles.kidsMode]: isKidsModeEnabled,
    [styles.espanolMode]: isEspanolModeEnabled,
    [styles.isNewFlyoverEnabled]: isNewFlyoverEnabled,
  });

  const {
    showBrowseMenu,
    setShowBrowseMenu,
    hoverOnBrowseText,
    setHoverOnBrowseMenu,
  } = useContext(TopNavContext);
  const [maxSectionTitlesDependOnAppHeight, setMaxSectionTitlesDependOnAppHeight] = useState(MAX_SECTION_TITLES);

  const isStubiosNavEnabled = useAppSelector(isStubiosNavEnabledSelector);
  const shouldShowSuperbowl = useAppSelector((state) => state.ui.twoDigitCountryCode) === 'US';

  const collections = groupings[CONTAINER_GROUPINGS.COLLECTIONS];
  const firstCollection = collections?.[0];
  if (isStubiosNavEnabled && firstCollection?.id !== STUBIOS_KEY) {
    collections.unshift({
      ...firstCollection,
      id: STUBIOS_KEY,
      slug: STUBIOS_KEY,
      type: STUBIOS_KEY as ContainerType,
      title: 'Stubios',
    });
  }

  useDisableBodyScroll(showBrowseMenu);

  /* istanbul ignore next */
  const handleKidsModeClick = useCallback((e: any) => {
    e.preventDefault();
    document.getElementById('kidsModeButton')?.click();
  }, []);

  /* istanbul ignore next */
  const handleEspanolModeClick = useCallback((e: any) => {
    e.preventDefault();
    document.getElementById('espanolModeButton')?.click();
  }, []);

  useEffect(() => {
    if (isDesktopViewport) {
      if (!isHovered && !hoverOnBrowseText) {
        setShowBrowseMenu(false);
      }
      if (isHovered) {
        setShowBrowseMenu(true);
      }
      setHoverOnBrowseMenu(isHovered);
    }
  }, [
    hoverOnBrowseText,
    isDesktopViewport,
    isHovered,
    isMobileViewport,
    setHoverOnBrowseMenu,
    setShowBrowseMenu,
  ]);

  const {
    [CONTAINER_GROUPINGS.POPULAR]: popularItems,
    [CONTAINER_GROUPINGS.GENRES]: genresItems,
    [CONTAINER_GROUPINGS.COLLECTIONS]: collectionsItems,
    [CONTAINER_GROUPINGS.CHANNELS]: channelsItems,
  } = groupings;

  if (!__PRODUCTION__ || __IS_ALPHA_ENV__) {
    const remoteDebuggerInformation = {
      ...groupings[CONTAINER_GROUPINGS.POPULAR][0],
      slug: REMOTE_DEBUGGER_KEY,
      id: REMOTE_DEBUGGER_KEY,
      type: REMOTE_DEBUGGER_KEY as ContainerType,
      title: `🔨 ${getRemoteDebuggerStatus() ? 'Disable' : 'Enable'} Remote Debugger`,
    };
    const featureSwitchInformation = {
      ...groupings[CONTAINER_GROUPINGS.POPULAR][0],
      slug: FEATURE_SWITCH_KEY,
      id: FEATURE_SWITCH_KEY,
      type: FEATURE_SWITCH_KEY as ContainerType,
      title: '🔨 Feature Switch',
    };
    groupings[CONTAINER_GROUPINGS.POPULAR].push(remoteDebuggerInformation);
    groupings[CONTAINER_GROUPINGS.POPULAR].push(featureSwitchInformation);
  }

  const transitionName =
    isDesktopViewport
      ? 'browseMenuDesktop'
      : `browseMenu${viewportType[0].toUpperCase() + viewportType.substr(1)}`;

  const close = () => {
    setShowBrowseMenu(false);
  };

  useEffect(() => {
    const maxHeight =
      (document.documentElement.clientHeight || window.innerHeight) - TOP_NAV_HEIGHT - MENU_TITLE_HEIGHT - MENU_MARGIN;

    setMaxSectionTitlesDependOnAppHeight(Math.floor(maxHeight / MENU_ITEM_HEIGHT));
  }, []);

  const maxSectionTitles = useMemo(
    () =>
      Math.min(
        maxSectionTitlesDependOnAppHeight,
        Math.max(popularItems.length, Math.ceil(genresItems.length / 2), collectionsItems.length, channelsItems.length),
        MAX_SECTION_TITLES
      ),
    [
      channelsItems.length,
      collectionsItems.length,
      genresItems.length,
      maxSectionTitlesDependOnAppHeight,
      popularItems.length,
    ]
  );

  let browseMenuColumnWidths = BROWSER_MENU_COLUMN_WIDTHS;
  if (isKidsModeEnabled) {
    browseMenuColumnWidths = KIDS_MODE_BROWSER_MENU_COLUMN_WIDTHS;
  } else if (isEspanolModeEnabled) {
    browseMenuColumnWidths = ESPANOL_MODE_BROWSER_MENU_COLUMN_WIDTHS;
  }

  let menuItemsStyle: CSSProperties = {};
  let menuItemsContainerStyle: CSSProperties = {};
  let menuStyle: CSSProperties = {};

  if (isDesktopViewport) {
    const menuItemsHeight = maxSectionTitles * MENU_ITEM_HEIGHT - MENU_ITEM_GAP;
    const menuItemsContainerHeight = menuItemsHeight + MENU_TITLE_HEIGHT + MENU_MARGIN;
    const menuHeight = menuItemsContainerHeight;
    menuStyle = {
      height: menuHeight,
    };
    menuItemsContainerStyle = {
      // excludes menu top and bottom border width
      height: menuItemsContainerHeight - 2,
    };
    menuItemsStyle = {
      maxHeight: menuItemsHeight,
    };
  }

  let menu = (
    <div className={classname} style={menuStyle} ref={combinedRef}>
      <div className={styles.tabletTitle}>
        {formatMessage(messages.browse)}
        <div onClick={close}>
          <Close />
        </div>
      </div>
      {shouldShowSuperbowl ?
        <div className={styles.kidsAndEspanolContainer}>
          <Link
            onClick={handleKidsModeClick}
            to={WEB_ROUTES.home}
            title={intl.formatMessage(topNavMessages.tubiKids)}
            className={styles.kidsAndEspanolContainerLink}
          >
            {intl.formatMessage(topNavMessages.tubiKids)}
          </Link>
          <Link
            onClick={handleEspanolModeClick}
            to={WEB_ROUTES.espanol}
            title={intl.formatMessage(topNavMessages.espanol)}
            className={styles.kidsAndEspanolContainerLink}
          >
            {intl.formatMessage(topNavMessages.espanol)}
          </Link>
        </div>
        : null
      }
      <TagSections
        tag={formatMessage(messages.popular)}
        items={popularItems}
        width={browseMenuColumnWidths[0]}
        itemsStyle={menuItemsStyle}
        containerStyle={menuItemsContainerStyle}
      />
      <TagSections
        tag={formatMessage(messages.genres)}
        items={genresItems}
        width={browseMenuColumnWidths[1]}
        itemsStyle={menuItemsStyle}
        containerStyle={menuItemsContainerStyle}
      />
      <TagSections
        tag={formatMessage(messages.collections)}
        items={collectionsItems}
        width={browseMenuColumnWidths[2]}
        itemsStyle={menuItemsStyle}
        containerStyle={menuItemsContainerStyle}
      />
      {isChannelsVisible ? (
        <TagSections
          tag={formatMessage(messages.channels)}
          items={channelsItems}
          width={browseMenuColumnWidths[3]}
          itemsStyle={menuItemsStyle}
          containerStyle={menuItemsContainerStyle}
        />
      ) : null}
    </div>
  );

  const { popularItemsWithoutHistoryMyList, historyMyListItems } = useAppSelector((state) =>
    popularItemsSplitterSelector(state, popularItems)
  );
  const cascaderMenu = useMemo(() => {
    const menu: CascaderMenu[] = [
      {
        id: CONTAINER_GROUPINGS.POPULAR,
        title: formatMessage(messages.popular),
        children: popularItemsWithoutHistoryMyList,
      },
      {
        id: CONTAINER_GROUPINGS.GENRES,
        title: formatMessage(messages.genres),
        children: genresItems,
      },
      {
        id: CONTAINER_GROUPINGS.COLLECTIONS,
        title: formatMessage(messages.collections),
        children: collectionsItems,
      },
      {
        id: CONTAINER_GROUPINGS.CHANNELS,
        title: formatMessage(messages.channels),
        children: channelsItems,
      },
    ];
    historyMyListItems.forEach((item) => {
      menu.push({
        id: item.id,
        title: item.title,
        container: item,
      });
    });
    return menu;
  }, [
    channelsItems,
    collectionsItems,
    formatMessage,
    genresItems,
    historyMyListItems,
    popularItemsWithoutHistoryMyList,
  ]);

  if (isNewFlyoverEnabled && isDesktopViewport) {
    menu = (
      <div data-test-id="new-flyover-menu" className={classname} ref={combinedRef}>
        <BrowseCascaderMenu cascaderMenu={cascaderMenu} inverted={inverted} />
      </div>
    );
  }

  const content = !isMobileViewport ? (
    <EnterExitTransition
      mountOnEnter
      unmountOnExit
      entranceTransition={transitionName}
      exitTransition={transitionName}
      in={showBrowseMenu}
      nodeRef={menuNodeRef}
    >
      {menu}
    </EnterExitTransition>
  ) : (
    menu
  );

  if (viewportType !== 'tablet') {
    return content;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  // use `createPortal` to solve overlay zIndex issue
  return createPortal(content, document.getElementById('app')!);
};

export default memo(BrowseMenu);
