import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { Location } from 'history';
import type { DebounceSettings } from 'lodash';
import debounce from 'lodash/debounce';
import memoize from 'lodash/memoize';
import throttle from 'lodash/throttle';
import type { Dispatch, MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ValueOf } from 'ts-essentials';

import { hasExitApi as getHasExitApi } from 'client/systemApi/utils';
import { getCookie, getLocalData, setCookie, setLocalData } from 'client/utils/localDataStorage';
import { preloadPurplescripts } from 'client/utils/preloadPurpleCarpetScripts';
import { clearPixelsFired, lazyloadHomeScreen, loadMoreItems, setContainerContext } from 'common/actions/container';
import {
  navigateWithinContainerInGrid,
  playFireVideo,
  resetOTTHomeSelectedState,
  setHomeActiveData,
  setOttSelectedContainer,
} from 'common/actions/fire';
import { debouncedOpenLeftNav, setLeftNavOption } from 'common/actions/leftNav';
import {
  hideModal,
  showExpiredModal, showInAppMessageModal, showKidsModeEligibilityModal, showMatureContentModal, showRegistrationPromptModal,
  showSamsungCWNotificationModal,
  showUpdateTubiModal,
} from 'common/actions/modal';
import { KidsModeEligibilityModalTypes, showAgeGateComponent } from 'common/actions/ottUI';
import { exitTubi, stopLiveTabUserBackFlow } from 'common/actions/ui';
import {
  SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT,
} from 'common/constants/action-types';
import * as actions from 'common/constants/action-types';
import {
  BACK_FROM_TUBI_TO_ENTRANCE,
  BANNER_CONTAINER_ID,
  CONTENT_MODES,
  DISCOVERY_ROW_INDEX,
  PURPLE_CARPET_CONTAINER_ID,
  SERIES_CONTENT_TYPE,
  VIDEO_CONTENT_TYPE,
} from 'common/constants/constants';
import { HAS_VIEWED_CW_UG_INTEGRATION_NOTIFICATION, HAS_VIEWED_UPDATE_APP_COOKIE } from 'common/constants/cookies';
import {
  SCROLL_IN_CONTAINER_DETAILS_METRIC,
  SCROLL_IN_CONTAINER_ROW_DELAY_METRIC,
  SCROLL_TO_CONTAINER_DELAY_METRIC,
  SCROLL_TO_CONTAINER_DETAILS_METRIC,
} from 'common/constants/performance-metrics';
import { OTT_LIVE_PLAYER_ROUTE_PREFIX, OTT_ROUTES, PAGE_TYPE } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { DEBOUNCE_BACKGROUND_IMAGE_VARIANT } from 'common/experiments/config/ottFireTVDebounceBackgroundImageRerun';
import ottFireTVSpotlightCarouselNav from 'common/experiments/config/ottFireTVSpotlightCarouselNav';
import {
  goToSignInPage,
  loginCallback,
  loginRedirect,
  onLoginCanceled,
} from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { handleSignOutEvent } from 'common/features/authentication/utils/signOutStatus';
import { isAgeGateRequiredSelector } from 'common/features/coppa/selectors/coppa';
import { getAdPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import {
  isPurpleCarpetContentActiveSelector,
  purpleCarpetContentsStatusSelector,
  shouldLockPurpleCarpetSelector,
  shouldShowPurpleCarpetSelector,
} from 'common/features/purpleCarpet/selector';
import { PurpleCarpetContentStatus } from 'common/features/purpleCarpet/type';
import { fireSkinsAdPixels } from 'common/features/skinsAd/action';
import { SKINS_AD_CONTAINER_ID } from 'common/features/skinsAd/constants';
import { shouldShowSkinsAdSelector } from 'common/features/skinsAd/selector';
import tubiHistory from 'common/history';
import useDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useEvent from 'common/hooks/useEvent';
import useExperiment from 'common/hooks/useExperiment';
import useKeydownHandler from 'common/hooks/useKeydownHandler';
import { usePrevious } from 'common/hooks/usePrevious';
import { homeBgSelector } from 'common/selectors/backgroundImages';
import { containerSelector, ottSideMenuSelector } from 'common/selectors/container';
import { currentContentModeSelector, isHomeOrContentModePageSelector, isMyStuffPageActiveSelector, previousContentModeSelector } from 'common/selectors/contentMode';
import { ottFireTVDebounceBackgroundExperimentSelector } from 'common/selectors/experiments/ottFireTVDebounceBackgroundImageRerun';
import { uiNavigationPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { cwSupportedVersionOnSamsungSelector, isModalShownSelector, shouldShowMatureContentModalSelector } from 'common/selectors/fire';
import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import { isGridActiveSelector } from 'common/selectors/ottUI';
import trackingManager from 'common/services/TrackingManager';
import type { ContentItem } from 'common/types/fire';
import { isContainer } from 'common/types/fire';
import { OTTInputMode } from 'common/types/ottUI';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { isDeprecatedHybBuild as getIsDeprecatedHybBuild, shouldShowUpdateAppModal } from 'common/utils/hybAppUtils';
import { getOTTHotkeys, getOTTRemote, isOTTKeys } from 'common/utils/keymap';
import { getContainerUrl, getUrlByVideo } from 'common/utils/urlConstruction';
import { isDetailsPageUrl } from 'common/utils/urlPredicates';
import type { OnChangeParams as ContentRowOnChangeParams } from 'ott/components/ContentRow/ContentRow';
import { getActiveOptionFromLocation } from 'ott/components/OTTLeftNavContainer/withLeftNav';
import type { UseResetContainerRowIndexFromMouseSelectionOptions } from 'ott/containers/Home/useResetContainerRowIndexFromMouseSelection';
import { useResetContainerRowIndexFromMouseSelection } from 'ott/containers/Home/useResetContainerRowIndexFromMouseSelection';
import { getVideoInfoForPlaying } from 'ott/features/playback/utils/getVideoInfoForPlaying';
import { useUnsupportedDeviceModal } from 'ott/features/purpleCarpet/hooks/useUnsupportedDeviceModal';
import { useHideLoadingSpinner } from 'ott/hooks/useHideLoadingSpinner';
import { isVideoExpired } from 'ott/utils/expiration';
import { getSelectedContainerIndex, isNextRowIndexValid } from 'ott/utils/homegrid';
import { isHomeGridPathname } from 'ott/utils/leftNav';
import { UINavigationPerformanceTrackingManager } from 'ott/utils/uiNavigationPerformanceTrackingManager';

import { homeActiveContainerIdSelector, isCWPromptActiveSelector, isSwitchingModeSelector } from './selectors';

const SET_HOME_ACTIVE_DATA_DEBOUNCE_TIME = 800;
// subtract 10ms for setBackgroundImage being called before the setHomeActiveData
const SET_BACKGROUND_IMAGE_EXPIRE_DEBOUNCE_TIME = SET_HOME_ACTIVE_DATA_DEBOUNCE_TIME - 10;
const ON_GRID_LEAVE_THROTTLE_WAIT_TIME = 150;

// we can use a module scope debounce function to debounce for horizontal and vertical
const debouncedSetHomeActiveData = debounce((dispatch: Dispatch<any>, location: Location) => {
  dispatch(setHomeActiveData(location));
}, SET_HOME_ACTIVE_DATA_DEBOUNCE_TIME);

const setBackgroundImageExpire = (dispatch: Dispatch<any>) => {
  // As we update textual info in the VOD container row immediately, we need to fade out image for every movement as well.
  // Also we should hide the live player on the linear row immediately
  dispatch(
    actionWrapper(SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT, {
      ifBgImageMatchActiveContent: false,
    })
  );
};
const getDebounceBackgroundImageExpireFunction = memoize((
  wait: number,
  options: DebounceSettings = { leading: false, trailing: true }
) => debounce((dispatch: Dispatch<any>) => setBackgroundImageExpire(dispatch), wait, options));

export const useUpdateActiveData = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const debounceBackgroundExperimentValue = useAppSelector(ottFireTVDebounceBackgroundExperimentSelector);
  const useShortDebounceTiming = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_short_debounce_timing;
  const neverSetImageExpire = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.never_set_image_expire || activeContainerId === PURPLE_CARPET_CONTAINER_ID;
  const useLeadingDebounce = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_leading_debounce;
  const showLiveVideoBackground = useAppSelector(state => homeBgSelector(state, { pathname: location.pathname }).showLiveVideoBackground);
  const handleSetHomeActiveData = useCallback(() => {
    dispatch(setHomeActiveData(location));
  }, [dispatch, location]);
  let debouncedSetBackgroundImageExpire: ReturnType<typeof getDebounceBackgroundImageExpireFunction> | undefined;
  if (!neverSetImageExpire) {
    debouncedSetBackgroundImageExpire = getDebounceBackgroundImageExpireFunction(
      useShortDebounceTiming
        ? SET_HOME_ACTIVE_DATA_DEBOUNCE_TIME / 2
        : useLeadingDebounce
          ? SET_HOME_ACTIVE_DATA_DEBOUNCE_TIME
          : SET_BACKGROUND_IMAGE_EXPIRE_DEBOUNCE_TIME,
      useLeadingDebounce ? { leading: true, trailing: false } : undefined
    );
  }

  /**
   * function is debounced. it update container store
   * data is used to populate homeDetails and backgroundImage
   */
  const updateActiveData = useCallback(() => {
    if (showLiveVideoBackground) {
      /**
       * The banner video is playing with countdown.
       * We should stop it immediately otherwise there is a chance
       * that users will jump into the playback page when they are selecting other contents.
       * What's more, jumping immediately will provide a good reaction for the user.
       */

      if (!neverSetImageExpire) setBackgroundImageExpire(dispatch);
      handleSetHomeActiveData();
      return;
    }

    if (!neverSetImageExpire && debouncedSetBackgroundImageExpire) {
      debouncedSetBackgroundImageExpire(dispatch);
    }
    debouncedSetHomeActiveData(dispatch, location);
  }, [showLiveVideoBackground, neverSetImageExpire, dispatch, handleSetHomeActiveData, debouncedSetBackgroundImageExpire, location]);
  return updateActiveData;
};

const useScrollToContainer = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));

  const updateActiveData = useUpdateActiveData();

  const scrollToContainer = useCallback(
    (newIndex: number) => {
      dispatch(
        setOttSelectedContainer({
          location,
          containerId: containersInMenu[newIndex].id,
        })
      );
      dispatch(lazyloadHomeScreen({ location }));
      updateActiveData();
    },
    [
      containersInMenu,
      dispatch,
      updateActiveData,
      location,
    ]
  );
  return scrollToContainer;
};

const useOpenLeftNav = () => {
  const dispatch = useDispatch();
  const openLeftMenu = useCallback(() => {
    dispatch(debouncedOpenLeftNav());
  }, [dispatch]);
  return openLeftMenu;
};

interface UseContainerEventHandlerOptions {
  lastSelectedIndexWhenInputModeWasDefaultMap: MutableRefObject<
    Record<string, number>
  >;
  pathname: string;
}

export const useContainerEventHandlers = ({
  lastSelectedIndexWhenInputModeWasDefaultMap,
  pathname,
}: UseContainerEventHandlerOptions) => {
  const dispatch = useDispatch();

  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));
  const ottDeviceInputMode = useAppSelector((state) => state.ottUI.inputMode);
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const isCWPromptActive = useAppSelector(isCWPromptActiveSelector);
  const isMyStuffPageActive = useAppSelector(state => isMyStuffPageActiveSelector(state, { pathname: location.pathname }));
  const updateActiveData = useUpdateActiveData();
  const ifBgImageMatchActiveContent = useAppSelector((state) => state.ottUI.background.ifBgImageMatchActiveContent);
  // sampling collection with 0.1 rate for the uiNavigation performance tracking
  const shouldTrackDuration = useAppSelector(uiNavigationPerformanceMetricEnabledSelector);
  const uiNavigationPerformanceTracking = UINavigationPerformanceTrackingManager.getInstance();

  const gridChangeCallback = (
    { endX: newIndex }: ContentRowOnChangeParams,
    toLoadMoreItems?: boolean
  ) => {
    shouldTrackDuration && uiNavigationPerformanceTracking.start(SCROLL_IN_CONTAINER_ROW_DELAY_METRIC);

    if (ottDeviceInputMode !== OTTInputMode.MOUSE) {
      lastSelectedIndexWhenInputModeWasDefaultMap.current[activeContainerId] = newIndex;
    }

    // stop the user back flow if navigating in a container on home grid, no need to back to the live tab
    dispatch(stopLiveTabUserBackFlow());

    if (isCWPromptActive) {
      return;
    }

    if (toLoadMoreItems) {
      dispatch(loadMoreItems(location, activeContainerId));
    }
    dispatch(
      navigateWithinContainerInGrid({
        location,
        containerId: activeContainerId,
        // set active gridIndex as an invalid value if cw prompt is active
        index: newIndex,
      })
    );

    updateActiveData();

    shouldTrackDuration && uiNavigationPerformanceTracking.end(
      SCROLL_IN_CONTAINER_ROW_DELAY_METRIC,
      OTT_ROUTES.home,
      {
        containerId: activeContainerId,
        index: newIndex,
        ifBgImageMatchActiveContent,
      },
      SCROLL_IN_CONTAINER_DETAILS_METRIC,
    );
  };

  const onGridChange = useEvent(gridChangeCallback);

  const { containersList } = useAppSelector(state => containerSelector(state, { pathname: location.pathname }));
  const discoveryRowActiveContainerId = useAppSelector(state => state.ottUI.discoveryRow.activeContainerId);

  const openLeftMenu = useOpenLeftNav();
  const scrollToContainer = useScrollToContainer();
  const resetContainerRowIndexFromMouseSelection = useResetContainerRowIndexFromMouseSelection({
    lastSelectedIndexWhenInputModeWasDefaultMap,
  });

  const trackedScrollToContainer = useCallback(
    (newIndex: number) => {
      // Mark the start.
      shouldTrackDuration && uiNavigationPerformanceTracking.start(SCROLL_TO_CONTAINER_DELAY_METRIC);
      // Run the actual code.
      scrollToContainer(newIndex);

      shouldTrackDuration && uiNavigationPerformanceTracking.end(
        SCROLL_TO_CONTAINER_DELAY_METRIC,
        OTT_ROUTES.home,
        {
          containerId: activeContainerId,
          index: newIndex,
          ifBgImageMatchActiveContent,
        },
        SCROLL_TO_CONTAINER_DETAILS_METRIC,
      );
    },
    [activeContainerId, ifBgImageMatchActiveContent, scrollToContainer, shouldTrackDuration, uiNavigationPerformanceTracking]
  );
  const isMyStuffLoginPromptActive = isMyStuffPageActive && isCWPromptActive;
  const onGridLeave = useEvent(
    (direction: string) => {
      const selectedContainerIndex = getSelectedContainerIndex(
        containersInMenu,
        activeContainerId
      );

      // stop the user back flow if navigating between different container on home grid, no need to back to the live tab
      dispatch(stopLiveTabUserBackFlow());

      switch (direction) {
        case 'ARROW_LEFT':
          openLeftMenu();
          break;
        case 'ARROW_UP':
          if (isMyStuffLoginPromptActive) break;
          if (
            isNextRowIndexValid(
              containersInMenu.length,
              selectedContainerIndex,
              direction
            )
          ) {
            resetContainerRowIndexFromMouseSelection(activeContainerId);
            trackedScrollToContainer(selectedContainerIndex - 1);
          }
          break;
        case 'ARROW_DOWN':
          if (isMyStuffLoginPromptActive) break;
          if (
            isNextRowIndexValid(
              containersInMenu.length,
              selectedContainerIndex,
              direction
            )
          ) {
            resetContainerRowIndexFromMouseSelection(activeContainerId);
            trackedScrollToContainer(selectedContainerIndex + 1);
          }
          break;
        default:
          break;
      }
    }
  );

  const throttledOnGridLeave = useMemo(
    () => throttle(onGridLeave, ON_GRID_LEAVE_THROTTLE_WAIT_TIME),
    [onGridLeave]
  );

  const isEspanolModeEnabled = useAppSelector(
    (state) => state.ui.isEspanolModeEnabled
  );

  const navigateFromGrid = useCallback(
    (url: string, useReplace = false) => {
      const query = isEspanolModeEnabled
        ? { espanol_mode: isEspanolModeEnabled }
        : {};

      if (useReplace) {
        tubiHistory.replace(addQueryStringToUrl(url, query));
      } else {
        tubiHistory.push(addQueryStringToUrl(url, query));
      }
    },
    [isEspanolModeEnabled]
  );
  const createNavigateToPageComponent = useCallback(
    (item: ContentItem, itemIndex: number) => {
      const isDiscoveryRowContainer = activeContainerId === discoveryRowActiveContainerId;
      let componentType: ValueOf<typeof ANALYTICS_COMPONENTS> = ANALYTICS_COMPONENTS.containerComponent;
      if (isMyStuffPageActive) {
        componentType = ANALYTICS_COMPONENTS.myStuffComponent;
      }
      // 0-based index for storing the component data for NAVIGATE_TO_PAGE event.
      trackingManager.createNavigateToPageComponent({
        startX: itemIndex,
        startY: isDiscoveryRowContainer ? (DISCOVERY_ROW_INDEX + 1) : containersList.indexOf(activeContainerId),
        containerSlug: activeContainerId,
        contentId: item.type === SERIES_CONTENT_TYPE ? `0${item.id}` : item.id,
        componentType,
      });
    },
    [activeContainerId, discoveryRowActiveContainerId, isMyStuffPageActive, containersList]
  );

  const shouldShowMatureContentModal = useAppSelector(
    shouldShowMatureContentModalSelector
  );
  const historyIdMap = useAppSelector((state) => state.history.contentIdMap);
  const byId = useAppSelector((state) => state.video.byId);
  const onGridPlay = useCallback(
    (
      item?: ContentItem,
      itemIndex = 0,
      enabledTypes = [VIDEO_CONTENT_TYPE]
    ) => {
      if (!item || !enabledTypes.includes(item.type) || isContainer(item)) {
        // Only do immediate playback for video tiles
        return;
      }

      if (isCWPromptActive) {
        return;
      }

      if (shouldShowMatureContentModal(item)) {
        dispatch(
          showMatureContentModal(pathname, {
            navigateFunction: navigateFromGrid,
          })
        );
      } else {
        createNavigateToPageComponent(item, itemIndex);
        const {
          resumeContentId,
          resumePosition,
        } = getVideoInfoForPlaying({
          content: item,
          byId,
          historyIdMap,
        });
        dispatch(setContainerContext(activeContainerId));
        dispatch(
          playFireVideo(resumeContentId, {
            pos: resumePosition,
            navigateFunction: navigateFromGrid,
          })
        );
      }
    },
    [
      activeContainerId,
      byId,
      createNavigateToPageComponent,
      dispatch,
      historyIdMap,
      isCWPromptActive,
      navigateFromGrid,
      pathname,
      shouldShowMatureContentModal,
    ]
  );

  const purpleCarpetContentsStatus = useAppSelector(purpleCarpetContentsStatusSelector);
  const shouldLockPurpleCarpet = useAppSelector(shouldLockPurpleCarpetSelector);
  const { isSupported: isSupportedPurpleCarpet, showUnsupportedDeviceModal } = useUnsupportedDeviceModal();
  const onGridSelect = useCallback(
    (item?: ContentItem, itemIndex = 0) => {
      if (isCWPromptActive) {
        // use category_component for navigate_to_page analytics event
        // set startX as -1 so that no content_tile is attached in the event
        trackingManager.createNavigateToPageComponent({
          startX: -1,
          startY: containersList.indexOf(activeContainerId),
          containerSlug: activeContainerId,
          componentType: ANALYTICS_COMPONENTS.containerComponent,
        });
        return dispatch(goToSignInPage());
      }

      let url:string;
      let isExpired = false;

      if (!item) return;

      if (isContainer(item)) {
        url = getContainerUrl(item.id, {
          ott: true,
          type: item.type,
        });
      } else {
        // video or series
        dispatch(setContainerContext(activeContainerId));

        const purpleCarpetContentStatus = purpleCarpetContentsStatus?.[item.id]?.status;
        const isBannerContent = activeContainerId === BANNER_CONTAINER_ID;
        const isPurpleCarpetContent = item.player_type === 'fox';
        // For purple carpet content(except banner content)
        // if it's not supported platform, we should show unsupported device modal
        if (isPurpleCarpetContent && !isBannerContent && !isSupportedPurpleCarpet) {
          showUnsupportedDeviceModal();
          return;
        }
        // For purple carpet content(except banner content)
        // we need user to sign in
        // and after sign in
        // if the content is live, we should take user to player page
        // if the content is not started. we should take user to details page so user can set reminder
        /* istanbul ignore next */
        if (purpleCarpetContentStatus && [PurpleCarpetContentStatus.Live, PurpleCarpetContentStatus.NotStarted].includes(purpleCarpetContentStatus) && !isBannerContent) {
          url = purpleCarpetContentStatus === PurpleCarpetContentStatus.Live ? `${OTT_LIVE_PLAYER_ROUTE_PREFIX}/${item.id}` : getUrlByVideo({ video: item as Video });
          if (item.needs_login && shouldLockPurpleCarpet) {
            dispatch(loginCallback(() => {
              createNavigateToPageComponent(item, itemIndex);
              dispatch(resetOTTHomeSelectedState(location, containersInMenu[0].id)); // reset the selected state to purple carpet content after user sign in
            }));
            dispatch(loginRedirect(url));
            dispatch(onLoginCanceled(() => {
              tubiHistory.goBack();
            }));
            return dispatch(goToSignInPage({ locationState: { dialogSubTypeForAmazon: 'game_signin' } }));
          }
        } else if (activeContainerId === SKINS_AD_CONTAINER_ID) {
          url = getAdPlayerUrl(item.id);
          dispatch(fireSkinsAdPixels('click_trackings'));
        } else {
          url = getUrlByVideo({ video: item as Video });
        }
        isExpired = isVideoExpired(item);
        // Currently the `availability_duration` is 0 for purple carpet content
        // we need to a hack for now
        // TODO: remove this after backend fix the bug
        /* istanbul ignore next */
        if (purpleCarpetContentStatus) {
          isExpired = false;
        }
      }
      // If users only move the cursor on the left nav option but they don't select.
      // The active option will be different from the location.
      // But we hope the active option will be the location of the gird when we get back from the detail page.
      // So we need to change the active option according to the location
      dispatch(
        setLeftNavOption(
          getActiveOptionFromLocation({ pathname })
        )
      );

      if (isExpired) {
        return dispatch(showExpiredModal(pathname));
      }

      createNavigateToPageComponent(item, itemIndex);
      navigateFromGrid(url);
    },
    [
      activeContainerId,
      containersList,
      createNavigateToPageComponent,
      dispatch,
      isCWPromptActive,
      navigateFromGrid,
      pathname,
      shouldLockPurpleCarpet,
      purpleCarpetContentsStatus,
      containersInMenu,
      location,
      isSupportedPurpleCarpet,
      showUnsupportedDeviceModal,
    ]
  );

  return {
    onGridChange,
    throttledOnGridLeave,
    onGridSelect,
    onGridPlay,
  };
};

export const useHandleGridBackButton = () => {
  const dispatch = useDispatch();
  const inLiveTabUserBackFlow = useAppSelector(
    (state) => !!state.ui.deeplinkBackOverrides[BACK_FROM_TUBI_TO_ENTRANCE]
  );
  const isNavOpen = useAppSelector((state) => state.ottUI.leftNav.isExpanded);
  const location = useLocation();
  const activeContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));

  const hasExitApi = getHasExitApi();

  // called on keyup and when back from ContentRow
  const handleGridBackButton = useCallback(
    (e: KeyboardEvent) => {
      if (inLiveTabUserBackFlow) {
        e.preventDefault();
        dispatch(exitTubi(hasExitApi));
        return;
      }

      if (!isNavOpen && activeContentMode !== CONTENT_MODES.all) {
        // When we press the back button for the first time on the content mode page,
        // we only want to open the left nav but not go back to the previous page.
        // So we need to prevent default behavior here.
        e.preventDefault();
      }
      dispatch(debouncedOpenLeftNav());
    },
    [
      activeContentMode,
      dispatch,
      hasExitApi,
      inLiveTabUserBackFlow,
      isNavOpen,
    ]
  );
  return handleGridBackButton;
};

const { global: GLOBAL_HOTKEYS } = getOTTHotkeys();
const REMOTE = getOTTRemote();

export const useHandleKeydown = () => {
  const openLeftMenu = useOpenLeftNav();
  const location = useLocation();
  const isSwitchingContentMode = useAppSelector(state => isSwitchingModeSelector(state, { pathname: location.pathname }));
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { keyCode } = e;
      if (!isOTTKeys(keyCode)) return;
      e.preventDefault();
      // When we are loading the whole container, user can still access left and top nav
      if (isSwitchingContentMode) {
        switch (keyCode) {
          case REMOTE.arrowLeft:
            openLeftMenu();
            break;
          default:
            break;
        }
      }
      switch (keyCode) {
        case GLOBAL_HOTKEYS.search:
          tubiHistory.push(OTT_ROUTES.search);
          break;
        default:
          break;
      }
    },
    [
      isSwitchingContentMode,
      openLeftMenu,
    ]
  );
  useKeydownHandler(handleKeyDown);
};

export const useResetOTTHomeSelectedStateIfNeeded = () => {
  const mounted = useRef<boolean>();
  const dispatch = useDispatch();
  const location = useLocation();
  const isSwitchingContentMode = useAppSelector(state => isSwitchingModeSelector(state, { pathname: location.pathname }));
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const activeContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));
  const isEPGActive = activeContentMode === CONTENT_MODES.linear;

  const { containersList, nextContainerIndexToLoad } = useAppSelector(state => containerSelector(state, { pathname: location.pathname }));
  const isActiveContainerAvailable = containersList.includes(activeContainerId);
  const isMyStuffPageActive = useAppSelector(state => isMyStuffPageActiveSelector(state, { pathname: location.pathname }));
  const isHomeOrContentModePage = useAppSelector(state => isHomeOrContentModePageSelector(state, { pathname: location.pathname }));

  // reset selected state when content mode is switched on OTTHome and containersInMenu has just been loaded - there are two cases
  // 1. if containersInMenu has already been loaded, we can just reset when activeContentMode is changed except the EPG page
  // 2. if containersInMenu has not been loaded, it would be an empty array at first, we need to reset after it has been loaded
  // For My Stuff page, we should reset the active container ID to the first one available, as it might be set to the featured by accident
  const resetOTTHomeSelectedStateIfNeeded = () => {
    if (
      (isHomeOrContentModePage
        && !isSwitchingContentMode
        && containersInMenu.length
        && !isEPGActive)
      || (isMyStuffPageActive && !isActiveContainerAvailable)
    ) {
      dispatch(resetOTTHomeSelectedState(location, containersInMenu[0].id));
    }
  };

  const hasValidContainers = !!containersInMenu.length && nextContainerIndexToLoad !== 0;
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (hasValidContainers) {
      resetOTTHomeSelectedStateIfNeeded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidContainers, activeContentMode]);
};
type UseResetContainerRowIndexFromMouseSelectionIfNeeded =
  UseResetContainerRowIndexFromMouseSelectionOptions;
export const useResetContainerRowIndexFromMouseSelectionIfNeeded = (
  options: UseResetContainerRowIndexFromMouseSelectionIfNeeded
) => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const isGridActive = useAppSelector(isGridActiveSelector);
  const lastActiveContainerId = usePrevious(activeContainerId);
  const resetContainerRowIndexFromMouseSelection = useResetContainerRowIndexFromMouseSelection(options);
  useEffect(() => {
    if (isGridActive && lastActiveContainerId) {
      resetContainerRowIndexFromMouseSelection(lastActiveContainerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGridActive]);
};

export const useCleanUpWhenUnmounting = () => {
  const dispatch = useDispatch();
  const showModal = useAppSelector((state) => state.fire.showModal);
  useEffect(() => {
    return () => {
      if (showModal) {
        dispatch(hideModal());
      }

      // stop the user back flow if OTTHome component will unmount, e.g. the live news player is fullscreen after 10s count down
      // no need to back to the live tab
      dispatch(stopLiveTabUserBackFlow());

      // clear the flag for any sponsorship pixels fired for page
      dispatch(clearPixelsFired('homescreen'));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const useShowModalsWhenMounting = (location: Location) => {
  const { shouldShowHomeRegistrationPrompt } = location.state || {};
  const dispatch = useDispatch();
  const eligibilityModalType = useAppSelector(
    (state) => state.ottUI.ageGate.eligibilityModalType
  );
  const hybridAppVersion = useAppSelector((state) => state.fire.appVersion);
  const isAgeGateRequired = useAppSelector(isAgeGateRequiredSelector);
  const isDeprecatedHybBuild = useAppSelector(({ fire, ui }) =>
    getIsDeprecatedHybBuild(ui.userAgent, fire.appVersion.code)
  );
  const samsungCWSupport = useAppSelector(cwSupportedVersionOnSamsungSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isShowingAnotherModal = useAppSelector(isModalShownSelector);
  const inAppMessage = useAppSelector(state => state.fire.inAppMessage);
  const shouldShowInAppMessagePrompt = inAppMessage.showPrompt && inAppMessage.messageContents;

  useEffect(() => {
    if (
      isDeprecatedHybBuild
      || (shouldShowUpdateAppModal(__OTTPLATFORM__, hybridAppVersion)
        && !getCookie(HAS_VIEWED_UPDATE_APP_COOKIE)
        && __PRODUCTION__)
    ) {
      dispatch(
        showUpdateTubiModal({
          pageType: PAGE_TYPE.OTT_HOME,
          dismissable: !isDeprecatedHybBuild,
          dismiss: () => {
            dispatch(hideModal());
          },
          dispatch,
        })
      );

      if (!isDeprecatedHybBuild) {
        // set cookie to expire in 1 day (1 day = 86400 seconds)
        setCookie(HAS_VIEWED_UPDATE_APP_COOKIE, 'true', 86400);
      }
    }

    if (
      __OTTPLATFORM__ === 'TIZEN'
      && isLoggedIn
      && !getLocalData(HAS_VIEWED_CW_UG_INTEGRATION_NOTIFICATION)
      && samsungCWSupport
    ) {
      dispatch(
        showSamsungCWNotificationModal({
          hideModal: () => dispatch(hideModal()),
          samsungCWSupport,
        })
      );
      setLocalData(HAS_VIEWED_CW_UG_INTEGRATION_NOTIFICATION, 'true');
    }

    if (isAgeGateRequired) {
      dispatch(showAgeGateComponent(true));
    }

    if (!isLoggedIn) {
      if (shouldShowHomeRegistrationPrompt) {
        tubiHistory.replace({
          ...location,
          state: {
            ...location.state,
            shouldShowHomeRegistrationPrompt: false,
          },
        });
        dispatch(showRegistrationPromptModal());
      }
    }

    if (__OTTPLATFORM__ === 'FIRETV_HYB' && !isShowingAnotherModal && shouldShowInAppMessagePrompt && location.pathname === OTT_ROUTES.home) {
      dispatch(showInAppMessageModal());
    }

    if (eligibilityModalType !== KidsModeEligibilityModalTypes.NONE) {
      dispatch(
        showKidsModeEligibilityModal({
          dispatch,
          eligibilityModalType,
        })
      );
    }
    // This will be problematic if we enable strict mode on development on React 18
    // since React will run useEffect twice to help check the potential problems
    // see https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-strict-mode
    // we need fix this when we upgrade to React 18 and enable strict mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowInAppMessagePrompt, location]);
};

export const useHandleChoresWhenMounting = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));

  const previousContentMode = useAppSelector(previousContentModeSelector);
  const activeContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));
  const isEPGEnabled = useAppSelector(shouldShowOTTLinearContentSelector);
  const isEPGActive = activeContentMode === CONTENT_MODES.linear && isEPGEnabled;
  const { containersList } = useAppSelector(state => containerSelector(state, { pathname: location.pathname }));
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const isActiveContainerAvailable = containersList.includes(activeContainerId);
  const isMyStuffPageActive = useAppSelector(state => isMyStuffPageActiveSelector(state, { pathname: location.pathname }));
  const shouldShowPurpleCarpet = useAppSelector(shouldShowPurpleCarpetSelector);
  const contentLoaded = !!containersInMenu.length;
  const shouldShowSkinsAd = useShouldShowSkinsAd() && containersList.includes(SKINS_AD_CONTAINER_ID);
  const hasResetIndex = useAppSelector(state => state.purpleCarpet.hasResetIndex);

  // Hide the spinner after the content is loaded.
  useHideLoadingSpinner();

  useEffect(() => {
    if (contentLoaded && (shouldShowPurpleCarpet || shouldShowSkinsAd) && (activeContentMode !== previousContentMode || !hasResetIndex)) {
      dispatch(resetOTTHomeSelectedState(location, containersInMenu[0].id));
      dispatch(actionWrapper(actions.SET_PURPLE_CARPET_INDEX_STATE, { hasResetIndex: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowPurpleCarpet, contentLoaded]);

  useEffect(() => {
    if (shouldShowPurpleCarpet) {
      preloadPurplescripts();
    }
  }, [shouldShowPurpleCarpet]);

  useEffect(() => {
    // Need to jump back to the first container when we are entering a new mode except the EPG page
    // if containersInMenu has not been loaded, it would be an empty array at first, we will reset after it has been loaded
    // For My Stuff page, we should reset the active container ID to the first one available, as it might be set to the featured by accident
    if (
      containersInMenu.length &&
      (
        (
          // Ensures that if the user is navigating back to the home grid from the player
          // after having interacted with browse while watching, we do not reset
          // the selected container
          previousContentMode !== CONTENT_MODES.browseWhileWatching
          && activeContentMode !== previousContentMode
          && !isEPGActive
        )
        || (isMyStuffPageActive && !isActiveContainerAvailable)
      )
    ) {
      dispatch(resetOTTHomeSelectedState(location, containersInMenu[0].id));
    }

    handleSignOutEvent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const useSpotlightExperiment = () => {
  return useExperiment(ottFireTVSpotlightCarouselNav);
};

export const useIsSpotlightPath = () => {
  const { pathname } = useLocation();
  const notLiveMode = !pathname.startsWith(OTT_ROUTES.liveMode);
  return notLiveMode && (isHomeGridPathname(pathname) || pathname.startsWith(OTT_ROUTES.espanolMode));
};

export const useIsSpotlightEnabled = () => {
  const isSpotlightSupportedPath = useIsSpotlightPath();
  const location = useLocation();
  const isSpotlightEnabled = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname })) === 'featured' && !__IS_SLOW_PLATFORM__ && isSpotlightSupportedPath;

  const isPurpleCarpetContent = useAppSelector(state => isPurpleCarpetContentActiveSelector(state, { pathname: location.pathname }));
  const shouldShowPurpleCarpet = useAppSelector(shouldShowPurpleCarpetSelector);
  const isDetailsPage = isDetailsPageUrl(location.pathname);

  const shouldUsePurpleCarpet = shouldShowPurpleCarpet && isPurpleCarpetContent && (isSpotlightSupportedPath || isDetailsPage);

  const isSkinsAdRowActive = useIsSkinsAdRowActive();

  return (useSpotlightExperiment().getValue() && isSpotlightEnabled) || shouldUsePurpleCarpet || isSkinsAdRowActive;
};

export const useShouldShowSkinsAd = () => {
  const { pathname } = useLocation();
  return useAppSelector(state => shouldShowSkinsAdSelector(state, { pathname }));
};

export const useIsSkinsAdRowActive = () => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  return useShouldShowSkinsAd() && activeContainerId === SKINS_AD_CONTAINER_ID;
};
