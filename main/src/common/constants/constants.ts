/* istanbul ignore file */

import { days, hours, secs, years } from '@adrise/utils/lib/time';
import type { EventTypes } from '@tubitv/analytics/lib/events';
import { defineMessages } from 'react-intl';
import type { ValueOf } from 'ts-essentials';

import type { PlatformUppercase } from 'common/constants/platforms';
import type { User } from 'common/features/authentication/types/auth';
import type { Video } from 'common/types/video';

// Container information
export const CONTAINER_TYPES = {
  QUEUE: 'queue',
  CONTINUE_WATCHING: 'continue_watching',
  FEATURED: 'featured',
  REGULAR: 'regular',
  SHORT_FORM: 'short_form',
  PLAYLIST: 'playlist',
  CHANNEL: 'channel',
  LINEAR: 'linear',
} as const;

export type ContainerType = ValueOf<typeof CONTAINER_TYPES>;

// uapi constant values
export const REGULAR_CONTAINER_TYPES: ContainerType[] = [
  CONTAINER_TYPES.REGULAR,
  CONTAINER_TYPES.QUEUE,
  CONTAINER_TYPES.CONTINUE_WATCHING,
  CONTAINER_TYPES.CHANNEL,
];

export const TOP_SEARCHED_CONTAINER_ID = 'top_searched';
export const MY_LIKES_CONTAINER_ID = 'my_likes';
export const QUEUE_CONTAINER_ID = 'queue';
export const QUEUE_CONTAINER_LEAVING_SOON_ID = 'queue_leaving_soon';
export const HISTORY_CONTAINER_ID = 'continue_watching';
export const HISTORY_CONTAINER_LEAVING_SOON_ID = 'continue_watching_leaving_soon';
export const RECOMMENDED_CONTAINER_ID = 'recommended_for_you';
export const RECOMMENDED_LINEAR_CONTAINER_ID = 'recommended_linear_channels';
export const MOST_POPULAR_CONTAINER_ID = 'most_popular';
export const LIVE_NEWS_CONTAINER_ID = 'live_news';
export const NATIONAL_NEWS_CONTAINER_ID = 'national_news';
export const WATCH_IN_FULL_HD_CONTAINER_ID = 'watch_in_full_hd';
export const PERSONAL_CONTAINER_IDS = [RECOMMENDED_CONTAINER_ID, HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID, WATCH_IN_FULL_HD_CONTAINER_ID];
export const PERSONAL_COMING_SOON_CONTAINER_ID = 'coming_soon_crm';
export const TOP_10_IN_US_CONTAINER_ID = 'top_10_in_us';
export const TOP_10_IN_YOUR_AREA_CONTAINER_ID = 'top_10_in_your_area';
export const TOP_10_TV_SHOWS_CONTAINER_ID = 'top_10_tv_shows_on_tubi';
export const TOP_10_CONTAINER_IDS = [TOP_10_IN_US_CONTAINER_ID, TOP_10_IN_YOUR_AREA_CONTAINER_ID, TOP_10_TV_SHOWS_CONTAINER_ID];
// If the promo row from webott_firetv_dc_promotion_row becomes a permanent feature
// this list should be driven by the backend, currently this is a hack for the promo experiment
export const PROMO_CONTAINER_IDS = ['comic_content'];

export const FAVORITE_LINEAR_CHANNEL_CONTAINER_ID = 'favorite_linear_channels';

export const CW_FOR_REGISTRATION_CONTAINER_ID = 'continue_watching_for_registration';

export const PURPLE_CARPET_CONTAINER_ID = 'fox_live_events';
export const BANNER_CONTAINER_ID = 'fox_live_events_banner';

export const SEASONS_CONTENT_TYPE = 'a';
export const SERIES_CONTENT_TYPE = 's';
export const VIDEO_CONTENT_TYPE = 'v';
export const LINEAR_CONTENT_TYPE = 'l';
export const PREVIEW_CONTENT_TYPE = 'p';
export const SPORTS_EVENT_CONTENT_TYPE = 'se';

export const FEATURED_CONTAINER_ID = 'featured';
export const SCREENSAVER_CONTAINER_ID = FEATURED_CONTAINER_ID;

/**
 * container id returns in /related API, meaning a virtual container of related content grouped by different rankings.
 */
export const CONTAINER_ID_FOR_RELATED_RANKING = 'FAKE_CONTAINER_ID_FOR_RELATED_RANKING';
export const CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY = 'FAKE_CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY';

/**
 * Usual value for RELATED_CONTENTS_LIMIT is 12 on web.
 * It's changed to 14 for experiment purpose, we'll load 2 more titles for users not in experiment.
 * Because the experiment is viewport related:
   | viewport size    | titles to show  |
   |------------------|-----------------|
   | xl (treatment)   | 14              |
   | small (control)  | 12              |
 * As viewport size can change anytime, it's better for us to load 14 titles at the beginning,
 * and control the number of titles being displayed based on user's viewport size.
 **/
export const RELATED_CONTENTS_LIMIT = __ISOTT__ ? 10 : 14;
export const RELATED_CONTENTS_LIMIT_LEGACY = 12;
export const OTT_TILE_DISPLAY_COUNT = 9;
export const HOMEPAGE_INIT_CONTAINER_COUNT = 6;

export const RECOMMEND_CHANNEL_MAX_COUNT = 4;
export const FIRST_TIME_LOAD_ROW_NUM = __ISOTT__ ? 5 : HOMEPAGE_INIT_CONTAINER_COUNT + 1; // Add 1 for featured carousel;
export const NAV_LIST_SECTION = 'nav_list';
export const GRID_SECTION = 'grid';
export const NOTIFICATION_DISMISS_TIMEOUT = 5000; // ms
export const ONBOARDING_ANIMATION_INTERVAL = 5000; // ms
export const VIDEO_BUFFERING_THRESHOLD = 50; // ms
export const SHOW_SCREENSAVER_THRESHOLD = 5; // min
export const SHOW_STILL_WATCHING_THRESHOLD = 300; // min
export const APPROX_MAX_HEIGHT_FOR_ONE_ROW = 500;
export const STORE_USER_FIELDS = [
  'authType',
  'email',
  'hasAge',
  'hasPassword',
  'name',
  'refreshToken',
  'token',
  'status',
  'userId',
] as const;

// user fields expected to be sent in req.login(user)
export const LOGIN_USER_FIELDS: (keyof User)[] = [
  'accessToken',
  'authType',
  'email',
  'expiresIn',
  'hasAge',
  'hasPassword',
  'name',
  'refreshToken',
  'status',
  'userId',
];

// Custom DOM Events
export const BACK_EVENT = 'BACK_EVENT';
export const LONG_PRESS_EVENT = 'LONG_PRESS_EVENT';

export const OTT_SEEK_SPEEDS_INTERVALS = [8, 64, 512];
export const OTT_PLAYER_STATES = {
  init: 'player_init',
  playing: 'player_playing',
  buffering: 'player_buffering',
  paused: 'player_paused',
  forward: 'player_seeking_forward',
  rewind: 'player_seeking_rewind',
};
export const OTT_PLAYER_CONTENT_TYPE = {
  ad: 'content_ad',
  video: 'content_video',
  trailer: 'content_trailer',
};
export const PLAYER_CURSOR_IDLE_TIMEOUT = 3000;
export const PLAYER_CONTROL_FIRST_SHOW_TIMEOUT = 5000;
export const AUDIO_SELECT_EXPIRE_TIME = 86400;

// COOKIE constants
export const COOKIE_REDIRECT_URL = 'r_url';
export const COOKIE_DEVICE_ID = 'deviceId';
export const COOKIE_MAINTENANCE_NOTIFICATION = 'maintenance';
export const COOKIE_BELOW_MIN_AGE_COPPA = 'coppa_underage';
export const COOKIE_NATIVE_ANDROID_VERSION = 'o_cnav';
export const COOKIE_CONTAINERS_CACHE_KEY = 'containersCacheKey';

// local data constants
export const WEB_CAPTION_SETTINGS = 'web_cc';
export const WEB_AUDIO_TRACK_SELECT = 'web_audio_track_select';

// local data constants
export const LD_CUSTOM_CAPTIONS_SETTINGS = 'cc_settings';
export const LD_DEFAULT_CAPTIONS_LANG = 'default_cc_lang';
export const LD_DEFAULT_CAPTIONS_ENABLED = 'default_cc_enabled';
export const LD_DEFAULT_AUDIO_TRACKS = 'default_ad';
export const DEFAULT_CAPTION_LANGUAGE = 'English';
export const LD_DEFAULT_VIDEO_PREVIEW = 'video_preview';
export const LD_DEFAULT_AUTOSTART_VIDEO_PREVIEW = 'autostart_video_preview';
export const LD_DEFAULT_AUTOPLAY_VIDEO_PREVIEW = 'autoplay_video_preview';
export const LD_DEFAULT_PROMPT_AUTOSTART_VIDEO_PREVIEW = 'prompt_autostart_video_preview';
export const LD_FAVORITE_CHANNELS = 'favorite_channels_v2';
export const LD_APP_SNAPSHOT = 'app_snapshot';
export const LD_FEATURE_EDUCATED = 'LD_FEATURE_EDUCATED';
export const LD_SD_EXIT_PROMPT_SHOWN = 'exitPromptShown_v2';
export const LD_FIRST_SESSION_TIMESTAMP = 'LD_FIRST_SESSION_TIMESTAMP';
export const LD_DISABLE_ONE_TAP_AUTO_SELECT = 'disableOneTapAutoSelect';
export const LD_DATE_ONETAP_FIRST_SEEN = 'dateOneTapSeen';
export const LD_ONETAP_DISMISSED = 'isOneTapDismissed';
export const LD_DATE_AMAZON_SSO_PROMPT_FIRST_SEEN = 'dateAmazonSSOPromptFirstSeen_v2';
export const LD_AMAZON_SSO_PROMPT_SHOWN = 'isAmazonSSOPromptShown_v2';
export const LD_APP_DOWNLOAD_BANNER_DISMISSED = 'isAppDownloadBannerDismissed';
export const LD_VOD_PLAYBACK_SESSION_SNAPSHOT = 'vod_playback_session_snapshot';

export const HOMESCREEN_USER_PREFERENCES_PARAM = 'personalizationHomescreenUserPreferencesParam';

// custom query params
export const START_POS_QUERY = 'startPos';
export const REDIRECT_FROM = 'r_from';
export const REFERER = 'from';

export const RESUME_TIME_QUERY = 'resume_time';
export const CONSENT_REDIRECT_FROM_QUERY_PARAM = 'redirect_from';
export const SIGN_OUT_STATUS = 'signOutStatus';

export enum REDIRECT_FROM_VALUE {
  RELAUNCH_LINEAR = 'relaunch_linear',
  RELAUNCH_VOD = 'relaunch_vod',
}

// breakpoint kicks in at val. at 960, we are in 'lg' breakpoint
export const BREAKPOINTS = {
  xs: 0,
  sm: 375,
  sMd: 540,
  md: 768,
  lg: 960,
  xl: 1170,
  xxl: 1440,
};

// when seeking, playback may start from the beginning of belong segment, hls segment is usually less than 20
export const SEEK_TOLERANCE_OFFSET = 20;
export const RESTART_CLOSE_OFFSET = 10;
export const MAX_RESEEK_ATTEMPTS = 4;

// experiment
export const legalExpOverridePrefix = 'x-exp-';
export const legalExpOverrides = [
  'x-content-likes',
  'x-enable-syscat',
  'x-featured-rotation',
  'x-exp-abtest',
];

// tracking the path from where requests are sent during ssr
export const X_CLIENT_PATH = 'x-client-path';

// external links
export const tubiLogoURL = 'https://mcdn.tubitv.com/tubitv-assets/img/tubi_open-graph-512x512.png';
export const tubiLogoSize = '512';
export const INVERTED_PAGE_PATHNAMES = ['static', 'login', 'signup', 'activate', 'register', 'preference', 'privacy', 'legal-report', 'accessibility'];
export const IGNORE_INVERTED_PAGE_PATHNAMES = [
  '/static/supported-browsers',
];
// CDN update: Temporarily accommodate the cdn.adrise.tv domain by changing DEFAULT_PROFILE_PIC_URL to an array
export const DEFAULT_PROFILE_PIC_URL = [
  'https://cdn.adrise.tv/tubitv-assets/img/default_profile_pic.png',
  'https://mcdn.tubitv.com/tubitv-assets/img/default_profile_pic.png',
];

// @tim subject to change
export const HIDE_TOP_NAV_PATHNAMES = ['activate', 'watch', 'login', 'signup', 'password', 'forgot', 'reset', 'signin-with-magic-link', 'enter-password', 'registration-link', 'email-confirmation', 'auth-error'];
export const STATIC_TOP_NAV_PATHNAMES = ['account', 'static', 'preference'];

export const genderOptionsMessages = defineMessages({
  male: {
    description: 'male option',
    defaultMessage: 'Male',
  },
  female: {
    description: 'female option',
    defaultMessage: 'Female',
  },
  other: {
    description: 'other option',
    defaultMessage: 'Other',
  },
});

export const OTT_STALE_DURATION = hours(3); // if the server was suspended for more than specific time
export const ONE_WEEK = days(7);
export const ONE_HOUR = hours(1);
export const ONE_SECOND = 1000;
export const ONE_MONTH = days(30);

// GOTCHA: On xbox if you set a cookie on the client-side with a max-age that is
// too high, the cookie doesn't get set. This value is known to work on xbox.
export const NUM_SECONDS_IN_FIFTY_YEARS = years(50) / secs(1);

export const FULLSCREEN_CHANGE_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
];

export enum EXPERIMENT_MANAGER_EVENTS {
  logExposure = 'experiment_log_exposure',
}

const CAST_APPLICATION_IDS = {
  staging: '323D7CF2',
  production: 'AB2C7FED',
};
export const CAST_APPLICATION_ID = __PRODUCTION__ ? CAST_APPLICATION_IDS.production : CAST_APPLICATION_IDS.staging;
export const ENABLE_MAINTENANCE_NOTIFICATION = false;
export const BACK_FROM_PLAYBACK_TO_DETAIL = 'playbackToDetail';
export const BACK_FROM_DETAIL_TO_HOME = 'detailToHome';
export const BACK_FROM_LIVE_PLAYBACK_TO_HOME = 'liveToHome';
export const BACK_FROM_TUBI_TO_ENTRANCE = 'tubiToEntrance';
export const BACK_FROM_CONTAINER_TO_HOME = 'containerToHome';

/**
 * add those constant for React to refer same variable
 * if you need placeholder declaration, like `const v = obj || {}`, you might replace `{}` with `FREEZED_EMPTY_OBJECT`
 * to avoid initial new variable in every run-time executing scope
 * along with React performance suggestion
 *
 * @TODO:
 * it's not technically safe
 * can be re-assigned (bad for JavaScript)
 * looking for immutable helper later
 */
export const FREEZED_EMPTY_ARRAY = [];
export const FREEZED_EMPTY_FUNCTION = () => { };
export const FREEZED_EMPTY_OBJECT = {};

// Comcast Specific constants
export const COMCAST_LOGIN_ERROR = 'LOGIN_001';
export const COMCAST_ROUTE_CHANGE_ERROR = 'ROUTE_CHANGE_001';
export const COMCAST_DEBOUNCE_TIME = 300;

export const IS_PERFORMANCE_COLLECTING_ON = true;

export const OTT_SEARCH_RESULTS_CACHE_DURATION = /* mins */ 5 * /* secs */ 60 * /* ms */ 1000;
export const SEARCH_RESULTS_CACHE_COUNT = __IS_SLOW_PLATFORM__ ? 3 : 10;

// client performance metrics
export const PERF_METRIC_KEYS = [
  'domComplete',
  'domContentLoadedEventEnd',
  'domInteractive',
] as const;
export const REQ_TIMINGS_STORAGE = 'REQ_TIMINGS_STORAGE';
export const IS_APP_STARTED_UP = 'IS_APP_STARTED_UP';

export const PLAYER_PERF_METRIC_KEYS = [
  'ManifestLoaded',
  'LevelLoaded',
  'FragLoaded',
  'timeupdate',
];

export const PLAYER_QOS_METRIC_INCREMENT_TYPE_KEYS = [
  'playFailure',
  'playBreakOff',
  'seekCount',
  'resumeFailureAfterMidroll',
  'resumeCount',
  'startupFailure',
  'adCount',
  'adNotStartupCount',
  'bufferingAdCount',
  'errorAdCount',
];

export const PLAYER_QOS_METRIC_DISTRIBUTION_TYPE_KEYS = [
  'viewTime',
  'bufferingDuration',
  'seekDuration',
  'contentFirstFrameDuration',
  'resumeFirstFrameDuration',
  'bufferingCount',
  'adViewTime',
  'adFirstFrameDuration',
];

export const COMPUTED_PERF_METRICS = {
  appDocLoadTime: 'appDocLoadTime',
  documentDownloadTime: 'documentDownloadTime',
  introAnimationDuration: 'introAnimationDuration',
  introDocLoadTime: 'introDocLoadTime', // TODO delete since it could be replaced by introPageLoadTime and introAnimationPrepareTime
  introPageLoadTime: 'introPageLoadTime',
  introAnimationPrepareTime: 'introAnimationPrepareTime',
  introDocDownloadTime: 'introDocDownloadTime',
  introDocTTFB: 'introDocTTFB',
  introVideoLoadDuration: 'introVideoLoadDuration',
  ttfb: 'ttfb',
  webviewPrepareTime: 'webviewPrepareTime',
  webviewReadyToUseTime: 'webviewReadyToUseTime',
  appStartUpDuration: 'appStartUpDuration',
} as const;

export const RESOURCE_TYPES = {
  js: {
    extensions: ['.js'],
  },
  css: {
    extensions: ['.css'],
  },
  image: {
    extensions: ['.jpg', '.png', '.svg'],
  },
};
export const RESOURCE_TYPES_KEYS = Object.keys(RESOURCE_TYPES) as (keyof typeof RESOURCE_TYPES)[];

export const COMCAST_EXIT_MESSAGE = 'ExitMessage.TUBI';

export enum HOME_DATA_SCOPE {
  all = 'all',
  firstScreen = 'firstScreen',
  loadRest = 'loadRest',
}

export const IS_SENDBEACON_ON = !__ISOTT__ || __IS_ANDROIDTV_HYB_PLATFORM__ || [
  'COMCAST',
  'COMCASTHOSP',
  'ROGERS',
  'FIRETV_HYB',
  'PS5',
  'XBOXONE',
  'LGTV',
  'SHAW',
  'VERIZONTV',
  'NETGEM',
].includes(__OTTPLATFORM__);

/**
 * Indicates whether Youbora is active on the current platform.
 * It doesn't mean Youbora will report, which is controlled by remote config. It's used to get remote config.
 */
export const IS_YOUBORA_ACTIVE = !__ISOTT__ || __IS_ANDROIDTV_HYB_PLATFORM__ || [
  'COMCAST',
  'COMCASTHOSP',
  'ROGERS',
  'COX',
  'FIRETV_HYB',
  // @todo tim CONFIRM WE WANT TO TURN THIS ON AT LAUNCH
  'PS5',
  'PS4',
  'SONY',
  'TIVO',
  'TIZEN',
  'VIZIO',
  'XBOXONE',
  'LGTV',
  'SHAW',
  'VERIZONTV',
  'NETGEM',
].includes(__OTTPLATFORM__);

export const SHOULD_FETCH_DATA_ON_SERVER = !!__WEBPLATFORM__ && !__IS_FAILSAFE__;

// Component key strings used in Analytics redesign
// https://github.com/adRise/protos/blob/master/analytics/events.proto#L552
export const ANALYTICS_COMPONENTS = {
  navigationDrawerComponent: 'navigation_drawer_component',
  // To analytics these are categories, internally they are containers
  containerComponent: 'category_component',
  autoplayComponent: 'auto_play_component',
  relatedComponent: 'related_component',
  episodeVideoListComponent: 'episode_video_list_component',
  searchResultComponent: 'search_result_component',
};

export const TRACK_NAVIGATE_WITHIN_PAGE_WAIT_TIME = 3000;
// platform specific constants
export const DEVICE_LANGUAGE = 'DEVICE_LANGUAGE';
export const DEVICE_RESOLUTION = 'DEVICE_RESOLUTION';

// form related
export const REGISTRATION_FORM_FIELD_NAMES = {
  FIRST_NAME: 'firstName',
  EMAIL: 'email',
  PASSWORD: 'password',
  PASSWORD2: 'password2',
  BIRTH_MONTH: 'birthMonth',
  BIRTH_DAY: 'birthDay',
  BIRTH_YEAR: 'birthYear',
  GENDER: 'gender',
  SUBMIT: 'submit',
  AGE: 'age',
  PERSONALIZED_EMAILS: 'personalizedEmails',
} as const;

export const SSO_CHOICES = {
  SSO_GOOGLE: 'GOOGLE',
};

export const NOT_SPECIFIED = 'NOT_SPECIFIED';
// minimum build code where a hybrid app will support "native back"
export const HYB_APP_NATIVE_BACK_MIN_BUILD_CODE = 151;
// minimum build code where a hybrid app will support "new analytics"
export const HYB_APP_NATIVE_NEW_ANALYTICS_MIN_BUILD_CODE = 295;
// minimum build code where a hybrid app will support "drm"
export const HYB_APP_NATIVE_DRM_MIN_BUILD_CODE = 345;
// minimum build code where FireTV will enable HDMI connect/disconnect handler
export const FIRETV_HDMI_CONNECT_HANDLER_BUILD_CODE = 496;
// minimum build for utilizing login with amazon
export const LOGIN_WITH_AMAZON_MIN_BUILD_CODE = 623;
// minimum build for the support of Google One-Tap sign-in
export const LOGIN_WITH_GOOGLE_ONE_TAP_MIN_BUILD_CODE = 726;
// minimum build for supporting amazon continue watching
export const FIRETV_CONTINUE_WATCHING_MIN_BUILD_CODE = 810;
// minimum build for supporting purple carpet;
export const HYB_APP_PURPLE_CARPET_BUILD_CODE = 847;

export const TITLE_TAG_MAX_LENGTH = 75;

export type CONTENT_MODE_VALUE = 'movie' | 'tv' | 'linear' | 'myStuff' | 'all' | 'latino' | 'browseWhileWatching';

export const CONTENT_MODES: Record<string, CONTENT_MODE_VALUE> = {
  movie: 'movie',
  tv: 'tv',
  linear: 'linear',
  myStuff: 'myStuff',
  all: 'all',
  // 'latino' is required for backend
  // but for client side, it is more appropriate to rename it to 'espanol'
  // see more reasons: https://github.com/adRise/www/pull/7015#pullrequestreview-691380858
  espanol: 'latino',
  // backend has no concept of `browseWhileWatching` but it is used on the client
  browseWhileWatching: 'browseWhileWatching',
} as const;

export const LIVE_CONTENT_MODES = {
  all: 'tubitv_us_linear',
  sports: 'tubitv_epg_sports',
  news: 'tubitv_epg_news',
} as const;

export type LiveContentMode = ValueOf<typeof LIVE_CONTENT_MODES>;

export enum CONTAINER_GROUPINGS {
  CHANNELS = 'Channels',
  COLLECTIONS = 'Collections',
  GENRES = 'Genres',
  POPULAR = 'Popular',
}

export const DEBUGGER_LAUNCHER_URL = process.env.DEBUGGER_LAUNCHER_URL
  || 'https://remote-debugger-1.staging-public.tubi.io/scripts/launcher.js';

export const AUTO_START_CONTENT = 'start';

export const DEEPLINK_KIDSMODE_IDENTIFIER = 'kidsmode';

export enum EMAIL_ADDRESS {
  CONTENT_SUBMISSIONS = 'content-submissions@tubi.tv',
  PARTNERSHIPS = 'partnerships@tubi.tv',
}

export const COUNTDOWN_SECONDS_FOR_FULLSCREEN = 10;

export const KEY_REPEAT_DEBOUNCE_TIME = 200;

export const IS_PLATFORM_CHECK_FOR_DRM = __IS_ANDROIDTV_HYB_PLATFORM__
  || ['FIRETV_HYB'].includes(__OTTPLATFORM__);

export const IS_PLATFORM_SUPPORT_WEBP = !!(__WEBPLATFORM__ || ['COMCAST', 'HISENSE'].includes(__OTTPLATFORM__));

export const IS_RESOURCE_TIMING_SAMPLE_RATE_ENABLED = !!(__WEBPLATFORM__
  || __IS_ANDROIDTV_HYB_PLATFORM__
  || [
    'COMCAST', 'FIRETV_HYB', 'PS4', 'TIZEN', 'VIZIO', 'XBOXONE',
  ].includes(__OTTPLATFORM__));

// must be listed version or higher
export const MINIMUM_APP_VERSION_FOR_DRM: { [K in PlatformUppercase]?: number; } = {
  FIRETV_HYB: 345, // version build 345 & above can play DRM
};
__ANDROIDTV_HYB_PLATFORMS__.forEach(platform => {
  MINIMUM_APP_VERSION_FOR_DRM[platform] = 483;
});

export const SHOW_UPDATE_APP_MODAL_BELOW_VERSION: { [K in PlatformUppercase]?: number; } = {
  // We want to encourage PS4 users on v1 or less to update, predominantly to get faster loading due to the enabling
  // of prefetch during intro animation.
  // TODO: We will create a hotfix to uncomment the following line and delete this one after the native package is approved
  // PS4: 2,
};

// Enable COPPA for given platforms
export const IS_COPPA_ENABLED = !__ISOTT__ || [
  'FIRETV_HYB',
  'COMCAST',
  'TIZEN',
  'ANDROIDTV',
  'VERIZONTV',
  'VIZIO',
  'XBOXONE',
  'PS4',
  'PS5',
  'HISENSE',
  'SONY',
  'LGTV',
  'COX',
  'ROGERS',
  'SHAW',
  'TIVO',
  'DIRECTVHOSP',
  'BRIDGEWATER',
  'NETGEM',
].includes(__OTTPLATFORM__);

// Enable COPPA age-gate for given platforms, if set to true it will age-gate users with no age
export const IS_COPPA_AGE_GATE_ENABLED = !__ISOTT__ || ['FIRETV_HYB'].includes(__OTTPLATFORM__);

// Enable COPPA exit kids mode age-gate for given platforms, if set to true it will age-gate users exiting kids mode
export const IS_COPPA_EXIT_KIDS_MODE_ENABLED = true;

// The platform and build code supports `openAppStore` on native side
export const OPEN_APP_STORE_AVAILABLE_PLATFORM_AND_BUILD_CODE = [
  ['FIRETV_HYB', 529],
];
__ANDROIDTV_HYB_PLATFORMS__.forEach(platform => {
  OPEN_APP_STORE_AVAILABLE_PLATFORM_AND_BUILD_CODE.push([platform, 525]);
});

// These apps use the screensaver, enable our local screensaver on it
export const IS_PLATFORM_SUPPORT_SCREENSAVER = ['TIZEN', 'TIVO'].includes(__OTTPLATFORM__);

// TIZEN and XBOXONE don't support URL redirecting, like redirecting to sign out
export const IS_SUPPORT_REDIRECTING = !['TIZEN', 'XBOXONE'].includes(__OTTPLATFORM__);

const isWebPlatform = !!__WEBPLATFORM__;
// @xdai @nick TODO: Uncomment this line when we decide to enable mature content gate.
// export const ENABLE_MATURE_CONTENT_GATE = isWebPlatform || ['FIRETV_HYB'].includes(__OTTPLATFORM__);
export const ENABLE_MATURE_CONTENT_GATE =
  __DEVELOPMENT__ || __STAGING__ ? isWebPlatform || ['FIRETV_HYB'].includes(__OTTPLATFORM__) : isWebPlatform;

// Url health state
export const NETWORK_HEALTH = {
  GOOD: 'good',
  ERROR: 'error',
};

export const ACTIVE_AREA = {
  keyboard: 0,
  grid: 1,
  autocomplete: 2,
};

export const ENABLE_OTT_MOUSE_EVENTS = ['LGTV'].includes(__OTTPLATFORM__);

// exported here to allow for easier testing of changes to ENABLE_OTT_MOUSE_EVENTS
export const shouldEnableMouseEvents = () => {
  return ENABLE_OTT_MOUSE_EVENTS;
};

export const IS_LONG_PRESS_EVENT_ENABLED = !__IS_SLOW_PLATFORM__;

export const VIEWPORT_TYPE = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
} as const;

// Prevent exiting app directly from linear deep link if back button is pressed
export const DISABLE_FROM_TUBI_TO_ENTRANCE = ['COMCAST', 'XBOXONE'].includes(__OTTPLATFORM__);

export const EPG_EPISODE_PREFERRED_TITLE_KEYWORD = 'EpisodeTitle_IsPreferred';

export const DISCOVERY_ROW_INDEX = 8;

export const DEEPLINK_TO_PLAYER_INFO = 'deeplink-to-player-info';

export const ONBOARDING_PREFERENCES_CONTAINER_ID = 'onboarding_preferences';
export const INTRO_ROOT_ID = 'intro';

/*
 * The educated state is kept as a four digit binary number, each bit representing the educated status of one feature.
 * Initial value is 0b0000.
 * 1. Every time a feature is explored by the user (educated), use OR operation to add it.
 *    For example, 0000 | 1000 => 1000, which means the user has explored LiveTV.
 *                 1000 | 0100 => 1100, the user has explored LiveTV and TubiKids.
 *
 * 2. To check if user has explored one feature or not, use AND operation and check the result value.
 *    For example, 1100 & 0010 => 0000, meaning that user has not explored Originals.
 *                 1100 & 1000 => 1000, the result is not 0, meaning that user has explored LiveTV.
 *
 * In this way, it's much easier to do comparison and validation.
 * - To validate a value stored in client, check if value >= 0b0000(0) && value <= 0b1111 (15).
 * - To check if all four features are explored, just check if value ==== 0b1111.
 *
 * We run the feature education experiment progressively.
 * For v1, the feature to be educated is LiveTV.
 */
export const FEATURE_TO_EDUCATE = {
  LiveTV: 0b1000,
  // TubiKids: 0b0100,
  // Originals: 0b0010,
  // Espanol: 0b0001,
};
// export const ALL_FEATURES_EDUCATED = 0b1111;
export const ALL_FEATURES_EDUCATED = FEATURE_TO_EDUCATE.LiveTV;
export const NON_FEATURES_EDUCATED = 0b0000;

export const EPISODE_PAGINATION_PAGE_SIZE = __OTTPLATFORM__ ? 30 : 20;

export const PROGRAM_KEY_URL_PARAM = 'pKey';

// cap to 60 seconds for live playback buffering
export const LIVE_BUFFERING_TIMEOUT = 60 * 1000;

export const PLAY_PROGRESS_INTERVAL = secs(10);
export enum EXPERIMENT_IN_YOUBORA {
  NO,
  YES,
  HIGH_PRIORITY,
}

export const YOUBORA_EXPERIMENT_OPTION = 'content.customDimension.7';

export enum BUFFER_END_OPERATION {
  UNKNOWN = 'unknown',
  BUFFER_APPENDED = 'buffer_appended',
  JUMP_HOLE = 'jump_hole',
  NUDGE = 'nudge',
  PLAYER_EXIT = 'player_exit'
}

/**
 * 0.5 : tolerance needed as some browsers stalls playback before reaching buffered end
 * referenced from
 * https://github.com/adRise/web_ott_npm_private_packages/blob/f4b4cb6b8e327aac9243efec130c0361b22720e8/packages/hls.js/src/controller/stream-controller.ts#L922
 */
export const NO_BUFFER_THRESHOLD = 0.5;

export const LIVE_NUDGE_OFFSET = 0.5;
/**
 * FIXME We don't have language information for specific channel/container yet,
 *  so I hardcode this
 */
export const SPANISH_CONTAINERS = ['espanol'];

// See: https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
export const LGTV_WEBOS_3_CHROME_VERSION = 38;
export const LGTV_WEBOS_4_CHROME_VERSION = 53;
export const LGTV_WEBOS_5_CHROME_VERSION = 68;
export const CC_OFF = 'off';

/* istanbul ignore next */
export const TOKEN_REQUEST_MAX_RETRY_COUNT = __WEBPLATFORM__ ? 1 : 2;

/**
 * Constant we can iterate for thumbnail sprite temporal resolutions
 *
 * 5x spritesheets contain images separates by 5 seconds
 * 10x spritesheets contain images separates by 10 seconds
 * etc.
 */
export const THUMBNAIL_TEMPORAL_RESOLUTIONS = ['5x', '10x', '20x'] as const;

// limit the type query on the node server for a security issue.
export const CMS_THUMBNAIL_SPRITES_API_TYPES = ['1x', '5x', '10x', '20x', '30x'];

export const STUBIOS_HOSTNAMES = {
  STAGING: 'staging-stubios.production-public.tubi.io',
  PROD: 'stubios.tubitv.com',
};

export const WEB_HOSTNAME = 'https://tubitv.com';

export const SESSION_REFRESH_MAX_AGE = days(1);
export const SESSION_REFRESH_COOKIE = 'connect.sid.updated';

export const SENTRY_ON_LOAD_EVENT_NAME = 'tubi:sentry-on-load';

export const CUSTOM_EVENT_NAME = 'tubi:custom-event';
export const CUSTOM_EVENT_TYPES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
};

export const BROADCAST_CHANNEL_NAMES = {
  WEB: 'tubi:web',
};
export const BROADCAST_CHANNEL_EVENTS = {
  LOGIN_STATUS_CHANGE: 'LOGIN_STATUS_CHANGE',
};

export const ADVERTISER_ID_CLIENT_HEADER_NAME = 'x-idfa';

export const OTT_SEARCH_MAX_KEYWORD_LEN = 60;

export type SentryRate = {
  error: number;
  transition: number;
};

export type RemoteConfigState = {
  activation_code_status_polling_interval?: number;
  auth_comcast_email_prefill_enabled?: boolean;
  auth_google_onetap_enabled?: boolean;
  auth_login_with_amazon_enabled?: boolean;
  auth_magic_link_enabled?: boolean;
  auth_vizio_email_prefill_enabled?: boolean;
  blockedAnalyticsEvents: Record<string, EventTypes[]>;
  blockedLocalData: Record<string, string[]>;
  bypass_registration_gate?: boolean;
  privacyPolicyQrCodeUrl: string;
  privacyPolicyUrl: string,
  termsOfUseQrCodeUrl: string;
  termsOfUseUrl: string,
  youbora: {
    vod: boolean,
    preview: boolean,
    linear: boolean,
    trailer: boolean,
  },
  sentryRate: SentryRate,
  major_event_start?: string;
  major_event_end?: string;
  major_event_onboarding_start?: string;
  major_event_onboarding_end?: string;
  disaster_mode_enabled?: boolean;
  major_event_failsafe_start?: string;
  major_event_failsafe_end?: string;
  major_event_failsafe_maintenance_header?: string;
  major_event_failsafe_maintenance_subtext?: string;
  major_event_failsafe_maintenance_header_fr?: string;
  major_event_failsafe_maintenance_subtext_fr?: string;
  major_event_failsafe_maintenance_header_es?: string;
  major_event_failsafe_maintenance_subtext_es?: string;
  major_event_name?: string;
  country: string;
  isInBlockedCountry: boolean;
  isLiveAvailableInCountry: boolean;
  isRecommendedChannelsEnabledInCountry: boolean;
  client_log_enabled?: number;
  blocked_analytics_events?: EventTypes[];
  player_analytics_event_enabled?: number;
};

export const AUTH_ERROR_TIMESTAMP_KEY = 'encountered_error_during_registration';
export const AUTH_ERROR_EXPIRY_DURATION_IN_SEC = 60 * 60 * 12; // 12 hours

export const USER_ALREADY_SIGNED_IN_URL_PARAM = 'userAlreadySignedIn';
// Note that this key is not a secret key-- it is needed on the client side
// to make requests to branch.io and to construct branch.io deeplinks.
// It must be bundled on the client, and will be visible in all long-form
// deeplinks to branch.io. Thus it is safe to commit to the repository.
export const BRANCH_IO_KEY = 'key_live_engWioqI5aBmxG8T9gTYCdiorCj8H2Th';
export const BRANCH_IO_CUSTOM_LINK_DOMAIN = 'link.tubi.tv';
export const BRANCH_SHORT_LINK_ENDPOINT = 'https://api2.branch.io/v1/url';

export const FORCE_FAILSAFE_EXPERIMENT_COOKIE = 'force_failsafe_experiment';

export const TUBI_FAILSAFE_TWO_DIGIT_COUNTRY_HEADER = 'X-Tubi-Failsafe-Country';

export const METRICS_IN_VIDEOS_ROUTE = [
  '/oz/videos/player-exit-metrics',
  '/oz/videos/live-player-exit-metrics',
  '/oz/videos/live-ad-finished-metrics',
  '/oz/videos/live-buffer-ratio',
  '/oz/videos/live-first-frame',
  '/oz/videos/live-fatal-error',
  '/oz/videos/ad-pod-finished-metrics',
  '/oz/videos/fallback-metrics',
];
export const LOTTIE_JSON_URL = 'https://mcdn.tubitv.com/video/intro/lottie/intro_main.json';

export const DEFAULT_VIDEO_CONTENT_DISASTER: Video = {
  backgrounds: [],
  description: '',
  duration: 0,
  hero_images: [],
  id: '',
  landscape_images: [],
  posterarts: [],
  publisher_id: '',
  title: '',
  thumbnails: [],
  type: 'a',
  year: 0,
};
