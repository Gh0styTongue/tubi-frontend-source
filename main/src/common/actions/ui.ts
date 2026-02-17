import Analytics from '@tubitv/analytics';
import { AppMode } from '@tubitv/analytics/lib/client';
import get from 'lodash/get';
import type { ThunkAction } from 'redux-thunk';

import { clearSnapshot } from 'client/snapshot';
import systemApi from 'client/systemApi';
import { getExitFunction } from 'client/systemApi/utils';
import { setAnalyticsConfig } from 'common/actions/tracking';
import { isUserNotCoppaCompliantSelector, isInCoppaLenientCountry } from 'common/features/coppa/selectors/coppa';
import { loadGDPRConsent, setGDPRConsentForKidsMode } from 'common/features/gdpr/actions/consent';
import { isInGDPRCountrySelector } from 'common/features/gdpr/selectors/gdpr';
import logger from 'common/helpers/logging';
import { isScreensaverVisibleSelector } from 'common/selectors/ui';
import trackingManager from 'common/services/TrackingManager';
import { actionWrapper } from 'common/utils/action';
import { isSlowDevice } from 'common/utils/capabilityDetection';
import { findIndex } from 'common/utils/collection';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import { getResumeInfo } from 'common/utils/getResumeInfo';
import { alwaysResolve } from 'common/utils/promise';
import { setKidsModeStatusInCookie } from 'common/utils/webKidsModeTools';
import { getIntl } from 'i18n/intl';
import { getDeviceFidelity } from 'ott/utils/uiFidelity';
import * as notificationTypes from 'web/components/TubiNotifications/notificationTypes';

import { loadHistory } from './history';
import { loadSeriesEpisodeMetadata, setResumePosition } from './video';
import * as actionTypes from '../constants/action-types';
import type { CONTENT_MODE_VALUE } from '../constants/constants';
import { BACK_FROM_TUBI_TO_ENTRANCE } from '../constants/constants';
import type ApiClient from '../helpers/ApiClient';
import type { TubiThunkDispatch } from '../types/reduxThunk';
import type StoreState from '../types/storeState';
import type * as uiTypes from '../types/ui';

export function setWaitingOnVoiceCommand(
  isWaiting: uiTypes.SetWaitingonVoiceCommandAction['waitingOnVoiceCommand']
): uiTypes.SetWaitingonVoiceCommandAction {
  return {
    type: actionTypes.SET_WAITING_ON_VOICE_COMMAND,
    waitingOnVoiceCommand: isWaiting,
  };
}

export function setFullscreen(isFullscreen: boolean): uiTypes.EnterFullscreenAction | uiTypes.ExitFullscreenAction {
  return {
    type: isFullscreen ? actionTypes.ENTER_FULLSCREEN : actionTypes.EXIT_FULLSCREEN,
  };
}

export function setScrolledToTop(
  scrolledToTop: uiTypes.SetScrolledToTopAction['scrolledToTop']
): uiTypes.SetScrolledToTopAction {
  return {
    type: actionTypes.SET_SCROLLED_TO_TOP,
    scrolledToTop,
  };
}

export function setTopNavVisibleState(isVisible: boolean): uiTypes.ShowTopNavAction | uiTypes.HideTopNavAction {
  return {
    type: isVisible ? actionTypes.SHOW_TOP_NAV : actionTypes.HIDE_TOP_NAV,
  };
}

export function setLiveNewsMenuVisibleState(
  isVisible: boolean
): uiTypes.ShowLiveNewsMenuAction | uiTypes.HideLiveNewsMenuAction {
  return {
    type: isVisible ? actionTypes.SHOW_LIVE_NEWS_MENU : actionTypes.HIDE_LIVE_NEWS_MENU,
  };
}

export function toggleContainerMenu(): uiTypes.ToggleContainerMenuAction {
  return {
    type: actionTypes.TOGGLE_CONTAINER_MENU,
  };
}

export function showContainerMenu(): uiTypes.ShowContainerMenuAction {
  return {
    type: actionTypes.SHOW_CONTAINER_MENU,
  };
}

export function hideContainerMenu(): uiTypes.HideContainerMenuAction {
  return {
    type: actionTypes.HIDE_CONTAINER_MENU,
  };
}

export function setTouchDevice(
  isTouchDevice: uiTypes.SetTouchDeviceAction['isTouchDevice']
): uiTypes.SetTouchDeviceAction {
  return {
    type: actionTypes.SET_TOUCH_DEVICE,
    isTouchDevice,
  };
}

export function toggleAccountCardVisible(): uiTypes.ToggleAccountCardAction {
  return {
    type: actionTypes.TOGGLE_ACCOUNT_CARD,
  };
}

// see type LanguageLocaleType for userLanguage type
export function setUserLanguageLocale(
  userLanguageLocale: uiTypes.SetUserLanguageAction['userLanguageLocale']
): uiTypes.SetUserLanguageAction {
  return {
    type: actionTypes.SET_USER_LANGUAGE,
    userLanguageLocale,
  };
}

export function setTwoDigitCountryCode(
  twoDigitCountryCode: uiTypes.SetTwoDigitCountryCodeAction['twoDigitCountryCode']
): uiTypes.SetTwoDigitCountryCodeAction {
  return {
    type: actionTypes.SET_TWO_DIGIT_COUNTRY_CODE,
    twoDigitCountryCode,
  };
}

export function setPreferredLocale(
  preferredLocale: uiTypes.SetPreferredLocaleAction['preferredLocale']
): uiTypes.SetPreferredLocaleAction {
  return {
    type: actionTypes.SET_PREFERRED_LOCALE,
    preferredLocale,
  };
}

/**
 * setting the userAgent data to state
 */
export function setUserAgent(userAgent: uiTypes.SetUserAgentAction['userAgent']): uiTypes.SetUserAgentAction {
  let isMobile = false;
  if (userAgent.device.type) {
    if (userAgent.device.type.toLowerCase() === 'mobile' || userAgent.device.type.toLowerCase() === 'tablet') {
      isMobile = true;
    }
  }
  return {
    type: actionTypes.SET_USER_AGENT,
    /**
     * is_mobile is always false when the platform is OTT.
     * This needs to be set only for web and mobile web platforms.
     */
    isMobile: __ISOTT__ ? false : isMobile,
    userAgent,
  };
}

/**
 * mark whether current page is 404
 */
export function setNotFound(isNotFound: uiTypes.SetNotFoundAction['isNotFound']) {
  return {
    type: actionTypes.SET_NOT_FOUND,
    isNotFound,
  };
}

/**
 * mark whether current page is 500
 */
export function setServiceUnavailable(
  isServiceUnavailable: uiTypes.SetServiceUnavailableAction['isServiceUnavailable']
): uiTypes.SetServiceUnavailableAction {
  return {
    type: actionTypes.SET_SERVICE_UNAVAILABLE,
    isServiceUnavailable,
  };
}

export function hideTrailer(): uiTypes.HideTrailerAction {
  return {
    type: actionTypes.HIDE_TRAILER,
  };
}

/**
 * Putting a notification on the app
 * notification - notification object
 * id - custom id to store the notification
 */
export function addNotification(
  notification: uiTypes.Notification,
  id: string
): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch, getState) => {
    const { ui } = getState();
    const intl = getIntl(ui.userLanguageLocale);
    const notificationPresent = findIndex(ui.notifications, (notif) => notif.id === id) > -1;
    if (notificationPresent) return;
    notification.id = id;

    // localize notification text
    const notificationLocalized = { ...notification };
    // below code is checking if the text values are message descriptor objects
    // if the text is a message descriptor object, call intl.formatmessage to get the string
    if (notificationLocalized.title && typeof notificationLocalized.title === 'object') {
      notificationLocalized.title = intl.formatMessage(notificationLocalized.title);
    }
    if (notificationLocalized.description && typeof notificationLocalized.description === 'object') {
      notificationLocalized.description = intl.formatMessage(notificationLocalized.description);
    }
    if (notificationLocalized.buttons) {
      notificationLocalized.buttons = notificationLocalized.buttons.map((button) => {
        const buttonLocalized = { ...button };
        if (buttonLocalized.title && typeof buttonLocalized.title === 'object') {
          buttonLocalized.title = intl.formatMessage(buttonLocalized.title);
        }
        return buttonLocalized;
      });
    }

    dispatch(actionWrapper(actionTypes.ADD_NOTIFICATION, { notification: notificationLocalized }));
  };
}

/**
 * If there are any notification to be called given the url param from direct visit they will be called
 * @param queryShortHand - e.g. EMAIL_VERIFICATION_FAIL.queryShortHand
 */
export function notifyFromQueryParam(
  queryShortHand?: string
): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch) => {
    if (!queryShortHand) return;
    Object.keys(notificationTypes).forEach((notif) => {
      const presetNotification = notificationTypes[notif];
      if (presetNotification.queryShortHand === queryShortHand) {
        dispatch(addNotification(presetNotification.notification, 'query-preset'));
      }
    });
  };
}

export function setRenderedContainersCount(
  contentMode: CONTENT_MODE_VALUE,
  value: number
): uiTypes.SetRenderedContainersCountAction {
  return {
    type: actionTypes.SET_RENDERED_CONTAINERS_COUNT,
    value: {
      [contentMode]: value,
    },
  };
}

/**
 * Returns the content id for the first episode in the series if the id is a series ID.
 * If it is not a series ID, return the ID immediately.
 * If it is a series ID, continue to try to get the first episode ID.
 */
export async function getFirstEpisodeContentIdIfSeriesId(
  id: string,
  dispatch: TubiThunkDispatch,
  getState: () => StoreState
): Promise<{ contentId: string; position: number }> {
  // using try/catch so we can wrap with a custom error
  try {
    const isSeries = id.startsWith('0');
    const contentId = isSeries ? id.slice(1) : id;
    let seriesAction;
    if (isSeries) {
      seriesAction = loadSeriesEpisodeMetadata(contentId);
    }
    // doing it this way so I can fetch the history data and series data in parallel,
    // if it is a series, otherwise we just try and load the history.
    // noinspection ES6MissingAwait
    const loadSeriesPromise = seriesAction ? alwaysResolve(dispatch(seriesAction)) : Promise.resolve();
    const loadHistoryPromise = dispatch(loadHistory()).catch((err: Error) => {
      logger.error(err, 'Error loading history data');
      // using catch here so we handle the error by logging it
      // and then we can proceed on without history. We don't want
      // to prevent it working at all if loading history fails.
    });

    await Promise.all([loadSeriesPromise, loadHistoryPromise] as Promise<unknown>[]);
    const {
      history,
      video: { byId },
    } = getState();

    if (history.loaded) {
      const { contentId: resumeContentId, position } = getResumeInfo({
        history: history.contentIdMap[id] || null,
        byId,
        contentId: id,
        isSeries,
      });
      const isInHistory = !!resumeContentId;

      if (isInHistory) {
        // update the resumePositionById object in the video state,
        // because only hybrid apps currently pay attention to the
        // resume_time URL parameter.
        dispatch(setResumePosition(resumeContentId, position));
        return {
          contentId: resumeContentId,
          position,
        };
      }
    }

    return {
      // If the content ID is not for a series, or the series could not be loaded,
      // a fallback value of the original `contentId` will be used
      contentId: get(byId, [id, 'seasons', 0, 'episodes', 0, 'id'], contentId),
      position: 0,
    };
  } catch (e) {
    logger.error({ error: e, contentId: id }, 'Error when trying to determine first episode of series.');
    throw new Error('Error Retrieving Content');
  }
}

/**
 * transitionCompleteHook runs AFTER fetchAllData in client/routing.js
 * it should run even if we push to a url that matches the current url
 */
export function addTransitionCompleteHook(
  cb: uiTypes.AddTransitionCompleteCallbackAction['cb']
): uiTypes.AddTransitionCompleteCallbackAction {
  return {
    type: actionTypes.ADD_TRANSITION_COMPLETE_CB,
    cb,
  };
}

export function clearTransitionCompleteCbs(): uiTypes.ClearTransitionCompleteCbsAction {
  return { type: actionTypes.CLEAR_TRANSITION_COMPLETE_CBS };
}

/**
 * run all callbacks in the cb queue, then clear the queue
 */
export function runTransitionCompleteCbs(): ThunkAction<
  Promise<uiTypes.ClearTransitionCompleteCbsAction>,
  StoreState,
  ApiClient,
  uiTypes.UIAction
  > {
  return (dispatch, getState) => {
    const { transitionCompleteCbs } = getState().ui;
    return Promise.all(transitionCompleteCbs.map((reference) => reference())).then(() =>
      dispatch(clearTransitionCompleteCbs())
    );
  };
}

/**
 * Setting this here since we will be using it in many components
 * as well as it requires knowledge of the userAgent which either happens CDM or after or
 * when you have access to the server render req header
 */
export function setSlowDeviceStatus(): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch, getState) => {
    const { userAgent } = getState().ui;
    dispatch(
      actionWrapper(actionTypes.SET_SLOW_DEVICE_STATUS, {
        value: isSlowDevice(),
        uiFidelity: getDeviceFidelity(userAgent.ua),
      })
    );
  };
}

export function disableKeydown(): uiTypes.DisableKeyDownAction {
  return { type: actionTypes.DISABLE_KEY_DOWN };
}

export function enableKeydown(): uiTypes.EnableKeyDownAction {
  return { type: actionTypes.ENABLE_KEY_DOWN };
}

// decide which settings item is active
export function setSettingsSubpanelId(
  settingsSubpanelId: uiTypes.SetSettingsSubpanelAction['settingsSubpanelId']
): uiTypes.SetSettingsSubpanelAction {
  return {
    type: actionTypes.SET_SETTINGS_SUBPANEL,
    settingsSubpanelId,
  };
}

// change subtitle's opacity, which is part of updating multi-level menu focus state
export function setSettingsSubtitleActive(
  isSettingsSubtitleActive: uiTypes.SetSettingsSubpanelActiveAction['isSettingsSubtitleActive']
): uiTypes.SetSettingsSubpanelActiveAction {
  return {
    type: actionTypes.SET_SETTINGS_SUBTITLE_ACTIVE,
    isSettingsSubtitleActive,
  };
}

/**
 * Updates state.ui.containerIndexMap[containerId] = index
 */
export const setTileIndexInContainer: (args: { containerId: string; index: number, shouldDisablePreviewsWhileScrolling: boolean }) => uiTypes.SetSelectedContentAction = ({ containerId, index, shouldDisablePreviewsWhileScrolling }) => {
  return {
    type: actionTypes.SET_SELECTED_CONTENT,
    containerId,
    index,
    shouldDisablePreviewsWhileScrolling,
  };
};

/**
 * Set kids mode
 */
export function setKidsMode(kidsMode: boolean): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch, getState) => {
    // If feature not available in country then just return
    const {
      ui: { twoDigitCountryCode },
    } = getState();
    if (!isFeatureAvailableInCountry('kidsMode', twoDigitCountryCode)) return;

    const isUserNotCoppaCompliant = isUserNotCoppaCompliantSelector(getState());
    // Always set kids mode to true when not COPPA compliant and in COPPA kids mode experiment
    if (isUserNotCoppaCompliant) {
      kidsMode = true;
    }
    // Set channel guide loaded to false when entering kids mode.
    // This is needed because in kids mode we don't have linear experience
    // and we need to make sure homescreen?contentMode=linear request is loaded
    // again when opening channel guide after entering and exiting kids mode.
    if (kidsMode) {
      dispatch(actionWrapper(actionTypes.SET_CHANNEL_GUIDE_LOADED, { channelGuideLoaded: false }));
    }

    const isInGDPRCountry = isInGDPRCountrySelector(getState());
    // The GDPR is not ready yet, but we want to merge the code first.
    // So we don't want to make the call on production
    // istanbul ignore next
    if (isInGDPRCountry && !__PRODUCTION__) {
      // In GDPR countries,
      // when user enter kids mode, we should set some preferences to false
      // See: https://docs.google.com/document/d/1UIJAWHFC4h_Y33yV8aBgviDI_fUoUfwO2xCjrmmn4vY/edit#heading=h.fdoe44xwx5sp
      if (kidsMode) {
        dispatch(setGDPRConsentForKidsMode());
      } else {
        dispatch(loadGDPRConsent());
      }
    }

    // Set kids mode theme
    if (__CLIENT__) {
      // Set analytics config for app_mode when toggling between kids and default mode
      Analytics.mergeConfig({
        app_mode: kidsMode ? AppMode.KIDS_MODE : AppMode.DEFAULT_MODE,
      });

      const topLevelElement = document.documentElement.classList;
      if (kidsMode) {
        topLevelElement.add('kids-mode');
      } else {
        topLevelElement.remove('kids-mode');
      }

      // Save kids mode state when user actively select kids mode.
      if (__WEBPLATFORM__ && !isUserNotCoppaCompliant) {
        setKidsModeStatusInCookie(kidsMode);
      }
    }

    if (__CLIENT__ && __OTTPLATFORM__ === 'FIRETV_HYB') {
      systemApi.notifyKidsModeChangeEvent(kidsMode);
    }

    return dispatch({
      type: actionTypes.SET_KIDS_MODE,
      kidsMode,
    });
  };
}

/**
 * Show Age Gate Modal
 */
export function toggleAgeGateModal({
  isVisible,
  isFromExitKidsMode = false,
}: {
  isVisible: boolean;
  isFromExitKidsMode?: boolean;
}):
  | uiTypes.ToggleAgeGateModalAction
  | /* typed to allow thunks for unit testing purposes */ ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return {
    type: actionTypes.TOGGLE_AGE_GATE_MODAL,
    payload: {
      isVisible,
      isFromExitKidsMode,
    },
  };
}

/**
 * Toggle transport control
 */
export function toggleTransportControl(
  renderControls: uiTypes.ToggleTransportControlAction['renderControls']
): uiTypes.ToggleTransportControlAction {
  return {
    type: actionTypes.TOGGLE_TRANSPORT_CONTROL,
    renderControls,
  };
}

/**
 * Show Kids Mode/Guest Mode Eligibility Modal for web
 */

export function showEligibilityModal(): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch, getState) => {
    if (isInCoppaLenientCountry(getState())) {
      dispatch(addNotification(notificationTypes.GUEST_MODE_ONLY, 'guest_mode_only'));
    } else {
      dispatch(addNotification(notificationTypes.KIDS_MODE_ONLY, 'kids_mode_only'));
    }
  };
}

export function showCannotExitKidsModeModal(): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch) => {
    dispatch(addNotification(notificationTypes.CANNOT_EXIT_KIDS_MODE, 'cannot_exit_kids_mode'));
  };
}

export function setChromecastAutoplayVisible(
  isVisible: boolean
): uiTypes.ShowChromecastAutoplayAction | uiTypes.HideChromecastAutoplayAction {
  return {
    type: isVisible ? actionTypes.SHOW_CHROMECAST_AUTOPLAY : actionTypes.HIDE_CHROMECAST_AUTOPLAY,
  };
}

export function stopLiveTabUserBackFlow(): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (dispatch, getState) => {
    const {
      ui: { deeplinkBackOverrides },
    } = getState();
    if (deeplinkBackOverrides[BACK_FROM_TUBI_TO_ENTRANCE]) {
      dispatch(actionWrapper(actionTypes.SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_TUBI_TO_ENTRANCE]: false } }));
    }
  };
}

export function exitTubi(hasExitApi: boolean): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> {
  return (_, getState) => {
    trackingManager.onAppExit();
    clearSnapshot();
    const exitFunction = hasExitApi ? getExitFunction().bind(null, getState()) : null;
    if (exitFunction) exitFunction();
  };
}

export function toggleRegistrationPrompt(
  payload: uiTypes.ToggleRegistrationPromptAction['payload']
): uiTypes.ToggleRegistrationPromptAction {
  return {
    type: actionTypes.TOGGLE_REGISTRATION_PROMPT,
    payload,
  };
}

export function toggleRemindModal(
  payload: uiTypes.ToggleRemindModalAction['payload']
): uiTypes.ToggleRemindModalAction {
  return {
    type: actionTypes.TOGGLE_REMIND_MODAL,
    payload,
  };
}

export function toggleProgramDetailsModal(
  payload: uiTypes.ToggleProgramDetailsModalAction['payload']
): uiTypes.ToggleProgramDetailsModalAction {
  return {
    type: actionTypes.TOGGLE_PROGRAM_DETAILS_MODAL,
    payload,
  };
}

export const setEspanolMode = (
  espanolMode: uiTypes.SetEspanolModeAction['espanolMode']
): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> => {
  return (dispatch, getState) => {
    const {
      ui: { isEspanolModeEnabled },
    } = getState();

    if (isEspanolModeEnabled === espanolMode) return;

    dispatch(actionWrapper(actionTypes.SET_ESPANOL_MODE, { espanolMode }));
    // update the app_mode to ESPANOL_MODE in analytic events
    return dispatch(setAnalyticsConfig());
  };
};

export function setViewportType(type: uiTypes.SetViewportTypeAction['viewportType']): uiTypes.SetViewportTypeAction {
  return {
    type: actionTypes.SET_VIEWPORT_TYPE,
    viewportType: type,
  };
}

export const decreaseScreensaverCounter = (): ThunkAction<void, StoreState, ApiClient, uiTypes.UIAction> => {
  return (dispatch, getState) => {
    const state = getState();
    const isScreensaverVisible = isScreensaverVisibleSelector(state);

    if (isScreensaverVisible) return;

    dispatch(actionWrapper(actionTypes.DECREASE_SCREENSAVER_COUNTER));
  };
};

export const setAppDownloadBanner = (payload: boolean): uiTypes.SetAppDownloadBanner => ({
  type: actionTypes.SET_APP_DOWNLOAD_BANNER,
  payload,
});

export function setTheaterMode(isTheater: boolean): uiTypes.SetTheaterModeAction {
  return {
    type: actionTypes.SET_THEATER_MODE,
    isTheater,
  };
}

export function setShowToastForMobileToOTTSignIn(shouldShowToast: boolean): uiTypes.SetShowToastForMobileToOTTSignIn {
  return {
    type: actionTypes.SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN,
    shouldShowToast,
  };
}

export function setShowToastForContentNotFound(shouldShowToast: boolean): uiTypes.SetShowToastForContentNotFound {
  return {
    type: actionTypes.SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND,
    shouldShowToast,
  };
}
