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
import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
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
} from 'common/actions/modal';
import { KidsModeEligibilityModalTypes, showAgeGateComponent } from 'common/actions/ottUI';
import { exitTubi, stopLiveTabUserBackFlow } from 'common/actions/ui';
import {
  HDC_AD_DISABLE_HOME_LOWER_SECTION_TRANSITION,
  SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT,
} from 'common/constants/action-types';
import {
  BACK_FROM_TUBI_TO_ENTRANCE,
  CONTENT_MODES,
  DISCOVERY_ROW_INDEX,
  SERIES_CONTENT_TYPE,
  VIDEO_CONTENT_TYPE,
} from 'common/constants/constants';
import { HAS_VIEWED_CW_UG_INTEGRATION_NOTIFICATION } from 'common/constants/cookies';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { DEFAULT_FPS_MAX_SCROLL_SAMPLES, DEFAULT_FPS_FRAMES_PER_SAMPLE, DEFAULT_FPS_BATCHES_PER_SAMPLE } from 'common/constants/performance-metrics';
import { OTT_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { DEBOUNCE_BACKGROUND_IMAGE_VARIANT } from 'common/experiments/config/ottFireTVDebounceBackgroundImageRerun';
import ottFireTVSpotlightCarouselNav from 'common/experiments/config/ottFireTVSpotlightCarouselNav';
import {
  goToSignInPage,
} from 'common/features/authentication/actions/auth';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { handleSignOutEvent } from 'common/features/authentication/utils/signOutStatus';
import { isAgeGateRequiredSelector } from 'common/features/coppa/selectors/coppa';
import { setHdcAdPlayFinished } from 'common/features/hdcAd/action';
import { HDC_CAROUSEL, HDC_CONTAINER_PREFIX } from 'common/features/hdcAd/constants';
import { getAdPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import { fireWrapperPixels } from 'common/features/wrapper/action';
import { WRAPPER_CONTAINER_ID } from 'common/features/wrapper/constants';
import { shouldShowWrapperSelector } from 'common/features/wrapper/selector';
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
import { shouldShowPivotsSelector } from 'common/selectors/experiments/ottFireTVHomegridPivots';
import { uiNavigationPerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { cwSupportedVersionOnSamsungSelector, isModalShownSelector, shouldShowMatureContentModalSelector } from 'common/selectors/fire';
import { isVideoTileRowSelector } from 'common/selectors/ottHomegridVideoTiles/isVideoTileRowSelector';
import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import { isGridActiveSelector } from 'common/selectors/ottUI';
import trackingManager from 'common/services/TrackingManager';
import type { ContentItem } from 'common/types/fire';
import { isContainer } from 'common/types/fire';
import { OTTInputMode } from 'common/types/ottUI';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { safeRequestAnimationFrame, safeRequestIdleCallback } from 'common/utils/async';
import { convertObjectValueToString } from 'common/utils/format';
import { getOTTHotkeys, getOTTRemote, isOTTKeys } from 'common/utils/keymap';
import { trackLogging } from 'common/utils/track';
import { getContainerUrl, getUrlByVideo } from 'common/utils/urlConstruction';
import type { OnChangeParams as ContentRowOnChangeParams } from 'ott/components/ContentRow/ContentRow';
import { getActiveOptionFromLocation } from 'ott/components/OTTLeftNavContainer/withLeftNav';
import { trackNavigateToPivots } from 'ott/components/Pivots/analytics';
import type { Pivot } from 'ott/components/Pivots/types';
import type { UseResetContainerRowIndexFromMouseSelectionOptions } from 'ott/containers/Home/useResetContainerRowIndexFromMouseSelection';
import { useResetContainerRowIndexFromMouseSelection } from 'ott/containers/Home/useResetContainerRowIndexFromMouseSelection';
import { getVideoInfoForPlaying } from 'ott/features/playback/utils/getVideoInfoForPlaying';
import { useHideLoadingSpinner } from 'ott/hooks/useHideLoadingSpinner';
import { isVideoExpired } from 'ott/utils/expiration';
import { getSelectedContainerIndex, isNextRowIndexValid } from 'ott/utils/homegrid';
import { isHomeGridPathname } from 'ott/utils/leftNav';

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
  const debounceBackgroundExperimentValue = useAppSelector(ottFireTVDebounceBackgroundExperimentSelector);
  const useShortDebounceTiming = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_short_debounce_timing;
  const neverSetImageExpire = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.never_set_image_expire;
  const useLeadingDebounce = debounceBackgroundExperimentValue === DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_leading_debounce;
  const showLiveVideoBackground = useAppSelector(state => homeBgSelector(state, { pathname: location.pathname }).showLiveVideoBackground);
  const isVideoTileActive = useAppSelector(state => isVideoTileRowSelector(state, { pathname: location.pathname }));
  const isHdcAdRowActive = useIsHdcAdRowActive();
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
  const updateActiveData = useCallback((newContainerId?: string) => {
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

    // if the new container id is a hdc ad row, we should set the home active data immediately
    const isNewContainerIdHdcAdRow = newContainerId?.startsWith(HDC_CONTAINER_PREFIX);

    if (isVideoTileActive || isHdcAdRowActive || isNewContainerIdHdcAdRow) {
      // if a video tile is active before setting home active data, we should
      // do it immediately instead of after a debounce delay. This ensures that
      // when navigating from a video tile to a regular tile, the preview image
      // doesn't first change to the bg of the video tile and then transition to
      // the bg of the new tile. It's better to go straight to the bg of the new
      // tile.
      setBackgroundImageExpire(dispatch);
      dispatch(setHomeActiveData(location));
    } else {
      if (!neverSetImageExpire && debouncedSetBackgroundImageExpire) {
        debouncedSetBackgroundImageExpire(dispatch);
      }
      debouncedSetHomeActiveData(dispatch, location);
    }
  }, [showLiveVideoBackground, isVideoTileActive, isHdcAdRowActive, neverSetImageExpire, dispatch, handleSetHomeActiveData, location, debouncedSetBackgroundImageExpire]);
  return updateActiveData;
};

/**
 * React Hook for measuring FPS during scroll.
 *
 * For each direction (e.g. 'horizontal', 'vertical'), this hook allows you to:
 * - Trigger FPS measurement manually during scroll using `triggerFPSMonitor({ direction })`
 * - Collect multiple scroll-triggered samples (default: 5)
 * - Average FPS across those samples
 * - Ensure no duplicate or overlapping measurements per direction
 * - Send the final average FPS to the client logs after all samples are collected
 *
 * Usage example:
 * ```
 * const { triggerFPSMonitor } = useFPSTracker({
 *   maxScrollSamplesPerDirection: 5,
 * });
 *
 * // When a scroll occurs:
 * triggerFPSMonitor({ direction: 'vertical' }); // or 'horizontal'
 * ```
 */
export const useFPSTracker = ({
  // Maximum number of scroll-triggered FPS samples to collect per direction. Default 5
  maxScrollSamplesPerDirection = DEFAULT_FPS_MAX_SCROLL_SAMPLES,
  // Number of frames to record in each sample batch. Default 60
  framesPerSingleSample = DEFAULT_FPS_FRAMES_PER_SAMPLE,
  // Number of batches to aggregate for one complete FPS sample. Default 5
  batchesPerSample = DEFAULT_FPS_BATCHES_PER_SAMPLE,
  // Threshold for low FPS count (e.g., count how many batches are below 30 FPS)
  lowFPSThreshold = 30,
}) => {
  const isSamplingRef = useRef(false);
  const reportedRef = useRef<Record<string, boolean>>({});
  const fpsStoreRef = useRef<Record<string, number[]>>({});
  const sampleCountRef = useRef<Record<string, number>>({});
  const model = useAppSelector(state => state.ottSystem.deviceModel);

  const triggerFPSMonitor = useCallback(({ direction }: { direction: 'horizontal' | 'vertical' }) => {
    if (reportedRef.current[direction] || isSamplingRef.current) return;

    isSamplingRef.current = true;

    let frameCount = 0;
    const fpsList: number[] = [];
    let startTime = performance.now();
    let lowestFPS = Infinity;
    let lowFPSCount = 0;

    const frameCallback = (timestamp: number) => {
      frameCount++;

      if (frameCount % framesPerSingleSample === 0) {
        const duration = timestamp - startTime;
        const fps = (framesPerSingleSample * 1000) / duration;
        fpsList.push(fps);
        startTime = timestamp;

        if (fps < lowestFPS) {
          lowestFPS = fps;
        }

        if (fps < lowFPSThreshold) {
          lowFPSCount++;
        }
      }

      if (fpsList.length >= batchesPerSample) {
        const avg = fpsList.reduce((a, b) => a + b, 0) / fpsList.length || 0;

        if (!fpsStoreRef.current[direction]) fpsStoreRef.current[direction] = [];
        fpsStoreRef.current[direction].push(avg);

        sampleCountRef.current[direction] = (sampleCountRef.current[direction] || 0) + 1;
        isSamplingRef.current = false;

        if (sampleCountRef.current[direction] >= maxScrollSamplesPerDirection) {
          const results = fpsStoreRef.current[direction];
          const finalAvg = results.reduce((a, b) => a + b, 0) / results.length;

          reportedRef.current[direction] = true;

          const finalize = () => {
            trackLogging({
              type: TRACK_LOGGING.clientInfo,
              subtype: LOG_SUB_TYPE.FPS,
              message_map: convertObjectValueToString({
                avgFPS: finalAvg.toFixed(2),
                lowestFPS: lowestFPS.toFixed(2),
                lowFPSCount,
                model,
                direction,
              }),
            });
          };

          safeRequestIdleCallback(finalize);
        }

        return;
      }

      safeRequestAnimationFrame(frameCallback);
    };

    safeRequestAnimationFrame(frameCallback);
  }, [framesPerSingleSample, batchesPerSample, model, maxScrollSamplesPerDirection, lowFPSThreshold]);

  return { triggerFPSMonitor, fpsStoreRef };
};

const useScrollToContainer = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));
  const currentContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));

  const updateActiveData = useUpdateActiveData();

  const scrollToContainer = useCallback(
    (newIndex: number) => {
      const newContainerId = containersInMenu[newIndex].id;
      dispatch(
        setOttSelectedContainer({
          location,
          containerId: newContainerId,
        })
      );

      if (currentContentMode !== CONTENT_MODES.search) {
        dispatch(lazyloadHomeScreen({ location }));
      }
      updateActiveData(newContainerId);
    },
    [dispatch, location, containersInMenu, currentContentMode, updateActiveData]
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
  enterPivots?: () => void;
  focusedPivot?: Pivot;
  focusedPivotIndex?: number;
}

export const useContainerEventHandlers = ({
  lastSelectedIndexWhenInputModeWasDefaultMap,
  pathname,
  enterPivots,
  focusedPivot,
  focusedPivotIndex,
}: UseContainerEventHandlerOptions) => {
  const dispatch = useDispatch();

  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));
  const ottDeviceInputMode = useAppSelector((state) => state.ottUI.inputMode);
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const isCWPromptActive = useAppSelector(isCWPromptActiveSelector);
  const isMyStuffPageActive = useAppSelector(state => isMyStuffPageActiveSelector(state, { pathname: location.pathname }));
  const updateActiveData = useUpdateActiveData();
  // sampling collection with 0.1 rate for the uiNavigation performance tracking
  const shouldTrackDuration = useAppSelector(uiNavigationPerformanceMetricEnabledSelector);

  const { triggerFPSMonitor } = useFPSTracker({});

  const gridChangeCallback = (
    { endX: newIndex }: ContentRowOnChangeParams,
    toLoadMoreItems?: boolean
  ) => {
    shouldTrackDuration && triggerFPSMonitor({ direction: 'vertical' });

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
  };

  const onGridChange = useEvent(gridChangeCallback);

  const containersList = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));
  const isPivotsVisible = useAppSelector(state => shouldShowPivotsSelector(state, { pathname: location.pathname }));
  const discoveryRowActiveContainerId = useAppSelector(state => state.ottUI.discoveryRow.activeContainerId);

  const openLeftMenu = useOpenLeftNav();
  const scrollToContainer = useScrollToContainer();
  const resetContainerRowIndexFromMouseSelection = useResetContainerRowIndexFromMouseSelection({
    lastSelectedIndexWhenInputModeWasDefaultMap,
  });

  const shouldDisableHomeLowerSectionTransition = useCallback((selectedContainerIndex: number) => {
    const isDisabled = containersInMenu[selectedContainerIndex]?.id.startsWith(HDC_CONTAINER_PREFIX);
    dispatch(actionWrapper(HDC_AD_DISABLE_HOME_LOWER_SECTION_TRANSITION, { payload: { disabled: isDisabled } }));
  }, [containersInMenu, dispatch]);

  const trackedScrollToContainer = useCallback(
    (newIndex: number) => {
      shouldTrackDuration && triggerFPSMonitor({ direction: 'horizontal' });
      // Run the actual code.
      scrollToContainer(newIndex);
      dispatch(setHdcAdPlayFinished(false));
    },
    [dispatch, scrollToContainer, shouldTrackDuration, triggerFPSMonitor]
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
            shouldDisableHomeLowerSectionTransition(selectedContainerIndex - 1); // target container is HDC Ad
          } else if (isPivotsVisible && enterPivots) {
            enterPivots();
            /* istanbul ignore else */
            if (focusedPivotIndex != null && focusedPivot != null) {
              dispatch(trackNavigateToPivots({
                index: focusedPivotIndex,
                pivot: focusedPivot,
                meansOfNavigation: 'BUTTON',
                componentType: ANALYTICS_COMPONENTS.containerComponent,
              }));
            }
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
            shouldDisableHomeLowerSectionTransition(selectedContainerIndex); // current container is HDC Ad
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
        startY: isDiscoveryRowContainer ? (DISCOVERY_ROW_INDEX + 1) : containersList.findIndex((c) => c.id === activeContainerId),
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

  const onGridSelect = useCallback(
    (item?: ContentItem, itemIndex = 0) => {
      if (isCWPromptActive) {
        // use category_component for navigate_to_page analytics event
        // set startX as -1 so that no content_tile is attached in the event
        trackingManager.createNavigateToPageComponent({
          startX: -1,
          startY: containersList.findIndex((c) => c.id === activeContainerId),
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
        if (activeContainerId === WRAPPER_CONTAINER_ID) {
          url = getAdPlayerUrl(item.id);
          dispatch(fireWrapperPixels('click_trackings'));
        } else {
          url = getUrlByVideo({ video: item as Video });
        }
        isExpired = isVideoExpired(item);
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
    ]
  );

  return {
    onGridChange,
    throttledOnGridLeave,
    onGridSelect,
    onGridPlay,
  };
};

export const useHandleGridBackButton = (enterPivots: () => void) => {
  const dispatch = useDispatch();
  const inLiveTabUserBackFlow = useAppSelector(
    (state) => !!state.ui.deeplinkBackOverrides[BACK_FROM_TUBI_TO_ENTRANCE]
  );
  const isNavOpen = useAppSelector((state) => state.ottUI.leftNav.isExpanded);
  const location = useLocation();
  const activeContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));

  const hasExitApi = getHasExitApi();
  const isPivotsVisible = useAppSelector(state => shouldShowPivotsSelector(state, { pathname: location.pathname }));

  // called on keyup and when back from ContentRow
  const handleGridBackButton = useCallback(
    (e: KeyboardEvent) => {
      if (inLiveTabUserBackFlow) {
        e.preventDefault();
        dispatch(exitTubi(hasExitApi));
        return;
      }

      if (isPivotsVisible) {
        e.preventDefault();
        enterPivots();
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
    [activeContentMode, dispatch, enterPivots, hasExitApi, inLiveTabUserBackFlow, isNavOpen, isPivotsVisible]
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
  options: UseResetContainerRowIndexFromMouseSelectionIfNeeded & {isPivotsFocused: boolean}
) => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const { isPivotsFocused, ...otherOptions } = options;
  const isGridActive = useAppSelector(state => isGridActiveSelector(state, { isPivotsFocused }));
  const lastActiveContainerId = usePrevious(activeContainerId);
  const resetContainerRowIndexFromMouseSelection = useResetContainerRowIndexFromMouseSelection(otherOptions);
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
  const isAgeGateRequired = useAppSelector(isAgeGateRequiredSelector);
  const samsungCWSupport = useAppSelector(cwSupportedVersionOnSamsungSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isShowingAnotherModal = useAppSelector(isModalShownSelector);
  const inAppMessage = useAppSelector(state => state.fire.inAppMessage);
  const shouldShowInAppMessagePrompt = inAppMessage.showPrompt && inAppMessage.messageContents;

  useEffect(() => {
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

type DidResetIndexMap = {
  CONTENT_MODE_VALUE?: boolean;
};

let didResetIndexMap: DidResetIndexMap = {};

/**
 * Test helper function to reset hasResetIndex
 */
export const _resetDidResetIndexMap = (map: typeof didResetIndexMap) => {
  didResetIndexMap = map;
};

export const useHandleChoresWhenMounting = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const containersInMenu = useAppSelector(state => ottSideMenuSelector(state, { pathname: location.pathname }));

  const previousContentMode = useAppSelector(previousContentModeSelector);
  const activeContentMode = useAppSelector(state => currentContentModeSelector(state, { pathname: location.pathname }));
  const isEPGEnabled = useAppSelector(shouldShowOTTLinearContentSelector);
  const isEPGActive = activeContentMode === CONTENT_MODES.linear && isEPGEnabled;
  const contentLoaded = !!containersInMenu.length;
  const firstContainerId = containersInMenu[0]?.id;

  // Hide the spinner after the content is loaded.
  useHideLoadingSpinner();

  useEffect(() => {
    if (isEPGActive) {
      // don't reset the active container id if the EPG is active
      return;
    }
    if (!contentLoaded) {
      // we don't have data yet, so there's nothing to reset the active container id to
      return;
    }
    if (activeContentMode === previousContentMode && didResetIndexMap[previousContentMode]) {
      // we've stayed on the same content mode and we already reset the initial
      // container id earlier, so we should not do it again. This way if they
      // navigate to another page (like the details page) and then back to the
      // grid, their previous selection will not be wiped out.
      return;
    }
    // reset the initial container id to the first available container id
    dispatch(resetOTTHomeSelectedState(location, firstContainerId, { track: false }));
    didResetIndexMap[activeContentMode] = true;
  }, [activeContentMode, previousContentMode, dispatch, location, firstContainerId, contentLoaded, isEPGActive]);

  useEffect(() => {
    handleSignOutEvent();
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

  const isWrapperRowActive = useIsWrapperRowActive();
  const isHdcAdRowActive = useIsHdcAdRowActive();
  return (useSpotlightExperiment().getValue() && isSpotlightEnabled) || isWrapperRowActive || isHdcAdRowActive;
};

export const useShouldShowWrapper = () => {
  const { pathname } = useLocation();
  const shouldShowWrapper = useAppSelector(state => shouldShowWrapperSelector(state, { pathname }));

  return shouldShowWrapper;
};

export const useIsWrapperRowActive = () => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  return useShouldShowWrapper() && activeContainerId === WRAPPER_CONTAINER_ID;
};

export const useIsHdcAdRowActive = () => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  return activeContainerId.startsWith(HDC_CONTAINER_PREFIX);
};

export const useIsHdcCarouselAdRowActive = () => {
  const location = useLocation();
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  return activeContainerId.startsWith(HDC_CAROUSEL);
};
