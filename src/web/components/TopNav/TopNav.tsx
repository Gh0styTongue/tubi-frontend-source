import { ANALYTICS_COMPONENTS, NavSection } from '@tubitv/analytics/lib/components';
import { DialogType } from '@tubitv/analytics/lib/dialog';
import {
  Close,
  Exit,
  Menu,
} from '@tubitv/icons';
import { EnterExitTransition } from '@tubitv/web-ui';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import type { FC } from 'react';
import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { defineMessages } from 'react-intl';
import { Link } from 'react-router';

import { loadContainerMenuList } from 'common/actions/container';
import { setScrolledToTop, setTopNavVisibleState } from 'common/actions/ui';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import {
  HIDE_TOP_NAV_PATHNAMES,
  IGNORE_INVERTED_PAGE_PATHNAMES,
  INVERTED_PAGE_PATHNAMES,
  STATIC_TOP_NAV_PATHNAMES,
} from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebAllCategories from 'common/experiments/config/webAllCategories';
import {
  isUserNotCoppaCompliantSelector,
} from 'common/features/coppa/selectors/coppa';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { contentModeForMenuListSelector } from 'common/selectors/contentMode';
import { shouldShowEspanolMenuOnWebSelector } from 'common/selectors/espanolMode';
import { isWebLiveNewsEnableSelector } from 'common/selectors/webLive';
import { isWebMyStuffEnabledSelector, isMovieAndTVShowNavEnabledSelector } from 'common/selectors/webTopNav';
import trackingManager from 'common/services/TrackingManager';
import { TopNavOption } from 'common/types/ottUI';
import type { ViewportType } from 'common/types/ui';
import { buildComponentInteractionEvent, buildDialogEvent } from 'common/utils/analytics';
import { setWebEspanolModeStatusInCookie } from 'common/utils/espanolModeTools';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import redirect from 'common/utils/redirect';
import { trackEvent, trackLogging } from 'common/utils/track';
import { getURIPiece } from 'common/utils/urlManipulation';
import { matchesRoute } from 'common/utils/urlPredicates';
import {
  kidsModeToggleRedirect,
  espanolModeToggleRedirect,
  setKidsModeStatusInCookie,
} from 'common/utils/webKidsModeTools';
import { useIntl } from 'i18n/intl';
import ExitKidsModeWrapper from 'web/components/ExitKidsModeWrapper/ExitKidsModeWrapper';
import Account from 'web/components/TopNav/Account/Account';
import LiveNewsMenu from 'web/components/TopNav/LiveNewsMenu/LiveNewsMenu';
import SearchBar from 'web/components/TopNav/SearchBar/SearchBar';

import Browse from './Browse/Browse';
import { TopNavContext } from './context';
import styles from './TopNav.scss';
import { topNavMessages } from './topNavMessages';

export interface Props {
  pathname: string;
}

const messages = defineMessages({
  exitKids: {
    description: 'link text for site navigation header to exit kids mode',
    defaultMessage: 'Exit Kids',
  },
  close: {
    description: 'Close text for close button',
    defaultMessage: 'Close',
  },
  new: {
    description: 'new label text',
    defaultMessage: 'NEW',
  },
  exit: {
    description: 'link text for site navigation header to exit content mode',
    defaultMessage: 'Exit {mode}',
  },
});

const getTubiLogoClass = (
  isKidsModeEnabled: boolean,
  isEspanolModeEnabled: boolean,
) => {
  if (isKidsModeEnabled) {
    return styles.tubiKidsLogo;
  }
  if (isEspanolModeEnabled) {
    return styles.tubiEspanolLogo;
  }
  return styles.tubiLogo;
};

export type OverlayProps = {
  show: boolean,
  viewportType: ViewportType,
  isBrowseMenuOpen: boolean,
};

export const Overlay = memo(({ show, viewportType, isBrowseMenuOpen }: OverlayProps) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <EnterExitTransition
      entranceTransition="fadeIn"
      exitTransition="fadeOut"
      mountOnEnter
      unmountOnExit
      in={show}
      nodeRef={ref}
    >
      <div
        ref={ref}
        className={classnames(styles.overlay, {
          [styles.tabletLeftMenuOverlay]: viewportType === 'tablet' && isBrowseMenuOpen,
        })}
      />
    </EnterExitTransition>
  );
});

const TopNav: FC<Props> = ({ pathname }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const {
    isKidsModeEnabled,
    isEspanolModeEnabled,
    viewportType,
    liveNewsMenuVisible,
    twoDigitCountryCode,
    fullscreen,
    scrolledToTop,
    topNavVisible,
    toggleTopNavOnScroll,
    preferredLocale,
    isTheater,
  } = useAppSelector((state) => state.ui);
  const previousScrollOffsetY = useRef(0);
  const isMobileViewPort = viewportType === 'mobile';
  const isTabletViewPort = viewportType === 'tablet';
  const isDesktopViewport = viewportType === 'desktop';
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hoverOnBrowseText, setHoverOnBrowseText] = useState(false);
  const [hoverOnBrowseMenu, setHoverOnBrowseMenu] = useState(false);
  const [showMobileAccountMenu, setShowMobileAccountMenu] = useState(false);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const showOverlay = isMobileViewPort
    ? showMobileAccountMenu
    : showBrowseMenu || liveNewsMenuVisible;
  const isKidsModeAvailableInCountry = isFeatureAvailableInCountry(
    'kidsMode',
    twoDigitCountryCode
  );
  const isUserLockedInKidsMode = useAppSelector(isUserNotCoppaCompliantSelector);
  const isMovieAndTVShowNavEnabled = useAppSelector(isMovieAndTVShowNavEnabledSelector);
  const shouldShowLiveNewsMenu = useAppSelector(isWebLiveNewsEnableSelector);
  const shouldShowEspanolMode = useAppSelector(shouldShowEspanolMenuOnWebSelector);
  const location = useLocation();
  const contentModeForMenuList = useAppSelector(state => contentModeForMenuListSelector(state, { pathname: location.pathname }));
  const isMyStuffEnabled = useAppSelector(isWebMyStuffEnabledSelector);

  const shouldShowKidsMode = !isKidsModeEnabled && !isEspanolModeEnabled && isKidsModeAvailableInCountry;
  const shouldShowTubiKidsExit = isKidsModeEnabled
    && isKidsModeAvailableInCountry
    && !isUserLockedInKidsMode;
  const shouldShowMobileMenu = isMobileViewPort && showMobileMenu;
  const shouldHideAccount = shouldShowMobileMenu || isUserLockedInKidsMode;
  const isDisasterMode = pathname === WEB_ROUTES.disasterMode;

  const toggleMobileMenu = useCallback(() => {
    if (isMobileViewPort) {
      setShowMobileMenu(!showMobileMenu);
      if (!showMobileMenu) {
        trackLogging({
          type: TRACK_LOGGING.clientInfo,
          subtype: LOG_SUB_TYPE.SHOW_BROWSER_MENU_ON_WEB,
          message: { viewportType: 'mobile' },
        });
      }
    }
  }, [isMobileViewPort, showMobileMenu]);

  const handleEnterKidsMode = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Use dialog event to track entering kids mode
    const dialogType = DialogType.ENTER_KIDS_MODE;
    const dialogEventObj = buildDialogEvent(getCurrentPathname(), dialogType);
    if (dialogEventObj) {
      trackEvent(eventTypes.DIALOG, dialogEventObj);
    }
    e.preventDefault();
    setKidsModeStatusInCookie(true);
    kidsModeToggleRedirect(preferredLocale);
  }, [preferredLocale]);

  const toggleEspanolMode = useCallback(() => {
    setWebEspanolModeStatusInCookie(!isEspanolModeEnabled);
    espanolModeToggleRedirect(preferredLocale);
  }, [isEspanolModeEnabled, preferredLocale]);

  const hideMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  const handleClickMyStuff = useCallback(() => {
    trackingManager.createNavigateToPageComponent({
      pageUrl: WEB_ROUTES.myStuff,
      componentType: isMobileViewPort ? ANALYTICS_COMPONENTS.navigationDrawerComponent : ANALYTICS_COMPONENTS.topNavComponent,
      endX: TopNavOption.MyStuff,
      containerSlug: 'my_stuff',
    });

    const event = isMobileViewPort ? buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'NAVIGATION_DRAWER',
      section: { category_slug: 'my_stuff', category_row: 0 },
    }) : buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'TOP_NAV',
      section: NavSection.QUEUE,
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);

    hideMobileMenu();
  }, [hideMobileMenu, isMobileViewPort]);

  const URIPiece = getURIPiece(pathname, 0);
  const hideTopNav = HIDE_TOP_NAV_PATHNAMES.indexOf(URIPiece) > -1 || fullscreen;
  const staticTopNav = STATIC_TOP_NAV_PATHNAMES.indexOf(URIPiece) > -1;
  const shouldHideNavItems = isTabletViewPort && isSearchInputFocused; // when search bar opened on tablet, we need hide nav items

  // this is temporary only, the new design does not have an inverted top nav
  const inverted = !IGNORE_INVERTED_PAGE_PATHNAMES.includes(pathname)
    && INVERTED_PAGE_PATHNAMES.includes(URIPiece);

  const navItemClass = classnames(styles.navItem, {
    [styles.inverted]: inverted,
    [styles.hidden]: shouldHideNavItems,
  });

  const webAllCategories = useExperiment(WebAllCategories);
  useEffect(() => {
    if (!shouldHideNavItems && !hideTopNav && isDesktopViewport) {
      webAllCategories.logExposure();
    }
  }, [hideTopNav, isDesktopViewport, shouldHideNavItems, webAllCategories]);

  useEffect(() => {
    if (showBrowseMenu || isMobileViewPort) {
      dispatch(loadContainerMenuList(location, contentModeForMenuList));
    }
  }, [dispatch, showBrowseMenu, isMobileViewPort, contentModeForMenuList, location]);

  const handleScroll = debounce(() => {
    const currentScrollOffsetY = Math.round(window.pageYOffset);

    if (toggleTopNavOnScroll && !liveNewsMenuVisible && !showBrowseMenu && !shouldShowMobileMenu && !staticTopNav && !isTheater) {
      const scrollingDown = currentScrollOffsetY > previousScrollOffsetY.current;
      if (!scrollingDown && previousScrollOffsetY.current === 0) return;
      if (topNavVisible && scrollingDown && currentScrollOffsetY > 0) {
        dispatch(setTopNavVisibleState(false));
      } else if (!topNavVisible && !scrollingDown) {
        dispatch(setTopNavVisibleState(true));
      }
    }
    previousScrollOffsetY.current = Math.max(0, currentScrollOffsetY);
    const isAtTop = currentScrollOffsetY <= 0;
    /* istanbul ignore else */
    if (scrolledToTop !== isAtTop) {
      dispatch(setScrolledToTop(isAtTop));
    }
  }, 50, { leading: true });

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, viewportType]);
  const logoClassName = getTubiLogoClass(isKidsModeEnabled, isEspanolModeEnabled);
  const navItems = useMemo(
    () => (
      <div
        className={classnames(styles.navItems, {
          [styles.withMovieAndTVShowItems]: isMovieAndTVShowNavEnabled,
        })}
      >
        <Browse className={navItemClass} inverted={inverted} onClickBrowse={hideMobileMenu} />
        {shouldShowKidsMode && !isMovieAndTVShowNavEnabled ? (
          <button className={navItemClass} onClick={handleEnterKidsMode}>
            {intl.formatMessage(topNavMessages.tubiKids)}
          </button>
        ) : null}
        {isMovieAndTVShowNavEnabled ? (
          <>
            <Link
              onClick={hideMobileMenu}
              to={WEB_ROUTES.movies}
              className={classnames(navItemClass, { [styles.active]: matchesRoute(WEB_ROUTES.movies, pathname) })}
            >
              {intl.formatMessage(topNavMessages.movies)}
            </Link>
            <Link
              onClick={hideMobileMenu}
              to={WEB_ROUTES.tvShows}
              className={classnames(navItemClass, { [styles.active]: matchesRoute(WEB_ROUTES.tvShows, pathname) })}
            >
              {intl.formatMessage(topNavMessages.tvShows)}
            </Link>
          </>
        ) : null}
        {shouldShowLiveNewsMenu ? (
          <LiveNewsMenu
            linkTextClassname={classnames(navItemClass, { [styles.active]: matchesRoute(WEB_ROUTES.live, pathname) })}
            inverse={inverted}
          />
        ) : null}
        {shouldShowEspanolMode ? (
          <button className={navItemClass} onClick={toggleEspanolMode} data-test-id="top-nav-español">
            {intl.formatMessage(topNavMessages.espanol)}
          </button>
        ) : null}
        {shouldShowKidsMode && isMovieAndTVShowNavEnabled ? (
          <button className={navItemClass} onClick={handleEnterKidsMode}>
            {intl.formatMessage(topNavMessages.tubiKids)}
          </button>
        ) : null}
        {isMyStuffEnabled ? (
          <Link
            onClick={handleClickMyStuff}
            to={WEB_ROUTES.myStuff}
            className={classnames(navItemClass, { [styles.active]: matchesRoute(WEB_ROUTES.myStuff, pathname) })}
          >
            {intl.formatMessage(topNavMessages.myStuff)}
          </Link>
        ) : null}
        {shouldShowTubiKidsExit ? (
          <ExitKidsModeWrapper>
            {(handleExitKidsMode) => (
              <button
                className={classnames(styles.exitKids, { [styles.hidden]: shouldHideNavItems })}
                onClick={handleExitKidsMode}
              >
                <Exit />
                {intl.formatMessage(messages.exitKids)}
              </button>
            )}
          </ExitKidsModeWrapper>
        ) : null}
        {isEspanolModeEnabled ? (
          <button className={classnames(navItemClass, styles.exitEspanol)} onClick={toggleEspanolMode}>
            <Exit />
            {intl.formatMessage(messages.exit, { mode: 'Español' })}
          </button>
        ) : null}
      </div>
    ),
    [
      handleClickMyStuff,
      hideMobileMenu,
      intl,
      inverted,
      isEspanolModeEnabled,
      isMovieAndTVShowNavEnabled,
      isMyStuffEnabled,
      navItemClass,
      pathname,
      shouldHideNavItems,
      shouldShowEspanolMode,
      shouldShowKidsMode,
      shouldShowLiveNewsMenu,
      shouldShowTubiKidsExit,
      toggleEspanolMode,
      handleEnterKidsMode,
    ]
  );

  const contextValue = useMemo(() => ({
    showBrowseMenu,
    setShowBrowseMenu,
    hoverOnBrowseMenu,
    hoverOnBrowseText,
    setHoverOnBrowseText,
    setHoverOnBrowseMenu,
    showMobileMenu,
    setShowMobileMenu,
    showMobileAccountMenu,
    setShowMobileAccountMenu,
    isSearchInputFocused,
    setIsSearchInputFocused,
  }), [hoverOnBrowseMenu, hoverOnBrowseText, isSearchInputFocused, showBrowseMenu, showMobileAccountMenu, showMobileMenu]);

  const reload = useCallback(() => { redirect(WEB_ROUTES.home); }, []);
  const tubiLogo = isDisasterMode ?
    <div onClick={reload}><Tubi className={logoClassName} isKidsModeEnabled={isKidsModeEnabled} isEspanolModeEnabled={isEspanolModeEnabled} color="white" /></div> :
    <Link to={WEB_ROUTES.home}>
      <Tubi className={logoClassName} isKidsModeEnabled={isKidsModeEnabled} isEspanolModeEnabled={isEspanolModeEnabled} color={inverted ? 'black' : 'white'} />
    </Link>;

  const mobileNavItemsContainerRef = useRef<HTMLDivElement>(null);

  if (hideTopNav) {
    return null;
  }

  return (
    <TopNavContext.Provider
      value={contextValue}
    >
      <React.Fragment>
        <Overlay
          show={showOverlay}
          viewportType={viewportType}
          isBrowseMenuOpen={showBrowseMenu}
        />
        <nav
          className={classnames(styles.topNav, {
            [styles.withMovieAndTVshow]: isMovieAndTVShowNavEnabled,
            [styles.withGradientBackground]:
              (scrolledToTop && !showBrowseMenu && !liveNewsMenuVisible && !showMobileAccountMenu)
              || showMobileMenu || !toggleTopNavOnScroll,
            [styles.inverted]: inverted,
            [styles.hide]: !topNavVisible && !staticTopNav,
          })}
        >
          {
            isDisasterMode ? <div className={styles.navContent}>{tubiLogo}</div>
              : (
                <div className={styles.navContent}>
                  <div className={styles.sectionContainer}>
                    <div className={styles.menuTrigger} onClick={toggleMobileMenu}>
                      <div
                        className={classnames(styles.mobileMenuIcon, {
                          [styles.closed]: showMobileMenu,
                        })}
                      >
                        {showMobileMenu ? <Close /> : <Menu />}
                      </div>
                      {showMobileMenu ? (
                        <div className={styles.closeText}>
                          {intl.formatMessage(messages.close)}
                        </div>
                      ) : null}
                    </div>
                    {shouldShowMobileMenu ? null : tubiLogo}
                    {isMobileViewPort ? (
                      <EnterExitTransition
                        mountOnEnter
                        unmountOnExit
                        entranceTransition="browseMenuMobile"
                        exitTransition="browseMenuMobile"
                        in={showMobileMenu}
                        nodeRef={mobileNavItemsContainerRef}
                      >
                        <div
                          ref={mobileNavItemsContainerRef}
                          className={classnames(styles.mobileNavItemsContainer, {
                            [styles.inverted]: inverted,
                          })}
                        >
                          {navItems}
                        </div>
                      </EnterExitTransition>
                    ) : (
                      navItems
                    )}
                  </div>
                  <div
                    className={classnames(
                      styles.sectionContainer,
                      styles.rightSectionContainer
                    )}
                  >
                    {shouldHideAccount ? null : <Account inverted={inverted} />}
                    <SearchBar inverted={inverted} isMobileMenuShow={showMobileMenu} />
                  </div>
                </div>
              )
          }
        </nav>
      </React.Fragment>
    </TopNavContext.Provider>
  );
};

export default memo(TopNav);
