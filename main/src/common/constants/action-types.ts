import { createActionTypes } from '@tubitv/refetch';

/** LOAD an episode list */
export const LOAD_SERIES = 'tb/series/LOAD';
export const LOAD_SERIES_SUCCESS = 'tb/series/LOAD_SUCCESS';
export const LOAD_SERIES_FAIL = 'tb/series/LOAD_FAIL';

export const BATCH_ADD_VIDEOS = 'tb/video/BATCH_ADD_VIDEOS';
export const BATCH_ADD_VIDEOS_AND_REMOVE_OLD = 'tb/video/BATCH_ADD_VIDEOS_AND_REMOVE_OLD';

export const LOAD_SERIES_EPISODES_METADATA_SUCCESS = 'tb/series/LOAD_EPISODES_METADATA_SUCCESS';

/** Loading of a single video */
export const LOAD_VIDEO = 'tb/video/LOAD';
export const LOAD_VIDEO_SUCCESS = 'tb/video/LOAD_SUCCESS';
export const LOAD_VIDEO_FAIL = 'tb/video/LOAD_FAIL';
export const LOAD_RELATED_CONTENTS_SUCCESS = 'tb/video/LOAD_RELATED_CONTENTS_SUCCESS';
export const LOAD_AUTOPLAY_CONTENTS = 'tb/video/LOAD_AUTOPLAY_CONTENTS';
export const LOAD_AUTOPLAY_CONTENTS_SUCCESS = 'tb/video/LOAD_AUTOPLAY_CONTENTS_SUCCESS';
export const LOAD_AUTOPLAY_CONTENTS_FAIL = 'tb/video/LOAD_AUTOPLAY_CONTENTS_FAIL';
export const RESET_AUTOPLAY_CONTENTS = 'tb/video/RESET_AUTOPLAY_CONTENTS';
export const GET_CONTENT_ATTRIBUTES_SUCCESS = 'tb/video/REFRESH_URL_SUCCESS';
export const LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS = 'tb/video/LOAD_CONTENT_THUMBNAIL_SPRITES_SUCCESS';

/** containers */
export const LOAD_CONTAINER_MENU_LIST_SUCCESS = 'tb/containers/LOAD_CONTAINER_MENU_LIST_SUCCESS';
export const SET_CONTENT_MODE = 'tb/containers/SET_CONTENT_MODE';
export const RESET_CONTENT_MODE = 'tb/containers/RESET_CONTENT_MODE';
export const INVALIDATE_CONTAINER = 'tb/containers/INVALIDATE_CONTAINER';

/** categories */
export const SET_CATEGORIES_EXPANDED = 'tb/categories/SET_CATEGORIES_EXPANDED';
export const SET_CATEGORIES_CHANNELS_ACTIVE_CONTAINER = 'tb/categories/SET_CATEGORIES_CHANNELS_ACTIVE_CONTAINER';

/** personalization */
export const SET_DISMISSED_PERSONALIZATION_PROMPT = 'tb/categories/SET_DISMISSED_PERSONALIZATION_PROMPT';
export const SET_IS_VALID_USER_FOR_PERSONALIZATION = 'tb/categories/SET_IS_VALID_USER_FOR_PERSONALIZATION';

/**  refetcth composed types */
export const LOAD_CONTAINERS = createActionTypes('tb/containers/LOAD');
export const LOAD_CONTENT_RF = createActionTypes('tb/content/LOAD');

export const UPDATE_CONTAINER_CURSOR = 'tb/containers/UPDATE_CONTAINER_CURSOR';
export const LOAD_CONTAINER = 'tb/containers/LOAD_CONTAINER';
export const LOAD_CONTAINER_SUCCESS = 'tb/containers/LOAD_CONTAINER_SUCCESS';
export const LOAD_CONTAINER_FAIL = 'tb/containers/LOAD_CONTAINER_FAIL';
export const ADD_NEW_CONTENT_TO_CONTAINER = 'tb/containers/ADD_NEW_CONTENT_TO_CONTAINER';
export const REMOVE_CONTENT_FROM_CONTAINER = 'tb/containers/REMOVE_CONTENT_FROM_CONTAINER';

export const OTT_SET_DISPLAY_DATA = 'tb/containers/OTT_SET_DISPLAY_DATA';

export const SET_CONTAINER_CONTEXT = 'tb/containers/SET_CONTAINER_CONTEXT';
export const CLEAR_CONTAINER_CONTEXT = 'tb/containers/CLEAR_CONTAINER_CONTEXT';

export const SET_SPON_EXP = 'tb/brand_spotlight/SET_SPON_EXP';
export const CLEAR_SPON_EXP = 'tb/brand_spotlight/CLEAR_SPON_EXP';
export const MARK_PIXELS_FIRED = 'tb/brand_spotlight/MARK_PIXELS_FIRED';
export const CLEAR_PIXELS_FIRED = 'tb/brand_spotlight/CLEAR_PIXELS_FIRED';

/** search */
export const LOAD_SEARCH_EPIC = 'tb/search/LOAD_SEARCH_EPIC';
export const LOAD_SEARCH_START = 'tb/search/LOAD_SEARCH_START';
export const ABORT_SEARCH = 'tb/search/ABORT_SEARCH';
export const LOAD_SEARCH_SUCCESS = 'tb/search/LOAD_SEARCH_SUCCESS';
export const LOAD_SEARCH_FAIL = 'tb/search/LOAD_SEARCH_FAIL';
export const CLEAR_SEARCH = 'tb/search/CLEAR_SEARCH';
export const SEARCH_STORE_SRC_PATH = 'tb/search/STORE_SRC_PATH';
export const SEARCH_SET_ACTIVE_IDX = 'tb/search/SEARCH_SET_ACTIVE_IDX';
export const SEARCH_SET_KEYBOARD_INDEXES = 'tb/search/SEARCH_SET_KEYBOARD_INDEXES';
export const LOAD_RECOMMENDATION = 'tb/search/LOAD_RECOMMENDATION';
export const CLEAR_SEARCH_STORE_KEYS = 'tb/search/CLEAR_SEARCH_STORE_KEYS';
export const SET_IS_VOICE_SEARCH = 'tb/search/SET_IS_VOICE_SEARCH';
export const SET_ACTIVE_SEARCH_SECTION = 'tb/search/SET_ACTIVE_SEARCH_SECTION';

/** auth */
export const LOAD_AUTH = 'tb/auth/LOAD';
export const LOAD_AUTH_SUCCESS = 'tb/auth/LOAD_SUCCESS';
export const LOAD_AUTH_FAIL = 'tb/auth/LOAD_FAIL';
export const LOGIN = 'tb/auth/LOGIN';
export const LOGIN_SUCCESS = 'tb/auth/LOGIN_SUCCESS';
export const LOGIN_FAIL = 'tb/auth/LOGIN_FAIL';
export const EMAIL_REGISTRATION = 'tb/auth/REGISTER_WITH_EMAIL';
export const EMAIL_REGISTRATION_FAIL = 'tb/auth/REGISTER_WITH_EMAIL_FAIL';
export const EMAIL_REGISTRATION_SUCCESS = 'tb/auth/REGISTER_WITH_EMAIL_SUCCESS';
export const CHANGE_PASSWORD_SUCCESS = 'tb/auth/CHANGE_PASSWORD_SUCCESS';
export const ACTIVATION_CODE = 'tb/auth/ACTIVATION_CODE';
export const ACTIVATION_CODE_SUCCESS = 'tb/auth/ACTIVATION_CODE_SUCCESS';
export const ACTIVATION_CODE_FAIL = 'tb/auth/ACTIVATION_CODE_FAIL';
export const SET_USER_IP = 'tb/auth/SET_USER_IP';
export const SET_USER_DEVICE_ID = 'tb/auth/SET_USER_DEVICE_ID';
export const SET_USER_DEVICE_FIRST_SEEN = 'tb/auth/SET_USER_DEVICE_FIRST_SEEN';
export const CLEAR_LOGIN_ERROR = 'tb/auth/CLEAR_LOGIN_ERROR';
export const OTT_REQUEST_ACTIVATION_CODE_PENDING = 'tb/auth/OTT_REQUEST_ACTIVATION_CODE_PENDING';
export const OTT_SET_ACTIVATION_CODE_TOKEN = 'tb/auth/OTT_SET_ACTIVATION_CODE_TOKEN';
export const OTT_CLEAR_ACTIVATION_CODE_TOKEN = 'tb/auth/OTT_CLEAR_ACTIVATION_CODE_TOKEN';
export const SET_LOGIN_CALLBACK = 'tb/auth/SET_LOGIN_CALLBACK';
export const SET_LOGIN_REDIRECT = 'tb/auth/SET_LOGIN_REDIRECT';
export const SET_LOGIN_CANCELED_CALLBACK = 'tb/auth/SET_LOGIN_CANCELED_CALLBACK';
export const CLEAR_LOGIN_ACTIONS = 'tb/auth/CLEAR_LOGIN_ACTIONS';
export const LOGOUT = 'tb/auth/LOGOUT';
export const LOGOUT_SUCCESS = 'tb/auth/LOGOUT_SUCCESS';
export const LOGOUT_FAIL = 'tb/auth/LOGOUT_FAIL';
export const STORE_PARENTAL_PASSWORD = 'tb/auth/STORE_PARENTAL_PASSWORD';
export const CLEAR_PARENTAL_PASSWORD = 'tb/auth/CLEAR_PARENTAL_PASSWORD';
export const STORE_USER_CREDENTIALS = 'tb/auth/STORE_USER_CREDENTIALS';
export const REMOVE_USER_CREDENTIALS = 'tb/auth/REMOVE_USER_CREDENTIALS';
export const SET_LAST_MAGIC_LINK_UID = 'tb/auth/SET_LAST_MAGIC_LINK_UID';
export const RESET_AUTH = 'tb/auth/RESET_AUTH';
export const OTT_ONE_TAP_PENDING = 'tb/auth/OTT_ONE_TAP_PENDING';
export const UPDATE_USER = 'tb/auth/UPDATE_USER';

/** userSettings */
export const UPDATE_SETTINGS = 'tb/userSettings/UPDATE_SETTINGS';
export const UPDATE_SETTINGS_SUCCESS = 'tb/userSettings/UPDATE_SETTINGS_SUCCESS';
export const UPDATE_SETTINGS_FAIL = 'tb/userSettings/UPDATE_SETTINGS_FAIL';
export const LOAD_SETTINGS = 'tb/userSettings/LOAD_SETTINGS';
export const LOAD_SETTINGS_SUCCESS = 'tb/userSettings/LOAD_SETTINGS_SUCCESS';
export const LOAD_SETTINGS_FAIL = 'tb/userSettings/LOAD_SETTINGS_FAIL';
export const DELETE_ACCOUNT = 'tb/userSettings/DELETE_ACCOUNT';
export const DELETE_ACCOUNT_SUCCESS = 'tb/userSettings/DELETE_ACCOUNT_SUCCESS';
export const DELETE_ACCOUNT_FAIL = 'tb/userSettings/DELETE_ACCOUNT_FAIL';
export const UPDATE_PARENTAL_SUCCESS = 'tb/userSettings/UPDATE_PARENTAL_SUCCESS';
export const SET_PARENTAL_RATING = 'tb/userSettings/SET_PARENTAL_RATING';
export const SET_SETTINGS_SUBTITLE_ACTIVE = 'tb/userSettings/SET_SETTINGS_SUBTITLE_ACTIVE';
export const RESET_PARENTAL = 'tb/userSettings/RESET_PARENTAL';
export const SET_COPPA_STATE = 'tb/userSettings/SET_COPPA_STATE';

/** queue */
export const ADD_TO_QUEUE = 'tb/queue/ADD';
export const ADD_TO_QUEUE_SUCCESS = 'tb/queue/ADD_SUCCESS';
export const ADD_TO_QUEUE_FAIL = 'tb/queue/ADD_FAIL';
export const REMOVE_FROM_QUEUE_SUCCESS = 'tb/queue/REMOVE_FROM_QUEUE_SUCCESS';
export const REMOVE_FROM_QUEUE_FAIL = 'tb/queue/REMOVE_FROM_QUEUE_FAIL';
export const LOAD_QUEUE = 'tb/queue/LOAD_LIST';
export const LOAD_QUEUE_SUCCESS = 'tb/queue/LOAD_LIST_SUCCESS';
export const LOAD_QUEUE_FAIL = 'tb/queue/LOAD_LIST_FAIL';
export const UNLOAD_QUEUE = 'tb/queue/UNLOAD_LIST';

/** reminder */
export const ADD_TO_REMINDER = createActionTypes('tb/reminder/ADD');
export const REMOVE_FROM_REMINDER = createActionTypes('tb/reminder/REMOVE');
export const LOAD_REMINDER = createActionTypes('tb/reminder/LOAD');

/** linear reminder */
export const ADD_LINEAR_REMINDER = createActionTypes('tb/linearReminder/ADD');
export const REMOVE_LINEAR_REMINDER = createActionTypes('tb/linearReminder/REMOVE');
export const LOAD_LINEAR_REMINDER = createActionTypes('tb/linearReminder/LOAD');

/** view history */
export const ADD_TO_HISTORY = 'tb/history/ADD_TO_HISTORY';
export const ADD_TO_HISTORY_SUCCESS = 'tb/history/ADD_TO_HISTORY_SUCCESS';
export const ADD_TO_HISTORY_FAIL = 'tb/history/ADD_TO_HISTORY_FAIL';
export const LOAD_HISTORY = 'tb/history/LOAD_LIST';
export const LOAD_HISTORY_SUCCESS = 'tb/history/LOAD_HISTORY_SUCCESS';
export const LOAD_HISTORY_FAIL = 'tb/history/LOAD_LIST_FAIL';
export const REMOVE_FROM_HISTORY = 'tb/history/REMOVE_FROM_HISTORY';
export const REMOVE_FROM_HISTORY_SUCCESS = 'tb/history/REMOVE_FROM_HISTORY_SUCCESS';
export const ITEM_REMOVED_ON_SEPARATE_DEVICE = 'tb/history/ITEM_REMOVED_ON_SEPARATE_DEVICE';
export const REMOVE_FROM_HISTORY_FAIL = 'tb/history/REMOVE_FROM_HISTORY_FAIL';
export const UNLOAD_HISTORY = 'tb/history/UNLOAD_LIST';
export const LOAD_HISTORY_BY_ID = 'tb/history/LOAD_HISTORY_BY_ID';
export const LOAD_HISTORY_BY_ID_SUCCESS = 'tb/history/LOAD_HISTORY_BY_ID_SUCCESS';
export const LOAD_HISTORY_BY_ID_FAIL = 'tb/history/LOAD_HISTORY_BY_ID_FAIL';

/** event tracking & experimentation */
export const SET_EXPERIMENT_NAMESPACE = 'tb/experiments/SET_EXPERIMENT_NAMESPACE';
export const LOG_EXPERIMENT_EXPOSURE = 'tb/experiments/LOG_EXPERIMENT_EXPOSURE';
export const CLEAR_LOGGED_EXPOSURES = 'tb/experiments/CLEAR_LOGGED_EXPOSURES';
export const SET_REMOTE_CONFIG = 'tb/experiments/SET_REMOTE_CONFIG';
export const ADD_GLOBAL_OVERRIDE = 'tb/tracking/ADD_GLOBAL_OVERRIDE';
export const ADD_EXPERIMENT_OVERRIDE = 'tb/experiments/ADD_EXPERIMENT_OVERRIDE';
export const REMOVE_EXPERIMENT_OVERRIDE = 'tb/experiments/REMOVE_EXPERIMENT_OVERRIDE';
export const REMOVE_EXPERIMENT_OVERRIDE_NAMESPACE = 'tb/experiments/REMOVE_EXPERIMENT_OVERRIDE_NAMESPACE';
export const RESTORE_EXPERIMENT_OVERRIDES = 'tb/experiments/RESTORE_EXPERIMENT_OVERRIDES';
export const ADD_PERFORMANCE_TAG = 'tb/tracking/ADD_PERFORMANCE_TAG';
export const SET_TRACKING_INPUT_DEVICE = 'tb/tracking/SET_TRACKING_INPUT_DEVICE';

/** ui related */
export const TOGGLE_LOGIN_UI = 'tb/ui/TOGGLE_LOGIN_UI';
export const HIDE_LOGIN_UI = 'tb/ui/HIDE_LOGIN_UI';
export const TOGGLE_SECONDARY_NAV = 'tb/ui/TOGGLE_SECONDARY_NAV';
export const SHOW_TOP_NAV = 'tb/ui/SHOW_TOP_NAV';
export const HIDE_TOP_NAV = 'tb/ui/HIDE_TOP_NAV';
export const SET_SCROLLED_TO_TOP = 'tb/ui/SET_SCROLLED_TO_TOP';
export const SET_TOGGLE_TOP_NAV_ON_SCROLL = 'tb/ui/SET_TOGGLE_TOP_NAV_ON_SCROLL';
export const TOGGLE_CONTAINER_MENU = 'tb/ui/TOGGLE_CONTAINER_MENU';
export const SHOW_CONTAINER_MENU = 'tb/ui/SHOW_CONTAINER_MENU';
export const HIDE_CONTAINER_MENU = 'tb/ui/HIDE_CONTAINER_MENU';
export const SHOW_LIVE_NEWS_MENU = 'tb/ui/SHOW_LIVE_NEWS_MENU';
export const HIDE_LIVE_NEWS_MENU = 'tb/ui/HIDE_LIVE_NEWS_MENU';
export const SET_TOUCH_DEVICE = 'tb/ui/SET_TOUCH_DEVICE';
export const SET_USER_AGENT = 'tb/ui/SET_USER_AGENT';
export const SET_NOT_FOUND = 'tb/ui/SET_NOT_FOUND';
export const SET_SERVICE_UNAVAILABLE = 'tb/ui/SET_SERVICE_UNAVAILABLE';
export const ADD_NOTIFICATION = 'tb/ui/ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'tb/ui/REMOVE_NOTIFICATION';
export const CLEAR_SCREENSAVER_COUNTER = 'tb/ui/CLEAR_SCREENSAVER_TIMER';
export const DECREASE_SCREENSAVER_COUNTER = 'tb/ui/DECREASE_SCREENSAVER_TIMER';
export const RESET_USER_IDLE_TIME_REMAINING = 'tb/ui/RESET_USER_IDLE_TIME_REMAINING';
export const DECREASE_USER_IDLE_TIME_REMAINING = 'tb/ui/DECREASE_USER_IDLE_TIME_REMAINING';
export const TOGGLE_ACCOUNT_CARD = 'tb/ui/TOGGLE_ACCOUNT_CARD';
export const SET_RENDERED_CONTAINERS_COUNT = 'tb/ui/SET_RENDERED_CONTAINERS_COUNT';
export const SET_SLOW_DEVICE_STATUS = 'tb/ui/SET_SLOW_DEVICE_STATUS';
export const ENABLE_KEY_DOWN = 'tb/ui/ENABLE_KEY_DOWN';
export const DISABLE_KEY_DOWN = 'tb/ui/DISABLE_KEY_DOWN';
export const ADD_TRANSITION_COMPLETE_CB = 'tb/ui/ADD_TRANSITION_COMPLETE_CB';
export const CLEAR_TRANSITION_COMPLETE_CBS = 'tb/ui/CLEAR_TRANSITION_COMPLETE_CBS';
export const SET_SETTINGS_SUBPANEL = 'tb/ui/SET_SETTINGS_SUBPANEL';
export const SET_DEEPLINK_TYPE = 'tb/ui/SET_DEEPLINK_TYPE';
export const SET_DEEPLINK_BACK_OVERRIDE = 'tb/ui/SET_DEEPLINK_BACK_OVERRIDE';
export const SET_BROWSE_WHILE_WATCHING_BACK_OVERRIDE = 'tb/ui/SET_BROWSE_WHILE_WATCHING_BACK_OVERRIDE';
export const SET_SELECTED_CONTENT = 'tb/ui/SET_SELECTED_CONTENT';
export const ENTER_FULLSCREEN = 'tb/ui/ENTER_FULLSCREEN';
export const EXIT_FULLSCREEN = 'tb/ui/EXIT_FULLSCREEN';
export const SET_KIDS_MODE = 'tb/ui/SET_KIDS_MODE';
export const SET_ESPANOL_MODE = 'tb/ui/SET_ESPANOL_MODE';
export const RESET_UI_CONTAINER_INDEX_MAP = 'tb/ui/RESET_UI_CONTAINER_INDEX_MAP';
export const SET_USER_LANGUAGE = 'tb/ui/SET_USER_LANGUAGE';
export const SET_TWO_DIGIT_COUNTRY_CODE = 'tb/ui/SET_TWO_DIGIT_COUNTRY_CODE';
export const SET_PREFERRED_LOCALE = 'tb/ui/SET_PREFERRED_LOCALE';
export const SET_IS_FIRST_SESSION = 'tb/ui/SET_IS_FIRST_SESSION';
export const TOGGLE_AGE_GATE_MODAL = 'tb/ui/TOGGLE_AGE_GATE_MODAL';
export const TOGGLE_TRANSPORT_CONTROL = 'tb/ui/TOGGLE_TRANSPORT_CONTROL';
export const SHOW_CHROMECAST_AUTOPLAY = 'tb/ui/SHOW_CHROMECAST_AUTOPLAY';
export const HIDE_CHROMECAST_AUTOPLAY = 'tb/ui/HIDE_CHROMECAST_AUTOPLAY';
export const SET_WAITING_ON_VOICE_COMMAND = 'tb/ui/SET_WAITING_ON_VOICE_COMMAND';
export const TOGGLE_REGISTRATION_PROMPT = 'tb/ui/TOGGLE_REGISTRATION_PROMPT';
export const TOGGLE_REMIND_MODAL = 'tb/ui/TOGGLE_REMIND_MODAL';
export const TOGGLE_PROGRAM_DETAILS_MODAL = 'tb/ui/TOGGLE_PROGRAM_DETAILS_MODAL';
export const SET_VIEWPORT_TYPE = 'tb/ui/SET_VIEWPORT_TYPE';
export const UPDATE_CURRENT_DATE = 'tb/ui/UPDATE_CURRENT_DATE';
export const ADD_ACTIVE_TILE_PREVIEW = 'tb/ui/ADD_ACTIVE_TILE_PREVIEW';
export const REMOVE_ACTIVE_TILE_PREVIEW = 'tb/ui/REMOVE_ACTIVE_TILE_PREVIEW';
export const SET_EXIT_SIGNUP_MODAL_STATUS = 'tb/ui/SET_EXIT_SIGNUP_MODAL_STATUS';
export const SET_SIGN_OUT_TOAST_STATUS = 'tb/ui/SET_SIGN_OUT_TOAST_STATUS';
export const SET_APP_DOWNLOAD_BANNER = 'tb/ui/SET_APP_DOWNLOAD_BANNER';
export const SET_VIDEO_QUALITY_ON_LOAD = 'tb/ui/SET_VIDEO_QUALITY_ON_LOAD';
export const SET_THEATER_MODE = 'tb/ui/SET_THEATER_MODE';
export const SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN = 'tb/ui/SET_SHOW_TOAST_FOR_MOBILE_TO_OTT_SIGNIN';
export const SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND = 'tb/ui/SET_SHOW_TOAST_FOR_CONTENT_NOT_FOUND';

/** OTTPlayer */
export const SET_PROGRESS_BAR_POSITION = 'tb/ottplayer/SET_PROGRESS_BAR_POSITION';
export const SET_AD_VIDEO_DATA = 'tb/ottplayer/SET_AD_VIDEO_DATA';
export const SET_INPUT_DEVICE = 'tb/ottplayer/SET_INPUT_DEVICE';

/** ott player ui */
export const ON_PLAY = 'tb/playerui/ON_PLAY';
export const FAST_FORWARD = 'tb/playerui/FAST_FORWARD';
export const REWIND = 'tb/playerui/REWIND';
export const STEP_SEEK = 'tb/playerui/STEP_SEEK';
export const SET_TARGET_POSITION = 'tb/playerui/SET_TARGET_POSITION';
export const EXIT_SEEKING = 'tb/playerui/EXIT_SEEKING';
export const CLEAR_SEEK_TIMER = 'tb/playerui/CLEAR_SEEK_TIMER';
export const SHOW_CONTROLS = 'tb/playerui/SHOW_CONTROLS';
export const HIDE_CONTROLS = 'tb/playerui/HIDE_CONTROLS';
export const RESET_PLAYER_UI = 'tb/playerui/RESET_PLAYER_UI';
export const SET_LAST_PLAYED_CONTENT_IN_EPISODES = 'tb/playerui/SET_LAST_PLAYED_CONTENT_IN_EPISODES';

/** TRAILERS */
export const HIDE_TRAILER = 'tb/ui/HIDE_TRAILER';
export const SHOW_TRAILER = 'tb/ui/SHOW_TRAILER';

/** reset password */
export const VERIFY_RESET_TOKEN = 'tb/reset/VERIFY_RESET_TOKEN';
export const VERIFY_RESET_TOKEN_SUCCESS = 'tb/reset/VERIFY_RESET_TOKEN_SUCCESS';
export const VERIFY_RESET_TOKEN_FAIL = 'tb/reset/VERIFY_RESET_TOKEN_FAIL';

/** VIDEO PLAYER */
export const SET_RESUME_POSITION = 'tb/player/SET_RESUME_POSITION';
export const REMOVE_RESUME_POSITION = 'tb/player/REMOVE_RESUME_POSITION';
export const TRANSIT_PLAYER_STATE = 'tb/player/TRANSIT_PLAYER_STATE';
export const UPDATE_PLAYER_PROGRESS = 'tb/player/UPDATE_PLAYER_PROGRESS';
export const UPDATE_AD_PROGRESS = 'tb/player/UPDATE_AD_PROGRESS';
export const UPDATE_PLAYER_AD_INFO = 'tb/player/UPDATE_PLAYER_AD_INFO';
export const UPDATE_PLAYER_QUALITY = 'tb/player/UPDATE_PLAYER_QUALITY';
export const UPDATE_PLAYER_CAPTIONS = 'tb/player/UPDATE_PLAYER_CAPTIONS';
export const UPDATE_PLAYER_VOLUME = 'tb/player/UPDATE_PLAYER_VOLUME';
export const RESET_PLAYER = 'tb/player/RESET_PLAYER';

/** chromecast */
export const CAST_VIDEO_LOADING = 'tb/cast/CAST_VIDEO_LOADING';
export const QUEUE_CAST_VIDEO = 'tb/cast/QUEUE_CAST_VIDEO';
export const CAST_VIDEO_LOAD_SUCCESS = 'tb/cast/CAST_VIDEO_LOAD_SUCCESS';
export const CAST_VIDEO_LOAD_ERROR = 'tb/cast/CAST_VIDEO_LOAD_ERROR';
export const SET_CAST_API_AVAILABILITY = 'tb/cast/SET_CAST_API_AVAILABILITY';
export const SET_CAST_RECEIVER_STATE = 'tb/cast/SET_CAST_RECEIVER_STATE';
export const SET_CAST_CONTENT_ID = 'tb/cast/SET_CAST_CONTENT_ID';
export const SET_CAST_DEVICE_INFO = 'tb/cast/SET_CAST_DEVICE_INFO';
export const SET_CAST_POSITION = 'tb/cast/SET_CAST_POSITION';
export const SET_CAST_PLAYER_STATE = 'tb/cast/SET_CAST_PLAYER_STATE';
export const SET_CAST_VOLUME_LEVEL = 'tb/cast/SET_CAST_VOLUME_LEVEL';
export const SET_CAST_IS_MUTE = 'tb/cast/SET_CAST_IS_MUTE';
export const SET_CAST_CAPTIONS_INDEX = 'tb/cast/SET_CAST_CAPTIONS_INDEX';
export const SET_CAST_AD_STATUS = 'tb/cast/SET_CAST_AD_STATUS';

/** OTT */
export const HIDE_MODAL = 'tb/fire/HIDE_MODAL';
export const SHOW_MODAL = 'tb/fire/SHOW_MODAL';
export const SET_OTT_SELECTED_CONTAINER = 'tb/fire/SET_OTT_SELECTED_CONTAINER';
export const SET_OTT_SELECTED_SECTION = 'tb/fire/SET_OTT_SELECTED_SECTION';
export const SET_SELECTED_SERIES_EPISODE = 'tb/fire/SET_SELECTED_SERIES_EPISODE';
export const RESET_OTT_CONTAINER_INDEX_MAP = 'tb/fire/RESET_OTT_CONTAINER_INDEX_MAP';
export const SET_TIZEN_DEEPLINK_PAGE = 'tb/fire/SET_TIZEN_DEEPLINK_PAGE';
export const CLEAR_TIZEN_DEEPLINK_PAGE = 'tb/fire/CLEAR_TIZEN_DEEPLINK_PAGE';
export const SET_NATIVE_APP_VERSION = 'tb/fire/SET_NATIVE_APP_VERSION';
export const SET_SDK_VERSION = 'tb/fire/SET_SDK_VERSION';
export const SET_MODEL_CODE = 'tb/fire/SET_MODEL_CODE';
export const OPEN_LEFT_NAV = 'tb/ott/OPEN_LEFT_NAV';
export const CLOSE_LEFT_NAV = 'tb/ott/CLOSE_LEFT_NAV';
export const SET_LEFT_NAV_OPTION = 'tb/ott/SET_LEFT_NAV_OPTION';
export const SET_OTT_DEVICE_INFO = 'tb/ott/SET_OTT_DEVICE_INFO';
export const PAUSE_BG_ROTATION = 'tb/ott/PAUSE_BG_ROTATION';
export const SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT = 'tb/ottui/SET_IF_BG_IMAGE_MATCH_ACTIVE_CONTENT';
export const SHOW_AGE_GATE_COMPONENT = 'tb/ott/SHOW_AGE_GATE_COMPONENT';
export const SHOW_KIDS_MODE_ELIGIBILITY_MODAL = 'tb/ott/SHOW_KIDS_MODE_ELIGIBILITY_MODAL';
export const SET_DEVICE_DEAL = 'tb/ott/SET_DEVICE_DEAL';
export const SET_ISD = 'tb/ott/SET_ISD';
export const SET_RSD = 'tb/ott/SET_RSD';
export const SET_TALKBACK_ENABLED = 'tb/ott/SET_TALKBACK_ENABLED';
export const SET_OTT_INPUT_MODE = 'tb/ott/SET_OTT_INPUT_MODE';
export const SET_OTT_VIDEO_PREVIEW = 'tb/ott/SET_OTT_VIDEO_PREVIEW';
export const SET_OTT_AUTOSTART_VIDEO_PREVIEW = 'tb/ott/SET_OTT_AUTOSTART_VIDEO_PREVIEW';
export const SET_OTT_AUTOPLAY_ENABLED = 'tb/ott/SET_OTT_AUTOPLAY_ENABLED';
export const SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW = 'tb/ott/SET_OTT_PROMPT_AUTOSTART_VIDEO_PREVIEW';
export const SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW = 'tb/ott/SET_OTT_EXPIRED_AUTOSTART_VIDEO_PREVIEW';
export const SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW = 'tb/ott/SET_OTT_NAVIGATING_VIA_AUTOSTART_VIDEO_PREVIEW';
export const SET_EPG_ACTIVE_CONTENT = 'tb/ott/SET_EPG_ACTIVE_CONTENT';
export const SET_INTRO_ENDED = 'tb/ott/SET_INTRO_ENDED';
export const SET_INTRO_DISABLED = 'tb/ott/SET_INTRO_DISABLED';
export const SET_FEATURES_EDUCATED = 'tb/ott/SET_FEATURES_EDUCATED';

export const SET_NEED_RESET_APP = 'tb/auth/SET_NEED_RESET_APP';
export const APP_RESET_START = 'tb/fire/APP_RESET_START';
export const APP_RESET_FAIL = 'tb/fire/APP_RESET_FAIL';
export const APP_RESET_SUCCESS = 'tb/fire/APP_RESET_SUCCESS';

export const HOT_DEEPLINK_START = 'tb/fire/HOT_DEEPLINK_START';
export const HOT_DEEPLINK_FINISHED = 'tb/fire/HOT_DEEPLINK_FINISHED';

export const SET_IN_APP_MESSAGE_CONTENT = 'tb/fire/SET_IN_APP_MESSAGE_CONTENT';
export const DISMISS_IN_APP_MESSAGE_CONTENT = 'tb/fire/DISMISS_IN_APP_MESSAGE_CONTENT';
export const SET_IN_APP_MESSAGE_TOAST_VISIBLE = 'tb/fire/SET_IN_APP_MESSAGE_TOAST_VISIBLE';

export const SHOW_SIDE_SHEET = 'tb/ott/SHOW_SIDE_SHEET';
export const HIDE_SIDE_SHEET = 'tb/ott/HIDE_SIDE_SHEET';
export const SET_SIDE_SHEET_ACTIVE_AREA = 'tb/ott/SET_SIDE_SHEET_ACTIVE_AREA';
export const TAKE_SIDE_SHEET_ACTION = 'tb/ott/TAKE_SIDE_SHEET_ACTION';

export const SET_ACTIVE_DISCOVERY_ROW_CONTAINER = 'tb/ott/SET_ACTIVE_DISCOVERY_ROW_CONTAINER';
export const SET_DISCOVERY_ROW_PILL_ACTIVE = 'tb/ott/SET_DISCOVERY_ROW_PILL_ACTIVE';
export const RESET_DISCOVERY_ROW_STATE = 'tb/ott/RESET_DISCOVERY_ROW_STATE';

export const ENTER_YOU_MAY_ALSO_LIKE_ROW = 'tb/ott/ENTER_YOU_MAY_ALSO_LIKE_ROW';
export const LEAVE_YOU_MAY_ALSO_LIKE_ROW = 'tb/ott/LEAVE_YOU_MAY_ALSO_LIKE_ROW';

/** CAPTION SETTINGS */
export const SET_CAPTION_SETTINGS = 'tb/cc/SET_CAPTION_SETTINGS';
export const SET_DEFAULT_CAPTIONS = 'tb/cc/SET_DEFAULT_CAPTIONS';
export const SET_DEFAULT_AUDIO_TRACKS = 'tb/cc/SET_DEFAULT_AUDIO_TRACKS';
export const LOAD_LOCAL_CAPTIONS = 'tb/cc/LOAD_LOCAL_CAPTIONS';
export const RESET_CAPTION_SETTINGS = 'tb/cc/RESET_CAPTION_SETTINGS';
export const WEB_SET_CAPTION_SETTINGS = 'tb/cc/WEB_SET_CAPTION_SETTINGS';
export const WEB_SET_CAPTION_SIZE = 'tb/cc/WEB_SET_CAPTION_SIZE';
export const WEB_SET_CAPTION_BACKGROUND = 'tb/cc/WEB_SET_CAPTION_BACKGROUND';

/** A11y for accessibility/VoiceView */
export const SET_A11Y = 'tb/a11y/SET_A11Y';
export const CLEAR_A11Y = 'tb/a11y/CLEAR_A11Y';
export const ENABLE_NATIVE_TTS = 'tb/a11y/ENABLE_NATIVE_TTS';
export const DISABLE_NATIVE_TTS = 'tb/a11y/DISABLE_NATIVE_TTS';

/** container grid */
export const SET_CONTAINER_GRID_ACTIVE_ID = 'tb/contGrid/SET_CONTAINER_GRID_ACTIVE_ID';
export const SET_NETWORK_CONTAINER_GRID_ACTIVE_ID = 'tb/contGrid/SET_NETWORK_CONTAINER_GRID_ACTIVE_ID';
export const SET_CONTAINER_GRID_PREVIEW_ID = 'tb/contGrid/SET_CONTAINER_GRID_PREVIEW_ID';
export const SET_CONTAINER_VIDEO_GRID_ACTIVE_ID = 'tb/contGrid/SET_CONTAINER_VIDEO_GRID_ACTIVE_ID';
export const CLEAR_CONTAINER_SECTION_IDS = 'tb/contGrid/CLEAR_CONTAINER_SECTION_IDS';
export const START_TO_UPDATE_HOME_ACTIVE_DATA = 'tb/contGrid/START_TO_UPDATE_HOME_ACTIVE_DATA';
export const SET_SHOULD_LOAD_HOMESCREEN_AFTER_RENDER = 'tb/contGrid/SET_SHOULD_LOAD_HOMESCREEN_AFTER_RENDER';

/** browse while watching */
export const SET_BROWSE_WHILE_WATCHING_CACHE_KEY = 'tb/browseWhileWatching/SET_BROWSE_WHILE_WATCHING_CACHE_KEY';

/** legal asset */
export const LOAD_LEGAL_ASSET = 'tb/legalAsset/LOAD_LEGAL_ASSET';
export const LOAD_LEGAL_ASSET_SUCCESS = 'tb/legalAsset/LOAD_LEGAL_ASSET_SUCCESS';
export const LOAD_LEGAL_ASSET_FAIL = 'tb/legalAsset/LOAD_LEGAL_ASSET_FAIL';

/** live video related */
export const SET_LIVE_ACTIVE_CONTENT = 'tb/live/SET_LIVE_ACTIVE_CONTENT';
export const SET_LIVE_LOADING = 'tb/live/SET_LOADING';
export const SET_LIVE_CHANNEL = 'tb/live/SET_CHANNEL';
export const SET_LIVE_COUNTDOWN_FOR_FULLSCREEN = 'tb/live/SET_COUNTDOWN_FOR_FULLSCREEN';
export const SET_LIVE_VIDEO_PLAYER = 'tb/live/SET_VIDEO_PLAYER';
export const SET_LIVE_CONTAINER_INDEX = 'tb/live/SET_LIVE_CONTAINER_INDEX';
export const SET_CHANNEL_GUIDE_LOADED = 'tb/live/SET_CHANNEL_GUIDE_LOADED';
export const SET_LIVE_CONSOLE_VISIBLE = 'tb/live/SET_LIVE_CONSOLE_VISIBLE';
export const SET_LIVE_PLAYER_READY_STATE = 'tb/live/SET_LIVE_PLAYER_READY_STATE';

export const SET_CAPTIONS_FROM_STREAM = 'tb/live/SET_CAPTIONS_FROM_STREAM';

/** PMR */
export const LOAD_PMR = 'tb/pmr/LOAD_PMR';
export const LOAD_PMR_SUCCESS = 'tb/pmr/LOAD_PMR_SUCCESS';

/** support */
export const SET_SUPPORT_TICKET_FIELDS = 'tb/support/SET_SUPPORT_TICKET_FIELDS';
export const SET_SUPPORT_DYNAMIC_CONTENT_LOCALE_MAP = 'tb/support/SET_SUPPORT_DYNAMIC_CONTENT_LOCALE_MAP';
export const SET_SUPPORT_MOBILE_METADATA_HEADERS = 'tb/support/SET_SUPPORT_MOBILE_METADATA_HEADERS';
export const SET_HELP_CATEGORIES = 'tb/support/SET_HELP_CATEGORIES';
export const SET_HELP_CATEGORY_SECTIONS = 'tb/support/SET_HELP_CATEGORY_SECTIONS';
export const SET_HELP_CATEGORY_ARTICLES = 'tb/support/SET_HELP_CATEGORY_ARTICLES';
export const SET_HELP_ARTICLE = 'tb/support/SET_HELP_ARTICLE';
export const LOAD_HELP_CATEGORY = 'tb/support/LOAD_HELP_CATEGORY';
export const LOAD_HELP_CATEGORY_SUCCESS = 'tb/support/LOAD_HELP_CATEGORY_SUCCESS';
export const LOAD_HELP_CATEGORY_FAIL = 'tb/support/LOAD_HELP_CATEGORY_FAIL';

/** user reactions */
export const LOAD_SINGLE_TITLE_REACTION_SUCCESS = 'tb/userReactions/LOAD_SINGLE_TITLE_REACTION_SUCCESS';
export const ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS = 'tb/userReactions/ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS';
export const ADD_REACTION_FOR_MULTI_TITLES_SUCCESS = 'tb/userReactions/ADD_REACTION_FOR_MULTI_TITLES_SUCCESS';
export const REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS = 'tb/userReactions/REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS';

/** EPG **/
export const LOAD_FIRETV_LIVE_TAB_CHANNEL_IDS = createActionTypes('tb/epg/LOAD_FIRETV_LIVE_TAB_CHANNEL_IDS');
export const LOAD_EPG_CONTAINERS_IDS = createActionTypes('tb/epg/LOAD_CONTAINER_IDS');
export const LOAD_EPG_PROGRAMS = createActionTypes('tb/epg/LOAD_PROGRAMS');
export const RESET_EPG = 'tb/epg/RESET_EPG';
export const BATCH_ADD_CHANNELS = 'tb/epg/BATCH_ADD_CHANNELS';

export const ADD_FAVORITE_CHANNEL = createActionTypes('tb/epg/ADD_TO_FAVORITE');

export const BATCH_ADD_FAVORITE_CHANNEL = 'tb/epg/BATCH_ADD_TO_FAVORITE';
export const REMOVE_FAVORITE_CHANNEL = createActionTypes('tb/epg/REMOVE_TO_FAVORITE');
export const LOAD_FAVORITE_CHANNEL_IDS = createActionTypes('tb/epg/LOAD_FAVORITE_CHANNEL_IDS');
export const SET_RECOMMENDED_CHANNEL_IDS = 'tb/epg/SET_RECOMMENDED_CHANNEL_IDS';

/** person **/
export const LOAD_PERSON = createActionTypes('tb/person/LOAD_PERSON');

/** watch schedule - linear series landing **/
export const LOAD_WATCH_SCHEDULE_PROGRAMMING = createActionTypes('tb/watchSchedule/LOAD_PROGRAMMING');
export const LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS = createActionTypes(
  'tb/watchSchedule/LOAD_FEATURED_PROGRAMMINGS'
);
export const LOAD_WATCH_SCHEDULE_PROGRAMS = createActionTypes('tb/watchSchedule/LOAD_PROGRAMS');
export const SET_WATCH_SCHEDULE_NOW = 'tb/watchSchedule/NOW';
export const SET_WATCH_SCHEDULE_DATES = 'tb/watchSchedule/SET_DATES';
export const RESET_WATCH_SCHEDULE = 'tb/watchSchedule/RESET_WATCH_SCHEDULE';

/** consent **/
export const UPDATE_GDPR_CONSENT = createActionTypes('tb/consent/UPDATE_GDPR_CONSENT');
export const LOAD_GDPR_CONSENT = createActionTypes('tb/consent/LOAD_GDPR_CONSENT');
export const SET_GDPR_CONSENT_FOR_KIDS_MODE = 'tb/consent/SET_GDPR_CONSENT_FOR_KIDS_MODE';

/** fixed banner */
export const SET_FIXED_BANNER = 'tb/ui/SET_FIXED_BANNER';

/** Remote Config */
export const LOAD_REMOTE_CONFIG = createActionTypes('tb/remoteConfig/LOAD_REMOTE_CONFIG');

/** purple carpet */
export const SET_PURPLE_CARPET_STATUS = 'tb/ui/SET_PURPLE_CARPET_STATUS';
export const LOAD_PURPLE_CARPET_LISTING = createActionTypes('tb/ui/LOAD_PURPLE_CARPET_LISTING');
export const SET_PURPLE_CARPET_INDEX_STATE = 'tb/ui/SET_PURPLE_CARPET_INDEX_STATE';
export const SET_PURPLE_CARPET_LIST_LOADING_STATE = 'tb/ui/SET_PURPLE_CARPET_LIST_LOADING_STATE';

/** skins ad */
export const SET_SKINS_AD_STATUS = 'tb/ui/SET_SKINS_AD_STATUS';
export const ADD_SKINS_AD_CREATIVES = 'tb/ui/ADD_SKINS_AD_CREATIVES';
