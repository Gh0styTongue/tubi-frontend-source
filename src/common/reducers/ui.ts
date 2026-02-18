import type { AnyAction } from 'redux';

import {
  SET_WAITING_ON_VOICE_COMMAND,
  ENTER_FULLSCREEN,
  EXIT_FULLSCREEN,
  SHOW_TOP_NAV,
  HIDE_TOP_NAV,
  SET_SCROLLED_TO_TOP,
  SET_TOGGLE_TOP_NAV_ON_SCROLL,
  SHOW_LIVE_NEWS_MENU,
  HIDE_LIVE_NEWS_MENU,
  TOGGLE_CONTAINER_MENU,
  SHOW_CONTAINER_MENU,
  HIDE_CONTAINER_MENU,
  SET_TOUCH_DEVICE,
  TOGGLE_ACCOUNT_CARD,
  SET_USER_AGENT,
  SET_NOT_FOUND,
  SET_SERVICE_UNAVAILABLE,
  HIDE_TRAILER,
  SHOW_TRAILER,
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION,
  CLEAR_SCREENSAVER_COUNTER,
  DECREASE_SCREENSAVER_COUNTER,
  RESET_USER_IDLE_TIME_REMAINING,
  DECREASE_USER_IDLE_TIME_REMAINING,
  SET_RENDERED_CONTAINERS_COUNT,
  SET_SLOW_DEVICE_STATUS,
  DISABLE_KEY_DOWN,
  ENABLE_KEY_DOWN,
  ADD_TRANSITION_COMPLETE_CB,
  CLEAR_TRANSITION_COMPLETE_CBS,
  SET_SETTINGS_SUBPANEL,
  SET_SETTINGS_SUBTITLE_ACTIVE,
  SET_DEEPLINK_BACK_OVERRIDE,
  SET_SELECTED_CONTENT,
  RESET_UI_CONTAINER_INDEX_MAP,
  LOAD_CONTAINER_SUCCESS,
  SET_KIDS_MODE,
  SET_ESPANOL_MODE,
  SET_USER_LANGUAGE,
  SET_TWO_DIGIT_COUNTRY_CODE,
  SET_PREFERRED_LOCALE,
  TOGGLE_AGE_GATE_MODAL,
  TOGGLE_TRANSPORT_CONTROL,
  SHOW_CHROMECAST_AUTOPLAY,
  HIDE_CHROMECAST_AUTOPLAY,
  TOGGLE_REGISTRATION_PROMPT,
  TOGGLE_REMIND_MODAL,
  TOGGLE_PROGRAM_DETAILS_MODAL,
  SET_VIEWPORT_TYPE,
  UPDATE_CURRENT_DATE,
  ADD_ACTIVE_TILE_PREVIEW,
  REMOVE_ACTIVE_TILE_PREVIEW,
  SET_APP_DOWNLOAD_BANNER,
  SET_THEATER_MODE,
  SET_BROWSE_WHILE_WATCHING_BACK_OVERRIDE,
  SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN,
  SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND,
} from 'common/constants/action-types';
import type {
  CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  SHOW_SCREENSAVER_THRESHOLD,
  HOMEPAGE_INIT_CONTAINER_COUNT,
  SHOW_STILL_WATCHING_THRESHOLD,
  VIEWPORT_TYPE,
  CONTENT_MODES,
} from 'common/constants/constants';
import type { UIState } from 'common/types/ui';
import { findIndex } from 'common/utils/collection';
import { SUPPORTED_COUNTRY, SUPPORTED_LANGUAGE_LOCALE } from 'i18n/constants';
import { FidelityLevel } from 'ott/utils/uiFidelity';

const actions = {
  SET_WAITING_ON_VOICE_COMMAND,
  ENTER_FULLSCREEN,
  EXIT_FULLSCREEN,
  SHOW_TOP_NAV,
  HIDE_TOP_NAV,
  SET_SCROLLED_TO_TOP,
  SET_TOGGLE_TOP_NAV_ON_SCROLL,
  SHOW_LIVE_NEWS_MENU,
  HIDE_LIVE_NEWS_MENU,
  TOGGLE_CONTAINER_MENU,
  SHOW_CONTAINER_MENU,
  HIDE_CONTAINER_MENU,
  SET_TOUCH_DEVICE,
  TOGGLE_ACCOUNT_CARD,
  SET_USER_AGENT,
  SET_NOT_FOUND,
  SET_SERVICE_UNAVAILABLE,
  HIDE_TRAILER,
  SHOW_TRAILER,
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION,
  CLEAR_SCREENSAVER_COUNTER,
  DECREASE_SCREENSAVER_COUNTER,
  RESET_USER_IDLE_TIME_REMAINING,
  DECREASE_USER_IDLE_TIME_REMAINING,
  SET_RENDERED_CONTAINERS_COUNT,
  SET_SLOW_DEVICE_STATUS,
  DISABLE_KEY_DOWN,
  ENABLE_KEY_DOWN,
  ADD_TRANSITION_COMPLETE_CB,
  CLEAR_TRANSITION_COMPLETE_CBS,
  SET_SETTINGS_SUBPANEL,
  SET_SETTINGS_SUBTITLE_ACTIVE,
  SET_DEEPLINK_BACK_OVERRIDE,
  SET_BROWSE_WHILE_WATCHING_BACK_OVERRIDE,
  SET_SELECTED_CONTENT,
  RESET_UI_CONTAINER_INDEX_MAP,
  LOAD_CONTAINER_SUCCESS,
  SET_KIDS_MODE,
  SET_ESPANOL_MODE,
  SET_USER_LANGUAGE,
  SET_TWO_DIGIT_COUNTRY_CODE,
  SET_PREFERRED_LOCALE,
  TOGGLE_AGE_GATE_MODAL,
  TOGGLE_TRANSPORT_CONTROL,
  SHOW_CHROMECAST_AUTOPLAY,
  HIDE_CHROMECAST_AUTOPLAY,
  TOGGLE_REGISTRATION_PROMPT,
  TOGGLE_REMIND_MODAL,
  TOGGLE_PROGRAM_DETAILS_MODAL,
  SET_VIEWPORT_TYPE,
  UPDATE_CURRENT_DATE,
  ADD_ACTIVE_TILE_PREVIEW,
  REMOVE_ACTIVE_TILE_PREVIEW,
  SET_APP_DOWNLOAD_BANNER,
  SET_THEATER_MODE,
  SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN,
  SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND,
};

export const initialState: UIState = {
  isServiceUnavailable: false,
  notFound: false,
  scrolledToTop: true,
  topNavVisible: true,
  toggleTopNavOnScroll: true,
  containerMenuVisible: false,
  liveNewsMenuVisible: false,
  isMobile: false,
  viewportType: VIEWPORT_TYPE.desktop,
  isTouchDevice: false,
  accountCardVisible: false,
  userAgent: {
    ua: '',
    browser: {
      name: '',
      major: '',
      version: '',
      engine: '',
      engineVersion: '',
    },
    os: {
      name: '',
      version: '',
    },
    device: {
      deviceType: '',
      model: '',
      vendor: '',
      language: 'en',
    },
  },
  showTrailer: false,
  trailerParentId: '',
  notifications: [],
  screensaverCounter: SHOW_SCREENSAVER_THRESHOLD,
  userIdleCounter: SHOW_STILL_WATCHING_THRESHOLD,
  // renderedContainersCount: { [mode]: number }
  renderedContainersCount: Object.values(CONTENT_MODES).reduce(
    (obj, mode) => Object.assign(obj, { [mode as CONTENT_MODE_VALUE]: HOMEPAGE_INIT_CONTAINER_COUNT }),
    {}
  ),
  isSlowDevice: false,
  uiFidelity: FidelityLevel.High,
  // while keydown is disabled, ott/App.js will render a splash screen and input controls will be blocked
  isRemoteDisabled: false,
  transitionCompleteCbs: [],
  settingsSubpanelId: '',
  isSettingsSubtitleActive: true,
  // override back behavior when in deeplinked state
  deeplinkBackOverrides: {},
  // override back behavior when navigating via browse while watching
  browseWhileWatchingBackOverrides: {},
  containerIndexMap: {},
  fullscreen: false,
  isKidsModeEnabled: false,
  // true if in espanol experience including any page navigating from the espanol mode page
  isEspanolModeEnabled: false,
  userLanguageLocale: SUPPORTED_LANGUAGE_LOCALE.EN_US,
  twoDigitCountryCode: SUPPORTED_COUNTRY.US,
  preferredLocale: undefined,
  ageGateModal: {
    isVisible: false,
    isFromExitKidsMode: false,
  },
  chromecastAutoplayVisible: false,
  waitingOnVoiceCommand: false,
  registrationPrompt: {
    isOpen: false,
    onClose: undefined,
    isSkipped: false,
  },
  renderControls: true,
  remindModal: {
    isOpen: false,
  },
  programDetailsModal: {
    isOpen: false,
    programKey: '',
  },
  currentDate: new Date(),
  activeTilePreviewCount: 0,
  showAppDownloadBanner: false,
  isTheater: false,
  showToastForMobileToOTTSignIn: false,
  showToastForContentNotFound: false,
};

export const transformUserAgent = (userAgent: UAParser.IResult): UIState['userAgent'] => {
  const { ua, browser, engine, os, device } = userAgent;

  return {
    ua,
    browser: {
      ...browser,
      engine: engine.name,
      engineVersion: engine.version,
    },
    os,
    device: {
      deviceType: device.type,
      model: device.model,
      vendor: device.vendor,
    },
  } as UIState['userAgent'];
};

export default function reducer(state: UIState = initialState, action = {} as AnyAction): UIState {
  switch (action.type) {
    case actions.SET_WAITING_ON_VOICE_COMMAND:
      return {
        ...state,
        waitingOnVoiceCommand: action.waitingOnVoiceCommand,
      };
    case actions.ENTER_FULLSCREEN:
      return {
        ...state,
        fullscreen: true,
      };
    case actions.EXIT_FULLSCREEN:
      return {
        ...state,
        fullscreen: false,
      };
    case actions.SET_SCROLLED_TO_TOP:
      return {
        ...state,
        scrolledToTop: action.scrolledToTop,
      };
    case actions.SHOW_TOP_NAV:
      return {
        ...state,
        topNavVisible: true,
      };
    case actions.HIDE_TOP_NAV:
      return {
        ...state,
        topNavVisible: false,
      };
    case actions.SET_TOGGLE_TOP_NAV_ON_SCROLL:
      return {
        ...state,
        toggleTopNavOnScroll: action.toggleTopNavOnScroll,
      };
    case actions.SHOW_LIVE_NEWS_MENU:
      return {
        ...state,
        liveNewsMenuVisible: true,
      };
    case actions.HIDE_LIVE_NEWS_MENU:
      return {
        ...state,
        liveNewsMenuVisible: false,
      };
    case actions.TOGGLE_CONTAINER_MENU:
      return {
        ...state,
        containerMenuVisible: !state.containerMenuVisible,
      };
    case actions.SHOW_CONTAINER_MENU:
      return {
        ...state,
        containerMenuVisible: true,
      };
    case actions.HIDE_CONTAINER_MENU:
      return {
        ...state,
        containerMenuVisible: false,
      };
    case actions.SET_TOUCH_DEVICE:
      return {
        ...state,
        isTouchDevice: !!action.isTouchDevice,
      };
    case actions.TOGGLE_ACCOUNT_CARD:
      return {
        ...state,
        accountCardVisible: !state.accountCardVisible,
      };
    case actions.SET_USER_AGENT: {
      const { isMobile, userAgent } = action;

      return {
        ...state,
        isMobile,
        userAgent: transformUserAgent(userAgent),
      };
    }
    case actions.SET_NOT_FOUND:
      return {
        ...state,
        notFound: action.isNotFound,
      };
    case actions.SET_SERVICE_UNAVAILABLE:
      return {
        ...state,
        isServiceUnavailable: action.isServiceUnavailable,
      };
    case actions.HIDE_TRAILER:
      return {
        ...state,
        showTrailer: false,
      };
    case actions.SHOW_TRAILER:
      return {
        ...state,
        showTrailer: true,
        trailerParentId: action.parentId,
      };
    case actions.ADD_NOTIFICATION:
      const { notification } = action;
      return {
        ...state,
        notifications: [...state.notifications, notification],
      } as unknown as UIState;
    case actions.REMOVE_NOTIFICATION:
      const idx = findIndex(state.notifications, (notif: any) => notif.id === action.id);
      if (idx === -1) return state;
      const notifications = [...state.notifications.slice(0, idx), ...state.notifications.slice(idx + 1)];
      return {
        ...state,
        notifications,
      } as unknown as UIState;
    case actions.CLEAR_SCREENSAVER_COUNTER:
      return {
        ...state,
        screensaverCounter: SHOW_SCREENSAVER_THRESHOLD,
      };
    case actions.DECREASE_SCREENSAVER_COUNTER:
      return {
        ...state,
        screensaverCounter: state.screensaverCounter - 1,
      };
    case actions.RESET_USER_IDLE_TIME_REMAINING:
      return {
        ...state,
        userIdleCounter: action.minutes > 0 ? action.minutes : SHOW_STILL_WATCHING_THRESHOLD,
      };
    case actions.DECREASE_USER_IDLE_TIME_REMAINING:
      return {
        ...state,
        userIdleCounter: state.userIdleCounter - 1,
      };
    case actions.SET_RENDERED_CONTAINERS_COUNT:
      return {
        ...state, renderedContainersCount: { ...state.renderedContainersCount, ...action.value },
      };
    case actions.SET_SLOW_DEVICE_STATUS:
      // also creating an action since it will need to be updated based on userAgent in Samsung's case
      return {
        ...state,
        isSlowDevice: action.value,
        uiFidelity: action.uiFidelity,
      };
    case actions.DISABLE_KEY_DOWN:
      return {
        ...state,
        isRemoteDisabled: true,
      };
    case actions.ENABLE_KEY_DOWN:
      return {
        ...state,
        isRemoteDisabled: false,
      };
    /**
     * transition cbs will run AFTER fetchAllData in client/routing.js
     */
    case actions.ADD_TRANSITION_COMPLETE_CB:
      return {
        ...state,
        transitionCompleteCbs: [...state.transitionCompleteCbs, action.cb],
      } as unknown as UIState;
    case actions.CLEAR_TRANSITION_COMPLETE_CBS:
      return {
        ...state,
        transitionCompleteCbs: [],
      };
    case actions.SET_SETTINGS_SUBPANEL:
      return {
        ...state,
        settingsSubpanelId: action.settingsSubpanelId,
      };
    case actions.SET_SETTINGS_SUBTITLE_ACTIVE:
      return {
        ...state,
        isSettingsSubtitleActive: action.isSettingsSubtitleActive,
      };
    case actions.SET_DEEPLINK_BACK_OVERRIDE:
      return {
        ...state,
        deeplinkBackOverrides: {
          ...state.deeplinkBackOverrides,
          ...action.data,
        },
      };
    case actions.SET_BROWSE_WHILE_WATCHING_BACK_OVERRIDE: {
      return {
        ...state,
        browseWhileWatchingBackOverrides: {
          ...state.browseWhileWatchingBackOverrides,
          ...action.data,
        },
      };
    }
    case actions.SET_SELECTED_CONTENT:
      // update selector.containerIndexMap[containerId]
      return {
        ...state,
        containerIndexMap: {
          ...state.containerIndexMap,
          [action.containerId]: action.index,
        },
      };
    case actions.RESET_UI_CONTAINER_INDEX_MAP:
      return {
        ...state,
        containerIndexMap: {},
      };
    case actions.LOAD_CONTAINER_SUCCESS: {
      const containerIndex = state.containerIndexMap[action.id];
      // If we are updating the container contents, make sure that the container
      // index does not exceed the new bounds
      if (
        action.shouldOverride &&
        action.contentMode === action.currentContentMode &&
        containerIndex >= action.result.length
      ) {
        return {
          ...state,
          containerIndexMap: {
            ...state.containerIndexMap,
            [action.id]: action.result.length - 1,
          },
        };
      }
      return state;
    }
    case actions.SET_KIDS_MODE:
      return {
        ...state,
        isKidsModeEnabled: action.kidsMode,
      };
    case actions.SET_ESPANOL_MODE:
      return {
        ...state,
        isEspanolModeEnabled: action.espanolMode,
      };
    case actions.SET_USER_LANGUAGE: {
      return {
        ...state,
        userLanguageLocale: action.userLanguageLocale,
      };
    }
    case actions.SET_TWO_DIGIT_COUNTRY_CODE: {
      return {
        ...state,
        twoDigitCountryCode: action.twoDigitCountryCode,
      };
    }
    case actions.SET_PREFERRED_LOCALE: {
      return {
        ...state,
        preferredLocale: action.preferredLocale,
      };
    }
    case actions.TOGGLE_AGE_GATE_MODAL: {
      return {
        ...state,
        ageGateModal: action.payload,
      };
    }
    case actions.TOGGLE_TRANSPORT_CONTROL: {
      return {
        ...state,
        renderControls: action.renderControls,
      };
    }
    case actions.SHOW_CHROMECAST_AUTOPLAY:
      return {
        ...state,
        chromecastAutoplayVisible: true,
      };
    case actions.HIDE_CHROMECAST_AUTOPLAY:
      return {
        ...state,
        chromecastAutoplayVisible: false,
      };
    case actions.TOGGLE_REGISTRATION_PROMPT:
      return {
        ...state,
        registrationPrompt: {
          ...state.registrationPrompt,
          isOpen: action.payload.isOpen ?? state.registrationPrompt.isOpen,
          onClose: action.payload.onClose || state.registrationPrompt.onClose,
          isSkipped: action.payload.isSkipped ?? state.registrationPrompt.isSkipped,
        },
      };
    case actions.TOGGLE_REMIND_MODAL:
      return {
        ...state,
        remindModal: action.payload,
      };
    case actions.TOGGLE_PROGRAM_DETAILS_MODAL:
      return {
        ...state,
        programDetailsModal: action.payload,
      };
    case actions.SET_VIEWPORT_TYPE:
      return {
        ...state,
        viewportType: action.viewportType,
      };
    case actions.UPDATE_CURRENT_DATE:
      return {
        ...state,
        currentDate: new Date(),
      };
    case actions.ADD_ACTIVE_TILE_PREVIEW:
      return {
        ...state,
        activeTilePreviewCount: state.activeTilePreviewCount + 1,
      };
    case actions.REMOVE_ACTIVE_TILE_PREVIEW:
      return {
        ...state,
        activeTilePreviewCount: state.activeTilePreviewCount - 1,
      };
    case actions.SET_APP_DOWNLOAD_BANNER:
      return {
        ...state,
        showAppDownloadBanner: action.payload,
      };
    case actions.SET_THEATER_MODE:
      return {
        ...state,
        isTheater: action.isTheater,
      };
    case actions.SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN:
      return {
        ...state,
        showToastForMobileToOTTSignIn: action.shouldShowToast,
      };
    case actions.SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND:
      return {
        ...state,
        showToastForContentNotFound: action.shouldShowToast,
      };
    default:
      return state;
  }
}
