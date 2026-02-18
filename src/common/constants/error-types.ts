// home screen
export const LOAD_HOME_SCREEN_FAIL = 'Home screen data fetch failed';

// content
export const INVALID_CONTENT_ID = 'Invalid content id';
export const INVALID_CONTAINER_ID = 'Container id should be a number';
export const LOAD_CONTENT_FAIL = 'Load Content fail';
export const CONTENT_NOT_FOUND = 'Content is not found or is not allowed';
export const CONTENT_EXPIRED = 'Content has expired';
export const MINIMUM_APP_VERSION = 'Minimum app version for DRM not met';
export const MATURE_CONTENT = 'Mature content';
export const MOVIE_CONTENT_PASSED_TO_LIVE_PLAYER = 'movie content id is passed to live player';
export const TVSHOW_CONTENT_PASSED_TO_LIVE_PLAYER = 'tvshow content id is passed to live player';
export const LIVE_CONTENT_PASSED_TO_VOD_PLAYER = 'live content id is passed to vod player';
export const VOD_CONTENT_PASSED_TO_LIVE_PLAYER = [MOVIE_CONTENT_PASSED_TO_LIVE_PLAYER, TVSHOW_CONTENT_PASSED_TO_LIVE_PLAYER];
export const LIVE_AND_VOD_CONTENT_MIXED_UP = [MOVIE_CONTENT_PASSED_TO_LIVE_PLAYER, TVSHOW_CONTENT_PASSED_TO_LIVE_PLAYER, LIVE_CONTENT_PASSED_TO_VOD_PLAYER];

// email verification verification
export const EMAIL_VERIFICATION_UNKNOWN = 'There was an unexpected error in email verification';
export const EMAIL_VERIFICATION_INVALID_TOKEN = 'An invalid token was used in email verification';
export const EMAIL_CONFIRMATION_RESEND = 'Email confirmation resend failed';

// analytics
export const ANALYTICS_EVENT_FAIL = 'Analytics event request fail';
export const ANALYTICS_LOG_FAIL = 'Analytics logging request fail';
export const AD_BLOCK_DETECTED = 'AdBlockDetected';
export const SCRIPT_START_DOWNLOAD = 'scriptStartDownload';
// history
export const HISTORY_UPDATE_FAIL = 'History update request fail';

// trackLogging Types
// these are defined by UAPI- must only use these types
export const TRACK_LOGGING = {
  adInfo: 'AD:INFO',
  apiInfo: 'API:INFO',
  videoInfo: 'VIDEO:INFO',
  videoLoad: 'VIDEO:LOAD',
  clientInfo: 'CLIENT:INFO',
  videoPlayback: 'VIDEO:PLAYBACK',
} as const;

export enum AD_LOG_SUB_TYPE {
  CUE_POINT_FILLED = 'cuePointFilled',
  AD_START = 'adStart',
  AD_COMPLETE = 'adComplete',
  AD_POD_COMPLETE = 'adPodComplete',
  AD_DISCONTINUE = 'adDiscontinue',
  AD_BEACON_FAILED = 'adBeaconFailed',
  AD_POD_FETCH_FAILED = 'adPodFetchFailed',
  AD_MISSED = 'adMissed',
  AD_GET_NONCE_FAILED = 'adGetNonceFailed',
  AD_GOOGLE_SDK_PRELOAD = 'adGoogleSDKPreload',
  AD_STALL = 'adStall',
  AD_STALL_EXTRA = 'adStallExtra',
  AD_GOOGLE_NONCE_PRE_GENERATED = 'adGoogleNoncePreGenerated',
  AD_GOOGLE_NONCE_USE_PRE_GENERATED = 'adGoogleNonceUsePreGenerated',
  AD_GOOGLE_NONCE_FALLBACK = 'adGoogleNonceFallback',
  AD_GOOGLE_NONCE_EXPIRED = 'adGoogleNonceExpired',
  AD_PRELOAD_WASTED_BANDWIDTH = 'adPreloadWastedBandwidth',
  AD_PRELOAD_ERROR = 'adPreloadError',
  AD_PRELOAD_TIMEOUT = 'adPreloadTimeout',
  AD_PRELOAD_ABORT = 'adPreloadAbort',
  AD_PRELOAD_PREVENTED = 'adPreloadPrevented',
  AD_PRELOAD_SUCCESS = 'adPreloadSuccess',
  AD_NO_BUFFER = 'adNoBuffer',
  AD_PAUSE = 'adPause',
  PREROLL_LOAD_TIMEOUT = 'prerollLoadTimeout',
}

export enum PAUSE_AD_LOG_SUB_TYPE {
  PAUSE_AD_START = 'pauseAdStart',
  PAUSE_AD_IMPRESSION = 'pauseAdImpression',
  PAUSE_AD_NOT_USED = 'pauseAdNotUsed',
  PAUSE_AD_END = 'pauseAdEnd',
  PAUSE_AD_REQUEST_ERROR = 'pauseAdRequestError',
  PAUSE_AD_IMAGE_ERROR = 'pauseAdImageError',
  PAUSE_AD_UNKNOWN_ERROR = 'pauseAdUnknownError',
  PAUSE_AD_REQUEST_COMPLETE = 'pauseAdRequestComplete',
  PAUSE_AD_IMAGE_LOADED = 'pauseAdImageLoaded',
}

export enum PLAYBACK_LOG_SUB_TYPE {
  CONTENT_ERROR = 'videoError',
  LIVE_ERROR = 'liveError',
  AD_ERROR = 'adError',
  PREVIEW_ERROR = 'previewError',
  MANIFEST_RETRY = 'manifestRetry',
  MISSING_VIDEO_RESOURCE = 'missingVideoResource',
  INVALID_CDN_RESOURCE = 'invalidCDNResource',
  WEB_MOBILE_PLAY_BUTTON = 'web_mobile_play_button',
  FATAL_ERROR = 'fatalError',
  VIDEO_RETRY = 'videoRetry',
  VIDEO_RELOAD = 'videoReload',
  FALLBACK = 'fallback',
  CONTENT_START = 'contentStart',
  LIVE_ERROR_RELOAD = 'liveErrorReload',
  LIVE_PAUSE_RETRY = 'livePauseRetry',
  ON_HDMI_CONNECTED = 'onHDMIConnected',
  EMPTY_VIDEO_RESOURCE = 'emptyVideoResource',
  LIVE_PERFORMANCE_METRIC = 'livePerformanceMetric',
  CONTENT_STARTUP_PERFORMANCE = 'contentStartupPerformance',
  PREVIEW_PERFORMANCE_METRIC = 'previewPerformanceMetric',
  AD_STARTUP_PERFORMANCE = 'adStartupPerformance',
  RESTORE_DRM_LEVEL_FROM_STORAGE = 'resetDRMLevelFromStorage',
  DRM_LEVEL_STORAGE_EXPIRED = 'DRMStorageExpired',
  ENTER_PICTURE_IN_PICTURE = 'enterPictureInPicture',
  LEAVE_PICTURE_IN_PICTURE = 'leavePictureInPicture',
  ENTER_PICTURE_IN_PICTURE_ERROR = 'enterPictureInPictureError',
  LEAVE_PICTURE_IN_PICTURE_ERROR = 'leavePictureInPictureError',
  LIVE_AD_START = 'liveAdStart',
  LIVE_AD_COMPLETE = 'liveAdComplete',
  LIVE_AD_TIME = 'liveAdTime',
  LIVE_AD_POD_COMPLETE = 'liveAdPodComplete',
  LIVE_AD_BEACON_FAIL = 'liveAdBeaconFail',
  PREVIEW_AUTOPLAY_PREVENTED = 'previewAutoplayPrevented',
  ERROR_MODAL_SHOW = 'errorModalShow',
  FATAL_ERROR_RESUME = 'fatalErrorResume',
  FATAL_ERROR_MODAL_CLOSE = 'closeFatalModalByBackButton',
  VISUAL_QUALITY_CHANGE = 'visualQualityChange',
  BUFFER_START = 'buffer_start',
  UNPAIRED_BUFFER_END = 'unpaired_buffer_end',
  BUFFER_END = 'BUFFERING',
  PLAYER_PAGE_EXIT = 'playerPageExit',
  LIVE_PLAYER_EXIT = 'livePlayerExit',
  LIVE_REVISIT = 'liveRevisit',
  CAP_LEVEL_ON_FPS_DROP = 'capLevelOnFPSDrop',
  VOD_PRELOADED_HLS_DESTROYED = 'vodPreloadedHlsDestroyed',
  LINEAR_SESSION_EXPIRED = 'linearSessionExpired',
  LINEAR_SESSION_RECOVERED = 'linearSessionRecovered',
  BACKGROUND_PLAYBACK = 'backgroundPlayback',
  GET_SEEK_WINDOW = 'getSeekWindow',
  STALL_IN_BUFFER_HOLE = 'stallInBufferHole',
  RE_SEEK = 'ReSeek',
  RE_START = 'Restart',
  ERROR_MODAL_GO_BACK = 'errorModalGoBack',
  ERROR_MODAL_EXPLORE_POPULAR = 'errorModalExplorePopular',
  AUDIO_TRACKS_ERROR = 'audioTracksError',
  VOD_PLAYER_SERVICE_QUALITY = 'VODPlayerServiceQuality',
  VOD_PLAYER_SERVICE_QUALITY_ORIGINAL = 'VODPlayerServiceQualityOriginal',
  LIVE_PLAYER_SERVICE_QUALITY = 'LivePlayerServiceQuality',
  PLAYER_FEEDBACK_MODAL_SHOW = 'playerFeedbackModalShow',
  LIVE_PLAYER_FEEDBACK_MODAL_SHOW = 'livePlayerFeedbackModalShow',
  PLAYER_FEEDBACK_REPORT = 'playerFeedbackReport',
  LIVE_PLAYER_FEEDBACK_REPORT = 'livePlayerFeedbackReport',
  RESUME_BEGINNING_AFTER_AD = 'resumeBeginningAfterAd',
  UNKNOWN_RESOLUTION = 'unknownResolution',
  RENDITION_AND_FRAME = 'renditionAndFrame',
  SEEK_TIME_OUT = 'seekTimeOut',
  HLS_JS_INFO = 'hlsJSInfo',
  DESTROY_TIMEOUT = 'destroy_timeout',
  SEEK = 'seek'
}

// there may be more here in the future
export enum CAPTIONS_LOG_SUB_TYPE {
  CAPTIONS_ERROR = 'captionsError'
}

export enum THUMBNAILS_LOG_SUB_TYPE {
  DATA_FETCH_ERROR = 'thumbnailsDataFetchError',
  IMAGE_FETCH_ERROR = 'thumbnailsFetchError',
  CONSTRUCTION_ERROR = 'thumbnailsConstructionError',
  PERFORMANCE = 'thumbnailsPerformance',
}

export enum BROWSE_WHILE_WATCHING {
  CONTENT_LOAD_FAILURE = 'browseWhileWatchingContentLoadFailure',
  SESSION_END = 'browseWhileWatchingSessionEnd',
  // Note that this is trunated in the DB to `browseWhileWatchingPlaybackSessi`, 32 chars
  PLAYBACK_SESSION_END = 'browseWhileWatchingPlaybackSessionEnd',
}

export enum PAUSE_QR_CODE_SUB_TYPE{
  QR_CODE_GENERATION_FAILURE = 'pauseQrCodeGenerationFailure',
}

// arbitrary strings defined by anyone
export const LOG_SUB_TYPE = {
  SHOW_BROWSER_MENU_ON_WEB: 'showBrowserMenu',
  DEEPLINK_TO_PLAYER: 'deeplinkToPlayer',
  CAPTIONS_SETTINGS: 'captionsSettings',
  SEARCH_END: 'searchEnd',
  DEVICE_RESOLUTION: 'deviceResolution',
  DEVICE_ID_MISMATCH: 'deviceIdMismatch',
  DEEPLINK: 'deeplink',
  JSBRIDGE: {
    INIT_JSBRIDGE: 'initJSBridge',
    START_NATIVE_PLAYER: 'startNativePlayer',
    HDMI_CONNECTION: 'hdmiConnection',
  },
  LOGOUT: 'logout',
  PLAYBACK: PLAYBACK_LOG_SUB_TYPE,
  AD: AD_LOG_SUB_TYPE,
  PAUSE_AD: PAUSE_AD_LOG_SUB_TYPE,
  THUMBNAILS: THUMBNAILS_LOG_SUB_TYPE,
  PAUSE_QR_CODE: PAUSE_QR_CODE_SUB_TYPE,
  BROWSE_WHILE_WATCHING,
  CUECHANGED: 'cueChanged',
  RESET: 'appReset',
  UI: 'userInterface',
  LAUNCH_APPS_STORE: 'launchStore',
  DEVICE_CAPABILITIES: 'deviceCapabilities',
  PLAYBACK_CAPABILITIES: 'playbackCapabilities',
  COMPATIBILITY: {
    DEVICE_SPEC_INFO: 'deviceSpecInfo',
    DATACHANNEL_STATUS: 'dataChannelStatus',
  },
  KEYBOARD: 'ottKeyboard',
  REGISTRATION: {
    CODE_LOADING_TIME: 'codeLoadingTime',
    GOOGLE_SIGN_IN_ERROR: 'googleSignInError',
  },
  CRASH: 'crash',
  GOOGLE_ONE_TAP: 'googleOneTap',
  MOBILE_WEB_DEEPLINK: 'mobileWebDeeplink',
  APP_PERFORMANCE: 'performance',
  EMPTY_BACKGROUND: 'emptyBackground',
  WEB_VITALS: 'webVitals',
  VIZIO_ACCOUNT_SERVICE: 'vizioAccountService',
  USER_SESSION: 'userSession',
  AUTOPLAY_API_FAILED: 'autoplayAPIFailed',
  AUTOPLAY_CONTENTS: 'autoplayContents',
  SKINS_AD: 'skinsAd',
  HOMESCREEN_LOAD_MORE_API_ERROR: 'homescreenLoadMoreApiError',
  EMPTY_CUE_POINTS_FROM_RESPONSE: 'emptyCuePointsFromResponse',
};

export const getOneTapErrorWithPrefix = (error: string) => `GoogleOneTapError:${error}`;

// TODO: we may alter to enum for a more strict type checking after the new version of TypeScript supports
// computed values in an enum. See: https://github.com/microsoft/TypeScript/pull/50528
export const GOOGLE_ONE_TAP_ERRORS = {
  BEGIN_SIGN_IN: getOneTapErrorWithPrefix('beginSignIn'),
  ON_SUCCESS: getOneTapErrorWithPrefix('onSuccess'),
  SIGN_IN: getOneTapErrorWithPrefix('signIn'),
  SIGN_UP: getOneTapErrorWithPrefix('signUp'),
} as const;

export const ROUTING_BLOCKED = 'ROUTING_BLOCKED';
